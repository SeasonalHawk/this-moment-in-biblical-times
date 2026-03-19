import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateRequest, buildUserMessage } from '@/lib/validation';
import { rateLimit } from '@/lib/rateLimit';
import { buildSystemPrompt, BIBLE_STORY_TOOL, STORY_MODEL } from '@/lib/prompts';

const ELEVENLABS_VOICE_ID = 'oTQK6KgOJHp8UGGZjwUu'; // Moonlit narrator — warm bedtime voice
const ELEVENLABS_MODEL = 'eleven_flash_v2_5'; // Fastest English model
const BRANDING_OUTRO = 'This story is brought to you by This Moment in Biblical Times. Goodnight, and God bless.';

/**
 * Unified streaming pipeline: Bible story generation → TTS → NDJSON response.
 *
 * Response format (newline-delimited JSON):
 *   {"type":"story", "story":"...", "title":"...", ...}\n
 *   {"type":"audio", "audio":"<base64>", "alignment":{...}}\n
 *
 * The story line is flushed immediately so the client can display it
 * while TTS is still generating on the server (server-side overlap).
 * The audio event includes character-level alignment data for follow-along highlighting.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return Response.json({ error: 'Too many requests', retryAfter }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const result = validateRequest(body);
  if (!result.valid) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const { storyId, storyTitle, scriptureRef, bibleVersion } = result.data;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;

  if (!anthropicKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }
  if (!elevenlabsKey) {
    return Response.json({ error: 'TTS API key not configured' }, { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── Phase 1: Generate Bible story with Claude ──────────────
        const client = new Anthropic({ apiKey: anthropicKey });
        const message = await client.messages.create({
          model: STORY_MODEL,
          max_tokens: 1024,
          system: buildSystemPrompt(bibleVersion),
          tools: [BIBLE_STORY_TOOL],
          tool_choice: { type: 'tool' as const, name: 'publish_bible_story' },
          messages: [
            { role: 'user', content: buildUserMessage(result.data) }
          ]
        });

        const toolBlock = message.content.find(b => b.type === 'tool_use');
        if (!toolBlock || toolBlock.type !== 'tool_use') {
          throw new Error('No tool response received');
        }

        const input = toolBlock.input as {
          story: string;
          title: string;
          theme: string;
          scriptureReference: string;
          verseText: string;
          moral: string;
        };

        // Flush story data immediately — client can display while TTS generates
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'story',
          story: input.story,
          title: input.title || storyTitle,
          theme: input.theme || null,
          scriptureReference: input.scriptureReference || scriptureRef,
          verseText: input.verseText || null,
          moral: input.moral || null,
          storyId,
          bibleVersion,
          // Token usage for cost estimation
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        }) + '\n'));

        // ── Phase 2: Generate TTS with ElevenLabs Flash ────────────
        let outro = '\n\n';
        if (input.title) outro += `${input.title}. `;
        if (input.scriptureReference) outro += `${input.scriptureReference}. `;
        outro += `\n\n${BRANDING_OUTRO}`;

        const fullText = input.story + outro;

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
          }
        );

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text().catch(() => 'Unknown error');
          console.error('ElevenLabs API error:', ttsResponse.status, errorText);
          throw new Error('Failed to generate audio');
        }

        // Parse NDJSON chunks from with-timestamps endpoint:
        // Each line is JSON with { audio_base64, alignment? }
        // We accumulate audio buffers and merge alignment arrays.
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

        const combinedAudio = Buffer.concat(audioChunks);
        const base64Audio = combinedAudio.toString('base64');

        const audioEvent: Record<string, unknown> = {
          type: 'audio',
          audio: base64Audio,
          ttsCharacters: fullText.length,
        };

        // Include alignment data if available (graceful degradation)
        if (allCharacters.length > 0) {
          audioEvent.alignment = {
            characters: allCharacters,
            character_start_times_seconds: allStartTimes,
            character_end_times_seconds: allEndTimes,
          };
        }

        controller.enqueue(encoder.encode(JSON.stringify(audioEvent) + '\n'));

      } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        console.error('Pipeline error:', error.message);
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'error',
          error: error.message || 'Pipeline failed',
        }) + '\n'));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
