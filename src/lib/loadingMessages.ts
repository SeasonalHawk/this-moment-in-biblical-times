/**
 * Themed loading messages for each pipeline phase.
 *
 * Phase 1 (story generation): cozy bedtime / storybook theme
 * Phase 2 (audio narration): gentle storyteller preparing theme
 */

export const STORY_PHASE_MESSAGES = [
  'Opening the storybook...',
  'Finding tonight\u2019s story...',
  'Turning to the right page...',
  'The storyteller is getting ready...',
  'Lighting the bedside lamp...',
];

export const AUDIO_PHASE_MESSAGES = [
  'The storyteller clears their throat gently...',
  'A warm voice begins to speak...',
  'The narrator settles into the chair...',
  'Soft music begins to play...',
  'Getting the story just right for you...',
  'Almost ready \u2014 close your eyes...',
];

/** Pick a random element from a non-empty array. */
export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
