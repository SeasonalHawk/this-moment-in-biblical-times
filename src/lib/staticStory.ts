import type { CharacterAlignment } from './alignment';

export interface PreBuiltStory {
  story: string;
  title: string;
  theme: string;
  scriptureReference: string;
  verseText: string;
  moral: string;
  bibleVersion: string;
  storyId: string;
}

export interface PreBuiltResult {
  storyData: PreBuiltStory;
  audioBlob: Blob;
  alignment: CharacterAlignment;
}

/**
 * Attempt to load a pre-built story from static files.
 * Returns null if the story hasn't been pre-generated (triggers pipeline fallback).
 *
 * Fetches story.json, audio.mp3, and alignment.json in parallel for speed.
 */
export async function loadPreBuiltStory(storyId: string): Promise<PreBuiltResult | null> {
  const basePath = `/stories/${storyId}`;

  try {
    const [storyRes, audioRes, alignmentRes] = await Promise.all([
      fetch(`${basePath}/story.json`),
      fetch(`${basePath}/audio.mp3`),
      fetch(`${basePath}/alignment.json`),
    ]);

    // If any file is missing, fall back to on-demand pipeline
    if (!storyRes.ok || !audioRes.ok || !alignmentRes.ok) {
      return null;
    }

    const [storyData, audioBlob, alignment] = await Promise.all([
      storyRes.json() as Promise<PreBuiltStory>,
      audioRes.blob(),
      alignmentRes.json() as Promise<CharacterAlignment>,
    ]);

    return { storyData, audioBlob, alignment };
  } catch {
    // Network error or parsing failure — fall back to pipeline
    return null;
  }
}
