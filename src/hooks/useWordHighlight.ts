'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WordTiming } from '@/lib/alignment';

interface UseWordHighlightOptions {
  audioElement: HTMLAudioElement | null;
  wordTimings: WordTiming[] | null;
  enabled: boolean;
}

/**
 * Synchronizes audio playback position with a word index for follow-along highlighting.
 * Uses requestAnimationFrame for frame-accurate tracking (~60Hz).
 */
export function useWordHighlight({ audioElement, wordTimings, enabled }: UseWordHighlightOptions) {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const rafRef = useRef<number | null>(null);
  const lastIndexRef = useRef(-1);

  // Binary search for the word at the given time
  const findWordAtTime = useCallback((time: number): number => {
    if (!wordTimings || wordTimings.length === 0) return -1;

    // Quick sequential check from last known position (common case: forward playback)
    const lastIdx = lastIndexRef.current;
    if (lastIdx >= 0 && lastIdx < wordTimings.length) {
      const current = wordTimings[lastIdx];
      if (time >= current.startTime && time < current.endTime) {
        return current.wordIndex;
      }
      // Check next word
      if (lastIdx + 1 < wordTimings.length) {
        const next = wordTimings[lastIdx + 1];
        if (time >= next.startTime && time < next.endTime) {
          return next.wordIndex;
        }
      }
    }

    // Fall back to binary search
    let low = 0;
    let high = wordTimings.length - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const wt = wordTimings[mid];
      if (time < wt.startTime) {
        high = mid - 1;
      } else if (time >= wt.endTime) {
        low = mid + 1;
      } else {
        return wt.wordIndex;
      }
    }

    return -1;
  }, [wordTimings]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    stopLoop();

    const tick = () => {
      if (audioElement && !audioElement.paused) {
        const idx = findWordAtTime(audioElement.currentTime);
        if (idx !== lastIndexRef.current) {
          lastIndexRef.current = idx;
          setCurrentWordIndex(idx);
        }
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [audioElement, findWordAtTime, stopLoop]);

  // Attach audio event listeners
  useEffect(() => {
    if (!audioElement || !enabled || !wordTimings) {
      stopLoop();
      setCurrentWordIndex(-1);
      lastIndexRef.current = -1;
      return;
    }

    const handlePlay = () => startLoop();
    const handlePause = () => stopLoop();
    const handleSeeked = () => {
      const idx = findWordAtTime(audioElement.currentTime);
      lastIndexRef.current = idx;
      setCurrentWordIndex(idx);
      if (!audioElement.paused) startLoop();
    };
    const handleEnded = () => {
      stopLoop();
      setCurrentWordIndex(-1);
      lastIndexRef.current = -1;
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('seeked', handleSeeked);
    audioElement.addEventListener('ended', handleEnded);

    // If already playing, start immediately
    if (!audioElement.paused) {
      startLoop();
    }

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('seeked', handleSeeked);
      audioElement.removeEventListener('ended', handleEnded);
      stopLoop();
    };
  }, [audioElement, enabled, wordTimings, startLoop, stopLoop, findWordAtTime]);

  const reset = useCallback(() => {
    lastIndexRef.current = -1;
    setCurrentWordIndex(-1);
  }, []);

  return { currentWordIndex, reset };
}
