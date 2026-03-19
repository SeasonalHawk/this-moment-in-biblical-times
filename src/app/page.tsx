'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import TonightStoryCard from '@/components/TonightStoryCard';
import ProgressTracker from '@/components/ProgressTracker';
import StoryPlayer from '@/components/StoryPlayer';
import LoadingState, { type LoadingPhase } from '@/components/LoadingState';
import Bookshelf from '@/components/Bookshelf';
import Settings from '@/components/Settings';
import useBibleStory from '@/hooks/useBibleStory';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { getTonightsStory, markStoryHeard, getStoriesHeardCount, getHeardStoryIds } from '@/lib/storyProgress';
import { getRandomStory, type BibleStory } from '@/lib/bibleStories';
import { getBibleVersion, getFollowAlong } from '@/lib/settings';
import { pickRandom, STORY_PHASE_MESSAGES, AUDIO_PHASE_MESSAGES } from '@/lib/loadingMessages';
import { useWordHighlight } from '@/hooks/useWordHighlight';
import { mapCharacterAlignmentToWords, type WordTiming, type CharacterAlignment } from '@/lib/alignment';
import { loadPreBuiltStory } from '@/lib/staticStory';

type AppView = 'lamp' | 'bookshelf' | 'settings';

export default function Home() {
  const [view, setView] = useState<AppView>('lamp');
  const [pipelineStart, setPipelineStart] = useState<number | null>(null);
  const [phases, setPhases] = useState<LoadingPhase[]>([]);
  const [narrationEnded, setNarrationEnded] = useState(false);
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [storiesHeard, setStoriesHeard] = useState(0);
  const [heardIds, setHeardIds] = useState<Set<string>>(new Set());
  const [tonightStory, setTonightStory] = useState<BibleStory | null>(null);
  const [wordTimings, setWordTimings] = useState<WordTiming[] | null>(null);
  const [followAlong, setFollowAlongState] = useState(true);
  const phaseStartRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const bible = useBibleStory();
  const tts = useTextToSpeech();
  const bgMusic = useBackgroundMusic();

  // Keep stable refs to cleanup functions
  const ttsCleanupRef = useRef(tts.cleanup);
  const bgStopRef = useRef(bgMusic.stop);
  ttsCleanupRef.current = tts.cleanup;
  bgStopRef.current = bgMusic.stop;

  // Follow-along word highlighting (syncs audio currentTime → word index)
  const highlight = useWordHighlight({
    audioElement: tts.getAudioElement(),
    wordTimings,
    enabled: followAlong,
  });

  // Hydrate progress and tonight's story on mount
  useEffect(() => {
    setStoriesHeard(getStoriesHeardCount());
    setHeardIds(getHeardStoryIds());
    setTonightStory(getTonightsStory());
    setFollowAlongState(getFollowAlong());
  }, []);

  // Stop audio when page is closed or hidden
  useEffect(() => {
    const teardown = () => {
      if (abortRef.current) abortRef.current.abort();
      ttsCleanupRef.current();
      bgStopRef.current();
    };

    const handlePageHide = () => teardown();
    const handleVisChange = () => {
      if (document.visibilityState === 'hidden') teardown();
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisChange);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, []);

  /**
   * Unified streaming pipeline: calls /api/pipeline which returns NDJSON.
   * Phase 1: story JSON line → display story immediately
   * Phase 2: audio base64 line → decode and play
   */
  const runPipeline = useCallback(async (story: BibleStory) => {
    // Abort any in-flight pipeline
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Switch to lamp view if in bookshelf
    setView('lamp');

    // Full reset
    tts.cleanup();
    bgMusic.stop();
    setNarrationEnded(false);
    setStoryExpanded(false);
    setWordTimings(null);
    highlight.reset();

    const now = Date.now();
    setPipelineStart(now);
    phaseStartRef.current = now;

    // Pick random themed messages
    const storyMsg = pickRandom(STORY_PHASE_MESSAGES);
    const audioMsg = pickRandom(AUDIO_PHASE_MESSAGES);
    setPhases([
      { label: storyMsg, startTime: now },
      { label: audioMsg, startTime: 0 },
    ]);

    // Warm up audio elements during user click
    tts.warmUp();
    bgMusic.warmUp();
    bible.startLoading();

    const bibleVersion = getBibleVersion();

    try {
      // ── Check for pre-built static files (instant playback) ──
      const preBuilt = await loadPreBuiltStory(story.id);
      if (preBuilt && !controller.signal.aborted) {
        // Skip loading phases — serve instantly
        setPhases([]);
        setPipelineStart(null);

        bible.setResult({
          story: preBuilt.storyData.story,
          storyId: story.id,
          metadata: {
            title: preBuilt.storyData.title,
            theme: preBuilt.storyData.theme,
            scriptureReference: preBuilt.storyData.scriptureReference,
            verseText: preBuilt.storyData.verseText,
            moral: preBuilt.storyData.moral,
          },
        });

        // Mark as heard and update progress
        markStoryHeard(story.id);
        setStoriesHeard(getStoriesHeardCount());
        setHeardIds(getHeardStoryIds());

        // Process alignment data for follow-along
        try {
          const timings = mapCharacterAlignmentToWords(
            preBuilt.alignment,
            preBuilt.storyData.story,
          );
          setWordTimings(timings);
        } catch {
          // Alignment failed — continue without highlighting
        }

        // Play audio instantly
        await tts.playBlob(preBuilt.audioBlob, {
          onStart: () => {
            bgMusic.play();
            setStoryExpanded(true);
          },
          onEnd: () => {
            bgMusic.fadeOut();
            setNarrationEnded(true);
          },
        });

        return; // Done — skip pipeline
      }

      // ── Fall back to on-demand pipeline ──
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: story.id, bibleVersion }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Pipeline failed' }));
        throw new Error(data.error || 'Pipeline failed');
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.trim()) continue;

          let event;
          try {
            event = JSON.parse(line);
          } catch {
            console.warn('Skipping malformed NDJSON line:', line.slice(0, 100));
            continue;
          }

          if (event.type === 'story') {
            const storyEnd = Date.now();
            phaseStartRef.current = storyEnd;

            setPhases(prev => [
              { ...prev[0], endTime: storyEnd },
              { ...prev[1], startTime: storyEnd },
            ]);

            bible.setResult({
              story: event.story,
              storyId: story.id,
              metadata: {
                title: event.title || story.title,
                theme: event.theme || null,
                scriptureReference: event.scriptureReference || story.scriptureRef,
                verseText: event.verseText || null,
                moral: event.moral || null,
              },
            });

            // Mark as heard and update progress
            markStoryHeard(story.id);
            setStoriesHeard(getStoriesHeardCount());
            setHeardIds(getHeardStoryIds());

            tts.setLoadingState(true);
          }

          if (event.type === 'audio') {
            const audioEnd = Date.now();

            setPhases(prev => [
              prev[0],
              { ...prev[1], endTime: audioEnd },
            ]);

            // Process alignment data for follow-along highlighting
            if (event.alignment && bible.story) {
              try {
                const timings = mapCharacterAlignmentToWords(
                  event.alignment as CharacterAlignment,
                  bible.story,
                );
                setWordTimings(timings);
              } catch {
                // Alignment mapping failed — continue without highlighting
              }
            }

            // Decode base64 → blob → play
            const binaryString = atob(event.audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' });

            await tts.playBlob(blob, {
              onStart: () => {
                bgMusic.play();
                setStoryExpanded(true);
              },
              onEnd: () => {
                bgMusic.fadeOut();
                setNarrationEnded(true);
              },
            });
          }

          if (event.type === 'error') {
            throw new Error(event.error);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      bible.setErrorState((err as Error).message || 'Something went wrong');
      tts.setLoadingState(false);
    } finally {
      setPipelineStart(null);
    }
  }, [tts, bgMusic, bible]);

  const handleReadToMe = (story: BibleStory) => {
    if (pipelineStart) return;
    runPipeline(story);
  };

  const handleAnotherStory = () => {
    if (pipelineStart) return;
    const another = getRandomStory(bible.activeStoryId ?? undefined);
    runPipeline(another);
  };

  const handleTogglePlayPause = (): boolean => {
    const nowPlaying = tts.togglePlayPause();
    if (nowPlaying) {
      bgMusic.resume();
    } else {
      bgMusic.pause();
    }
    return nowPlaying;
  };

  const handleReplay = () => {
    setNarrationEnded(false);
    highlight.reset();
    tts.replay();
    bgMusic.play();
  };

  const handleCloseStory = () => {
    if (abortRef.current) abortRef.current.abort();
    tts.cleanup();
    bgMusic.stop();
    bible.clear();
    setPipelineStart(null);
    setPhases([]);
    setNarrationEnded(false);
    setStoryExpanded(false);
    setWordTimings(null);
    highlight.reset();
  };

  // ── Bookshelf View ──
  if (view === 'bookshelf') {
    return (
      <Bookshelf
        heardStoryIds={heardIds}
        onBack={() => setView('lamp')}
        onReadToMe={handleReadToMe}
      />
    );
  }

  // ── Settings View ──
  if (view === 'settings') {
    return (
      <Settings
        onClose={() => setView('lamp')}
        onFollowAlongChange={setFollowAlongState}
      />
    );
  }

  // ── Storybook Lamp Home ──
  return (
    <div className="min-h-screen bg-indigo-950 text-amber-50">
      {/* Header */}
      <header className="py-6">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between">
          <div />
          <button
            onClick={() => setView('settings')}
            className="p-2 rounded-lg text-indigo-400 hover:text-amber-50 hover:bg-indigo-800 transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 pb-8 space-y-6">
        {/* Lamp icon + greeting */}
        <div className="text-center space-y-3 pt-4">
          {/* Soft lamp glow */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 animate-pulse">
            <span className="text-3xl" role="img" aria-label="Lamp">🪔</span>
          </div>
          <h1 className="text-2xl font-bold text-amber-400 font-serif">
            Good Evening
          </h1>
          <p className="text-indigo-300 text-sm">
            Time for a bedtime story
          </p>
        </div>

        {/* Tonight's Story Card */}
        {tonightStory && !bible.story && !bible.loading && (
          <TonightStoryCard
            story={tonightStory}
            onReadToMe={handleReadToMe}
            disabled={pipelineStart !== null}
          />
        )}

        {/* Loading state */}
        {phases.length > 0 && (
          <LoadingState
            phases={phases}
            pipelineStart={pipelineStart}
            autoExpand={pipelineStart !== null}
            autoCollapse={tts.playing}
          />
        )}

        {/* Error state */}
        {bible.error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-center">
            <p className="text-red-400">{bible.error}</p>
            <button
              onClick={() => tonightStory && runPipeline(tonightStory)}
              className="mt-2 text-sm text-red-300 underline hover:text-red-200 cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Story Player */}
        {bible.story && (
          <StoryPlayer
            story={bible.story}
            title={bible.metadata.title}
            theme={bible.metadata.theme}
            scriptureReference={bible.metadata.scriptureReference}
            verseText={bible.metadata.verseText}
            moral={bible.metadata.moral}
            bibleVersion={getBibleVersion()}
            expanded={storyExpanded}
            onToggle={() => setStoryExpanded(prev => !prev)}
            onClose={handleCloseStory}
            spinning={bible.loading || tts.loading}
            audio={{
              playing: tts.playing,
              paused: tts.paused,
              hasAudio: tts.hasAudio,
              loading: tts.loading,
              togglePlayPause: handleTogglePlayPause,
              replay: handleReplay,
            }}
            music={{
              muted: bgMusic.muted,
              toggleMute: bgMusic.toggleMute,
            }}
            narrationEnded={narrationEnded}
            followAlongWordIndex={highlight.currentWordIndex}
            followAlongEnabled={followAlong}
          />
        )}

        {/* Secondary buttons */}
        {!bible.loading && !pipelineStart && (
          <div className="flex gap-3">
            <button
              onClick={handleAnotherStory}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-800 text-indigo-200 hover:bg-indigo-700 hover:text-amber-50 transition-colors text-sm font-medium cursor-pointer"
              aria-label="Get another random story"
            >
              Another Story
            </button>
            <button
              onClick={() => {
                handleCloseStory();
                setView('bookshelf');
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-800 text-indigo-200 hover:bg-indigo-700 hover:text-amber-50 transition-colors text-sm font-medium cursor-pointer"
              aria-label="Browse all stories"
            >
              📚 Browse Stories
            </button>
          </div>
        )}

        {/* Progress tracker */}
        <ProgressTracker storiesHeard={storiesHeard} />
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-900 py-4 mt-auto">
        <div className="max-w-lg mx-auto px-4 text-center text-indigo-600 text-xs">
          Built with Kajiro IQ Pro | Powered by Anthropic Claude | This Moment in Biblical Times
        </div>
      </footer>
    </div>
  );
}
