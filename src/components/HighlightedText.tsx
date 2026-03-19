'use client';

import { useEffect, useRef } from 'react';
import { splitIntoWords } from '@/lib/alignment';

interface HighlightedTextProps {
  text: string;
  currentWordIndex: number;
  enabled: boolean;
}

/**
 * Renders story text with word-level highlighting for follow-along reading.
 * When enabled, each word is a <span> and the active word gets a warm glow.
 * When disabled, renders plain text with zero overhead.
 */
export default function HighlightedText({ text, currentWordIndex, enabled }: HighlightedTextProps) {
  const activeRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll the active word into view
  useEffect(() => {
    if (enabled && activeRef.current && activeRef.current.scrollIntoView) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentWordIndex, enabled]);

  if (!enabled) {
    return <>{text}</>;
  }

  const words = splitIntoWords(text);

  // Rebuild the text with spans for each word, preserving original whitespace
  const elements: React.ReactNode[] = [];
  let searchFrom = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordStart = text.indexOf(word, searchFrom);

    // Add any whitespace before this word
    if (wordStart > searchFrom) {
      elements.push(text.slice(searchFrom, wordStart));
    }

    const isActive = i === currentWordIndex;
    elements.push(
      <span
        key={i}
        ref={isActive ? activeRef : undefined}
        className={
          isActive
            ? 'bg-amber-300/40 rounded px-0.5 transition-colors duration-150'
            : 'transition-colors duration-150'
        }
      >
        {word}
      </span>
    );

    searchFrom = wordStart + word.length;
  }

  // Add any trailing whitespace
  if (searchFrom < text.length) {
    elements.push(text.slice(searchFrom));
  }

  return <>{elements}</>;
}
