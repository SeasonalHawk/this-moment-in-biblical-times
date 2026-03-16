/**
 * Story progress tracking via localStorage.
 *
 * Tracks which stories have been heard and manages the
 * "Tonight's Story" rotation — cycling through all stories
 * without repeating until the full catalog is complete.
 */

import { BIBLE_STORIES, TOTAL_STORIES, type BibleStory } from './bibleStories';

const STORAGE_KEY_HEARD = 'stories-heard';
const STORAGE_KEY_TONIGHT_INDEX = 'tonight-index';
const STORAGE_KEY_TONIGHT_DATE = 'tonight-date';

interface ProgressData {
  /** Set of story IDs that have been heard */
  heard: Set<string>;
  /** Index into the shuffled rotation for tonight's pick */
  tonightIndex: number;
  /** ISO date string of the last time tonight's story was set */
  tonightDate: string;
}

/**
 * Load progress from localStorage.
 */
function loadProgress(): ProgressData {
  if (typeof window === 'undefined') {
    return { heard: new Set(), tonightIndex: 0, tonightDate: '' };
  }

  const heardRaw = localStorage.getItem(STORAGE_KEY_HEARD);
  const heard = heardRaw ? new Set<string>(JSON.parse(heardRaw)) : new Set<string>();
  const tonightIndex = parseInt(localStorage.getItem(STORAGE_KEY_TONIGHT_INDEX) ?? '0', 10);
  const tonightDate = localStorage.getItem(STORAGE_KEY_TONIGHT_DATE) ?? '';

  return { heard, tonightIndex, tonightDate };
}

/**
 * Mark a story as heard.
 */
export function markStoryHeard(storyId: string): void {
  if (typeof window === 'undefined') return;

  const { heard } = loadProgress();
  heard.add(storyId);
  localStorage.setItem(STORAGE_KEY_HEARD, JSON.stringify([...heard]));
}

/**
 * Check if a story has been heard.
 */
export function isStoryHeard(storyId: string): boolean {
  const { heard } = loadProgress();
  return heard.has(storyId);
}

/**
 * Get the number of stories heard.
 */
export function getStoriesHeardCount(): number {
  const { heard } = loadProgress();
  return heard.size;
}

/**
 * Get all heard story IDs.
 */
export function getHeardStoryIds(): Set<string> {
  return loadProgress().heard;
}

/**
 * Get tonight's story — a deterministic daily pick that rotates
 * through the catalog. Changes once per calendar day.
 *
 * The rotation is sequential through the catalog. When all stories
 * have been cycled, it wraps back to the beginning.
 */
export function getTonightsStory(): BibleStory {
  if (typeof window === 'undefined') {
    return BIBLE_STORIES[0];
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { tonightIndex, tonightDate } = loadProgress();

  if (tonightDate === today) {
    // Same day — return the same story
    return BIBLE_STORIES[tonightIndex % TOTAL_STORIES];
  }

  // New day — advance the index
  const newIndex = tonightDate === '' ? 0 : (tonightIndex + 1) % TOTAL_STORIES;
  localStorage.setItem(STORAGE_KEY_TONIGHT_INDEX, String(newIndex));
  localStorage.setItem(STORAGE_KEY_TONIGHT_DATE, today);

  return BIBLE_STORIES[newIndex];
}

/**
 * Clear all progress (for testing or reset).
 */
export function clearProgress(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY_HEARD);
  localStorage.removeItem(STORAGE_KEY_TONIGHT_INDEX);
  localStorage.removeItem(STORAGE_KEY_TONIGHT_DATE);
}
