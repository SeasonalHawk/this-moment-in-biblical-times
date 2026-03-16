'use client';

import { useState, useCallback } from 'react';

interface StoryMetadata {
  title: string | null;
  theme: string | null;
  scriptureReference: string | null;
  verseText: string | null;
  moral: string | null;
}

const emptyMetadata: StoryMetadata = {
  title: null,
  theme: null,
  scriptureReference: null,
  verseText: null,
  moral: null,
};

/**
 * State management hook for Bible story generation.
 * Replaces useHistoryStory — adapted for storyId-based pipeline.
 */
export default function useBibleStory() {
  const [story, setStory] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<StoryMetadata>(emptyMetadata);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  // Pipeline helpers — allow page.tsx to update state from streaming pipeline
  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
    setStory(null);
    setMetadata(emptyMetadata);
  }, []);

  const setResult = useCallback(
    (data: {
      story: string;
      storyId: string;
      metadata: StoryMetadata;
    }) => {
      setStory(data.story);
      setMetadata(data.metadata);
      setActiveStoryId(data.storyId);
      setLoading(false);
      setError(null);
    },
    [],
  );

  const setErrorState = useCallback((message: string) => {
    setError(message);
    setLoading(false);
    setStory(null);
    setMetadata(emptyMetadata);
    setActiveStoryId(null);
  }, []);

  const clear = useCallback(() => {
    setStory(null);
    setMetadata(emptyMetadata);
    setLoading(false);
    setError(null);
    setActiveStoryId(null);
  }, []);

  return {
    story,
    metadata,
    loading,
    error,
    activeStoryId,
    startLoading,
    setResult,
    setErrorState,
    clear,
  };
}
