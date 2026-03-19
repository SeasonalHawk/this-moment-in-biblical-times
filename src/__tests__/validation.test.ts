import { describe, it, expect } from 'vitest';
import { validateRequest, buildUserMessage, type ValidatedStoryRequest } from '@/lib/validation';
import { BIBLE_STORIES } from '@/lib/bibleStories';

describe('validateRequest', () => {
  const validStoryId = BIBLE_STORIES[0].id;

  it('accepts valid storyId without bibleVersion', () => {
    const result = validateRequest({ storyId: validStoryId });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.storyId).toBe(validStoryId);
      expect(result.data.bibleVersion).toBe('NABRE'); // default
    }
  });

  it('accepts valid storyId with valid bibleVersion', () => {
    const result = validateRequest({ storyId: validStoryId, bibleVersion: 'NIV' });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.storyId).toBe(validStoryId);
      expect(result.data.bibleVersion).toBe('NIV');
    }
  });

  it('accepts all supported Bible versions', () => {
    const versions = ['NABRE', 'NIV', 'KJV', 'ESV', 'NLT', 'NKJV'];
    for (const version of versions) {
      const result = validateRequest({ storyId: validStoryId, bibleVersion: version });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.bibleVersion).toBe(version);
      }
    }
  });

  it('rejects invalid bibleVersion', () => {
    const result = validateRequest({ storyId: validStoryId, bibleVersion: 'INVALID' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Invalid bibleVersion');
    }
  });

  it('rejects null body', () => {
    const result = validateRequest(null);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Request body is required');
    }
  });

  it('rejects missing storyId', () => {
    const result = validateRequest({});
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('storyId is required');
    }
  });

  it('rejects non-string storyId', () => {
    const result = validateRequest({ storyId: 123 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('storyId is required');
    }
  });

  it('rejects unknown storyId', () => {
    const result = validateRequest({ storyId: 'not-a-real-story' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('Unknown storyId');
    }
  });

  it('returns story title and scripture ref in validated data', () => {
    const result = validateRequest({ storyId: validStoryId });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.storyTitle).toBeTruthy();
      expect(result.data.scriptureRef).toBeTruthy();
    }
  });

  it('defaults bibleVersion to NABRE when not provided', () => {
    const result = validateRequest({ storyId: validStoryId });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.bibleVersion).toBe('NABRE');
    }
  });

  it('defaults bibleVersion to NABRE when null', () => {
    const result = validateRequest({ storyId: validStoryId, bibleVersion: null });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.bibleVersion).toBe('NABRE');
    }
  });
});

describe('buildUserMessage', () => {
  const sampleRequest: ValidatedStoryRequest = {
    storyId: 'david-and-goliath',
    storyTitle: 'David and Goliath',
    scriptureRef: '1 Samuel 17:1-54',
    bibleVersion: 'NABRE',
  };

  it('includes the story title', () => {
    const msg = buildUserMessage(sampleRequest);
    expect(msg).toContain('David and Goliath');
  });

  it('includes the scripture reference', () => {
    const msg = buildUserMessage(sampleRequest);
    expect(msg).toContain('1 Samuel 17:1-54');
  });

  it('includes the Bible version', () => {
    const msg = buildUserMessage(sampleRequest);
    expect(msg).toContain('NABRE');
  });

  it('mentions second person retelling', () => {
    const msg = buildUserMessage(sampleRequest);
    expect(msg).toContain('second person');
  });

  it('requests footer citation verse', () => {
    const msg = buildUserMessage(sampleRequest);
    expect(msg).toContain('footer citation');
  });

  it('changes version text when different version used', () => {
    const nivRequest = { ...sampleRequest, bibleVersion: 'NIV' as const };
    const msg = buildUserMessage(nivRequest);
    expect(msg).toContain('NIV');
  });
});
