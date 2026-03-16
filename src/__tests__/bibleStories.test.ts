import { describe, it, expect } from 'vitest';
import {
  BIBLE_STORIES,
  STORY_CATEGORIES,
  STORY_THEMES,
  TOTAL_STORIES,
  getStoryById,
  getStoriesByCategory,
  getRandomStory,
  type BibleStory,
} from '@/lib/bibleStories';

describe('BIBLE_STORIES catalog', () => {
  it('contains at least 60 stories', () => {
    expect(BIBLE_STORIES.length).toBeGreaterThanOrEqual(60);
  });

  it('TOTAL_STORIES matches catalog length', () => {
    expect(TOTAL_STORIES).toBe(BIBLE_STORIES.length);
  });

  it('every story has a unique id', () => {
    const ids = BIBLE_STORIES.map(s => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every story has required fields', () => {
    for (const story of BIBLE_STORIES) {
      expect(story.id).toBeTruthy();
      expect(story.title).toBeTruthy();
      expect(story.testament).toBeTruthy();
      expect(story.category).toBeTruthy();
      expect(story.themes.length).toBeGreaterThan(0);
      expect(story.scriptureRef).toBeTruthy();
      expect(story.teaser).toBeTruthy();
    }
  });

  it('every story has a valid testament', () => {
    for (const story of BIBLE_STORIES) {
      expect(['Old Testament', 'New Testament']).toContain(story.testament);
    }
  });

  it('every story belongs to a valid category', () => {
    for (const story of BIBLE_STORIES) {
      expect((STORY_CATEGORIES as readonly string[]).includes(story.category)).toBe(true);
    }
  });

  it('every story theme is a valid theme', () => {
    for (const story of BIBLE_STORIES) {
      for (const theme of story.themes) {
        expect((STORY_THEMES as readonly string[]).includes(theme)).toBe(true);
      }
    }
  });

  it('has stories in every category', () => {
    for (const category of STORY_CATEGORIES) {
      const stories = BIBLE_STORIES.filter(s => s.category === category);
      expect(stories.length).toBeGreaterThan(0);
    }
  });
});

describe('STORY_CATEGORIES', () => {
  it('contains 6 categories', () => {
    expect(STORY_CATEGORIES).toHaveLength(6);
  });

  it('Holiday Stories is the first category', () => {
    expect(STORY_CATEGORIES[0]).toBe('Holiday Stories');
  });

  it('has no duplicates', () => {
    const unique = new Set(STORY_CATEGORIES);
    expect(unique.size).toBe(STORY_CATEGORIES.length);
  });
});

describe('getStoryById', () => {
  it('returns a story for a valid id', () => {
    const firstStory = BIBLE_STORIES[0];
    const found = getStoryById(firstStory.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(firstStory.id);
  });

  it('returns undefined for invalid id', () => {
    expect(getStoryById('nonexistent-story')).toBeUndefined();
  });
});

describe('getStoriesByCategory', () => {
  it('returns stories for a valid category', () => {
    const stories = getStoriesByCategory('Old Testament Adventures');
    expect(stories.length).toBeGreaterThan(0);
    for (const story of stories) {
      expect(story.category).toBe('Old Testament Adventures');
    }
  });

  it('returns empty array for invalid category', () => {
    const stories = getStoriesByCategory('Not A Category' as never);
    expect(stories).toHaveLength(0);
  });
});

describe('getRandomStory', () => {
  it('returns a story from the catalog', () => {
    const story = getRandomStory();
    const ids = BIBLE_STORIES.map(s => s.id);
    expect(ids).toContain(story.id);
  });

  it('excludes a specific story when requested', () => {
    const firstId = BIBLE_STORIES[0].id;
    // Run multiple times to verify exclusion
    for (let i = 0; i < 20; i++) {
      const story = getRandomStory(firstId);
      expect(story.id).not.toBe(firstId);
    }
  });

  it('returns different stories over multiple calls', () => {
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(getRandomStory().id);
    }
    // With 71 stories and 50 calls, we should get at least 2 different results
    expect(results.size).toBeGreaterThan(1);
  });
});
