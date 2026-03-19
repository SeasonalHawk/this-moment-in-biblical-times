import { describe, it, expect } from 'vitest';
import {
  splitIntoWords,
  mapCharacterAlignmentToWords,
  type CharacterAlignment,
} from '@/lib/alignment';

describe('splitIntoWords', () => {
  it('splits a simple sentence into words', () => {
    expect(splitIntoWords('Hello world')).toEqual(['Hello', 'world']);
  });

  it('handles multiple spaces between words', () => {
    expect(splitIntoWords('Hello   world')).toEqual(['Hello', 'world']);
  });

  it('handles newlines as word separators', () => {
    expect(splitIntoWords('Hello\nworld')).toEqual(['Hello', 'world']);
  });

  it('handles paragraph breaks (double newlines)', () => {
    expect(splitIntoWords('Hello\n\nworld')).toEqual(['Hello', 'world']);
  });

  it('keeps punctuation attached to words', () => {
    expect(splitIntoWords('God. Jesus, Mary!')).toEqual(['God.', 'Jesus,', 'Mary!']);
  });

  it('returns empty array for empty string', () => {
    expect(splitIntoWords('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(splitIntoWords('   \n\n  ')).toEqual([]);
  });

  it('handles a single word', () => {
    expect(splitIntoWords('Hello')).toEqual(['Hello']);
  });

  it('handles leading and trailing whitespace', () => {
    expect(splitIntoWords('  Hello world  ')).toEqual(['Hello', 'world']);
  });
});

describe('mapCharacterAlignmentToWords', () => {
  it('maps character alignment to word timings for a simple string', () => {
    const text = 'Hi there';
    // H=0, i=1, (space)=2, t=3, h=4, e=5, r=6, e=7
    const alignment: CharacterAlignment = {
      characters: ['H', 'i', ' ', 't', 'h', 'e', 'r', 'e'],
      character_start_times_seconds: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
      character_end_times_seconds:   [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
    };

    const result = mapCharacterAlignmentToWords(alignment, text);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ word: 'Hi', wordIndex: 0, startTime: 0.0, endTime: 0.2 });
    expect(result[1]).toEqual({ word: 'there', wordIndex: 1, startTime: 0.3, endTime: 0.8 });
  });

  it('ignores characters beyond story text length (outro)', () => {
    const storyText = 'Hi';
    // Alignment includes story + outro characters
    const alignment: CharacterAlignment = {
      characters: ['H', 'i', ' ', 'O', 'u', 't', 'r', 'o'],
      character_start_times_seconds: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
      character_end_times_seconds:   [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
    };

    const result = mapCharacterAlignmentToWords(alignment, storyText);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('Hi');
  });

  it('returns empty array for empty text', () => {
    const alignment: CharacterAlignment = {
      characters: [],
      character_start_times_seconds: [],
      character_end_times_seconds: [],
    };
    expect(mapCharacterAlignmentToWords(alignment, '')).toEqual([]);
  });

  it('handles alignment shorter than text gracefully', () => {
    const text = 'Hello world';
    // Only 5 characters aligned (just "Hello")
    const alignment: CharacterAlignment = {
      characters: ['H', 'e', 'l', 'l', 'o'],
      character_start_times_seconds: [0.0, 0.1, 0.2, 0.3, 0.4],
      character_end_times_seconds:   [0.1, 0.2, 0.3, 0.4, 0.5],
    };

    const result = mapCharacterAlignmentToWords(alignment, text);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('Hello');
  });

  it('handles multi-paragraph story text', () => {
    const text = 'First.\n\nSecond.';
    const alignment: CharacterAlignment = {
      characters: 'First.\n\nSecond.'.split(''),
      character_start_times_seconds: Array.from({ length: 15 }, (_, i) => i * 0.1),
      character_end_times_seconds: Array.from({ length: 15 }, (_, i) => (i + 1) * 0.1),
    };

    const result = mapCharacterAlignmentToWords(alignment, text);
    expect(result).toHaveLength(2);
    expect(result[0].word).toBe('First.');
    expect(result[1].word).toBe('Second.');
  });
});
