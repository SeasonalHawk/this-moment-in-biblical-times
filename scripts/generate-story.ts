/**
 * Pre-generate a Bible story with audio + alignment data for static serving.
 *
 * Usage: pnpm generate-story <storyId>
 * Example: pnpm generate-story birth-of-jesus
 *
 * Outputs:
 *   public/stories/{storyId}/story.json     — Story text + metadata
 *   public/stories/{storyId}/audio.mp3      — Narrated audio
 *   public/stories/{storyId}/alignment.json  — Character-level timing for follow-along
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local first (has actual keys), then .env as fallback
// override: true needed because ANTHROPIC_API_KEY may be set as empty in shell env
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local'), override: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
import Anthropic from '@anthropic-ai/sdk';
import { getStoryById } from '../src/lib/bibleStories';
import { buildSystemPrompt, BIBLE_STORY_TOOL, STORY_MODEL } from '../src/lib/prompts';

// Same constants as pipeline route
const ELEVENLABS_VOICE_ID = 'oTQK6KgOJHp8UGGZjwUu';
const ELEVENLABS_MODEL = 'eleven_flash_v2_5';
const BRANDING_OUTRO = 'This story is brought to you by This Moment in Biblical Times. Goodnight, and God bless.';
const BIBLE_VERSION = 'NABRE';

async function generateStory(storyId: string) {
  const story = getStoryById(storyId);
  if (!story) {
    console.error(`Unknown storyId: "${storyId}"`);
    process.exit(1);
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;

  if (!anthropicKey) {
    console.error('Missing ANTHROPIC_API_KEY in .env.local');
    process.exit(1);
  }
  if (!elevenlabsKey) {
    console.error('Missing ELEVENLABS_API_KEY in .env.local');
    process.exit(1);
  }

  const outputDir = path.resolve(__dirname, '..', 'public', 'stories', storyId);
  fs.mkdirSync(outputDir, { recursive: true });

  // ── Phase 1: Generate story with Claude ──
  console.log(`Generating story text for "${story.title}"...`);

  const client = new Anthropic({ apiKey: anthropicKey });
  const userMessage = `Tell the Bible story "${story.title}" based on ${story.scriptureRef} (${BIBLE_VERSION} translation). Write an immersive bedtime retelling in second person — place the child inside the scene. Include a key verse from the passage in the ${BIBLE_VERSION} translation for the footer citation.`;

  const message = await client.messages.create({
    model: STORY_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(BIBLE_VERSION),
    tools: [BIBLE_STORY_TOOL],
    tool_choice: { type: 'tool' as const, name: 'publish_bible_story' },
    messages: [{ role: 'user', content: userMessage }],
  });

  const toolBlock = message.content.find(b => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    console.error('No tool response from Claude');
    process.exit(1);
  }

  const input = toolBlock.input as {
    story: string;
    title: string;
    theme: string;
    scriptureReference: string;
    verseText: string;
    moral: string;
  };

  console.log(`  Story: ${input.story.length} chars, "${input.title}"`);
  console.log(`  Tokens: ${message.usage.input_tokens} in / ${message.usage.output_tokens} out`);

  // Save story.json
  const storyData = {
    story: input.story,
    title: input.title || story.title,
    theme: input.theme,
    scriptureReference: input.scriptureReference || story.scriptureRef,
    verseText: input.verseText,
    moral: input.moral,
    bibleVersion: BIBLE_VERSION,
    storyId: story.id,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(outputDir, 'story.json'),
    JSON.stringify(storyData, null, 2),
  );
  console.log(`  Saved story.json`);

  // ── Phase 2: Generate TTS with alignment ──
  console.log(`Generating audio with alignment...`);

  let outro = '\n\n';
  if (input.title) outro += `${input.title}. `;
  if (input.scriptureReference) outro += `${input.scriptureReference}. `;
  outro += `\n\n${BRANDING_OUTRO}`;

  const fullText = input.story + outro;
  console.log(`  TTS input: ${fullText.length} chars`);

  const ttsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsKey,
      },
      body: JSON.stringify({
        text: fullText,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.7,
          style: 0.1,
        },
      }),
    },
  );

  if (!ttsResponse.ok) {
    const errorText = await ttsResponse.text().catch(() => 'Unknown error');
    console.error(`ElevenLabs API error: ${ttsResponse.status}`, errorText);
    process.exit(1);
  }

  // Parse NDJSON chunks from with-timestamps endpoint
  const ttsBody = await ttsResponse.text();
  const ttsLines = ttsBody.split('\n').filter(line => line.trim());

  const audioChunks: Buffer[] = [];
  const allCharacters: string[] = [];
  const allStartTimes: number[] = [];
  const allEndTimes: number[] = [];

  for (const line of ttsLines) {
    try {
      const chunk = JSON.parse(line);
      if (chunk.audio_base64) {
        audioChunks.push(Buffer.from(chunk.audio_base64, 'base64'));
      }
      if (chunk.alignment) {
        allCharacters.push(...(chunk.alignment.characters || []));
        allStartTimes.push(...(chunk.alignment.character_start_times_seconds || []));
        allEndTimes.push(...(chunk.alignment.character_end_times_seconds || []));
      }
    } catch {
      // Skip malformed chunks
    }
  }

  // Save audio.mp3
  const combinedAudio = Buffer.concat(audioChunks);
  fs.writeFileSync(path.join(outputDir, 'audio.mp3'), combinedAudio);
  console.log(`  Saved audio.mp3 (${(combinedAudio.length / 1024).toFixed(1)} KB)`);

  // Save alignment.json
  const alignment = {
    characters: allCharacters,
    character_start_times_seconds: allStartTimes,
    character_end_times_seconds: allEndTimes,
  };

  fs.writeFileSync(
    path.join(outputDir, 'alignment.json'),
    JSON.stringify(alignment),
  );
  console.log(`  Saved alignment.json (${allCharacters.length} chars mapped)`);

  // Summary
  console.log(`\nDone! Files saved to: public/stories/${storyId}/`);
  console.log(`  story.json     — ${input.story.split(/\s+/).length} words`);
  console.log(`  audio.mp3      — ${(combinedAudio.length / 1024).toFixed(1)} KB`);
  console.log(`  alignment.json — ${allCharacters.length} character timings`);
}

// ── CLI entry point ──
const storyId = process.argv[2];
if (!storyId) {
  console.error('Usage: pnpm generate-story <storyId>');
  console.error('Example: pnpm generate-story birth-of-jesus');
  process.exit(1);
}

generateStory(storyId).catch(err => {
  console.error('Generation failed:', err.message);
  process.exit(1);
});
