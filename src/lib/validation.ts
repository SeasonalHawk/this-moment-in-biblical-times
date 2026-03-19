/**
 * Request validation for Bible story pipeline.
 * Validates storyId-based requests (replacing the old month/day calendar validation).
 */

import { getStoryById, BIBLE_STORIES } from './bibleStories';
import { SUPPORTED_BIBLE_VERSIONS, type BibleVersion } from './settings';

export interface ValidatedStoryRequest {
  storyId: string;
  storyTitle: string;
  scriptureRef: string;
  bibleVersion: BibleVersion;
}

export function validateRequest(body: Record<string, unknown> | null) {
  if (!body || typeof body !== 'object') {
    return { valid: false as const, error: 'Request body is required' };
  }

  const { storyId, bibleVersion } = body;

  // storyId is required
  if (!storyId || typeof storyId !== 'string') {
    return { valid: false as const, error: 'storyId is required and must be a string' };
  }

  // Look up the story in the catalog
  const story = getStoryById(storyId);
  if (!story) {
    return {
      valid: false as const,
      error: `Unknown storyId: "${storyId}". Must be one of the ${BIBLE_STORIES.length} stories in the catalog.`,
    };
  }

  // Bible version is optional — validate only if provided
  const version = bibleVersion !== undefined && bibleVersion !== null
    ? String(bibleVersion)
    : null;
  if (version !== null && !SUPPORTED_BIBLE_VERSIONS.includes(version as BibleVersion)) {
    return {
      valid: false as const,
      error: `Invalid bibleVersion: "${version}". Supported: ${SUPPORTED_BIBLE_VERSIONS.join(', ')}`,
    };
  }

  const resolvedVersion: BibleVersion = (version as BibleVersion) ?? 'NABRE';

  return {
    valid: true as const,
    data: {
      storyId: story.id,
      storyTitle: story.title,
      scriptureRef: story.scriptureRef,
      bibleVersion: resolvedVersion,
    } satisfies ValidatedStoryRequest,
  };
}

/**
 * Build the user message for Claude based on the validated story request.
 */
export function buildUserMessage(data: ValidatedStoryRequest): string {
  return `Tell the Bible story "${data.storyTitle}" based on ${data.scriptureRef} (${data.bibleVersion} translation). Write an immersive bedtime retelling in second person — place the child inside the scene. Include a key verse from the passage in the ${data.bibleVersion} translation for the footer citation.`;
}
