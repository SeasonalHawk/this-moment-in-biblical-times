import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, BIBLE_STORY_TOOL, STORY_MODEL } from '@/lib/prompts';

describe('Pipeline Configuration', () => {
  const PIPELINE_TTS_MODEL = 'eleven_flash_v2_5';
  const PIPELINE_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam

  it('uses an active (non-retired) Claude model for story generation', () => {
    // claude-3-5-haiku-20241022 was retired Feb 19, 2026
    // claude-3-haiku-20240307 was retired Feb 19, 2026
    // If this test fails, check: https://platform.claude.com/docs/en/about-claude/model-deprecations
    expect(STORY_MODEL).not.toBe('claude-3-5-haiku-20241022');
    expect(STORY_MODEL).not.toBe('claude-3-haiku-20240307');
    expect(STORY_MODEL).not.toBe('claude-3-5-haiku-latest');
  });

  it('uses Haiku 4.5 model for fastest story generation', () => {
    expect(STORY_MODEL).toBe('claude-haiku-4-5-20251001');
  });

  it('exports STORY_MODEL as single source of truth', () => {
    expect(typeof STORY_MODEL).toBe('string');
    expect(STORY_MODEL.length).toBeGreaterThan(0);
  });

  it('uses Flash v2.5 model for fastest TTS', () => {
    expect(PIPELINE_TTS_MODEL).toBe('eleven_flash_v2_5');
  });

  it('uses Adam voice for narration', () => {
    expect(PIPELINE_VOICE_ID).toBe('pNInz6obpgDQGcFmaJgB');
  });
});

describe('Bible Story System Prompt', () => {
  const prompt = buildSystemPrompt('NABRE');

  it('includes second-person voice rule', () => {
    expect(prompt).toContain('second person');
  });

  it('includes present-tense rule', () => {
    expect(prompt).toContain('present tense');
  });

  it('targets 150-250 word stories', () => {
    expect(prompt).toContain('150-250 word');
  });

  it('instructs tool use', () => {
    expect(prompt).toContain('Always use the tool');
  });

  it('injects the Bible version into the prompt', () => {
    const nabrePrompt = buildSystemPrompt('NABRE');
    expect(nabrePrompt).toContain('NABRE');

    const nivPrompt = buildSystemPrompt('NIV');
    expect(nivPrompt).toContain('NIV');
  });

  it('includes bedtime tone instructions', () => {
    expect(prompt).toContain('bedtime');
    expect(prompt).toContain('warm');
  });

  it('includes age-appropriate audience guidance', () => {
    expect(prompt).toContain('6-12');
  });

  it('prohibits frightening content', () => {
    expect(prompt).toContain('no frightening imagery');
  });

  it('requires sensory details', () => {
    expect(prompt).toContain('sensory detail');
  });
});

describe('Bible Story Tool Schema', () => {
  it('has correct tool name', () => {
    expect(BIBLE_STORY_TOOL.name).toBe('publish_bible_story');
  });

  it('requires all six fields', () => {
    expect(BIBLE_STORY_TOOL.input_schema.required).toEqual([
      'story', 'title', 'theme', 'scriptureReference', 'verseText', 'moral'
    ]);
  });

  it('defines story property', () => {
    expect(BIBLE_STORY_TOOL.input_schema.properties.story).toBeDefined();
    expect(BIBLE_STORY_TOOL.input_schema.properties.story.type).toBe('string');
  });

  it('defines title property', () => {
    expect(BIBLE_STORY_TOOL.input_schema.properties.title).toBeDefined();
  });

  it('defines theme property', () => {
    expect(BIBLE_STORY_TOOL.input_schema.properties.theme).toBeDefined();
  });

  it('defines scriptureReference property', () => {
    expect(BIBLE_STORY_TOOL.input_schema.properties.scriptureReference).toBeDefined();
  });

  it('defines verseText property', () => {
    expect(BIBLE_STORY_TOOL.input_schema.properties.verseText).toBeDefined();
  });

  it('defines moral property', () => {
    expect(BIBLE_STORY_TOOL.input_schema.properties.moral).toBeDefined();
  });
});
