import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateRequest, buildUserMessage } from '@/lib/validation';
import { rateLimit } from '@/lib/rateLimit';
import { buildSystemPrompt, BIBLE_STORY_TOOL, STORY_MODEL } from '@/lib/prompts';

/**
 * Standalone Bible story endpoint (non-streaming).
 * For cases where the client doesn't need the streaming pipeline.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const result = validateRequest(body);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { storyTitle, scriptureRef, bibleVersion } = result.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const client = new Anthropic({ apiKey });
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

    return NextResponse.json({
      story: input.story,
      title: input.title || storyTitle,
      theme: input.theme || null,
      scriptureReference: input.scriptureReference || scriptureRef,
      verseText: input.verseText || null,
      moral: input.moral || null,
      bibleVersion,
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error('Claude API error:', error.message);

    if (error.status === 401) {
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to generate story' }, { status: 502 });
  }
}
