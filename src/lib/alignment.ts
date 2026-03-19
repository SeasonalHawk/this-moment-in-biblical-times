/** Raw character-level alignment from ElevenLabs with-timestamps API */
export interface CharacterAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

/** Derived word-level timing for the highlight engine */
export interface WordTiming {
  word: string;
  wordIndex: number;
  startTime: number;
  endTime: number;
}

/**
 * Split text into words preserving order. This is the shared contract between
 * the alignment mapper and the HighlightedText renderer — both MUST use this
 * function so word indices match.
 *
 * Words are sequences of non-whitespace characters. Punctuation stays attached
 * to its word (e.g., "God." is one word).
 */
export function splitIntoWords(text: string): string[] {
  return text.match(/\S+/g) || [];
}

/**
 * Build a map of character offset → word index for the story text.
 * Each non-whitespace character maps to the word it belongs to.
 */
function buildCharToWordMap(text: string): Map<number, number> {
  const map = new Map<number, number>();
  let wordIndex = 0;
  let inWord = false;

  for (let i = 0; i < text.length; i++) {
    const isWhitespace = /\s/.test(text[i]);
    if (!isWhitespace) {
      if (!inWord) {
        if (inWord === false && wordIndex > 0) {
          // already incremented below
        }
        inWord = true;
      }
      map.set(i, wordIndex);
    } else {
      if (inWord) {
        wordIndex++;
        inWord = false;
      }
    }
  }

  return map;
}

/**
 * Map character-level alignment data to word-level timings.
 *
 * Only processes characters within `storyText` — the branding outro
 * (title + scripture + "Goodnight") is ignored for highlighting purposes.
 */
export function mapCharacterAlignmentToWords(
  alignment: CharacterAlignment,
  storyText: string,
): WordTiming[] {
  const words = splitIntoWords(storyText);
  if (words.length === 0) return [];

  const { character_start_times_seconds, character_end_times_seconds } = alignment;
  const storyCharCount = storyText.length;
  const alignmentLength = Math.min(character_start_times_seconds.length, character_end_times_seconds.length);

  // Only process characters within the story text
  const limit = Math.min(storyCharCount, alignmentLength);

  const charToWord = buildCharToWordMap(storyText);

  // Track start/end times per word
  const wordStartTimes: (number | undefined)[] = new Array(words.length);
  const wordEndTimes: (number | undefined)[] = new Array(words.length);

  for (let i = 0; i < limit; i++) {
    const wordIdx = charToWord.get(i);
    if (wordIdx === undefined) continue; // whitespace character

    if (wordStartTimes[wordIdx] === undefined) {
      wordStartTimes[wordIdx] = character_start_times_seconds[i];
    }
    wordEndTimes[wordIdx] = character_end_times_seconds[i];
  }

  // Build word timings, skipping any words without timing data
  const timings: WordTiming[] = [];
  for (let i = 0; i < words.length; i++) {
    const startTime = wordStartTimes[i];
    const endTime = wordEndTimes[i];
    if (startTime !== undefined && endTime !== undefined) {
      timings.push({
        word: words[i],
        wordIndex: i,
        startTime,
        endTime,
      });
    }
  }

  return timings;
}
