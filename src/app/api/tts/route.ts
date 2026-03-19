import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

const ELEVENLABS_VOICE_ID = 'oTQK6KgOJHp8UGGZjwUu'; // Moonlit narrator — warm bedtime voice
const ELEVENLABS_MODEL = 'eleven_flash_v2_5'; // Fastest English model — lowest latency
const BRANDING_OUTRO = 'This story is brought to you by This Moment in Biblical Times. Goodnight, and God bless.';

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter }, { status: 429 });
  }

  // Parse and validate body
  const body = await request.json().catch(() => null);

  if (!body || typeof body.text !== 'string' || body.text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  if (body.text.length > 5000) {
    return NextResponse.json({ error: 'text must be 5000 characters or fewer' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS API key not configured' }, { status: 500 });
  }

  // Build the full narration: story → title, scripture reference → branding
  const MAX_FIELD_LEN = 200;
  const title = typeof body.title === 'string' ? body.title.slice(0, MAX_FIELD_LEN) : '';
  const scriptureRef = typeof body.scriptureReference === 'string' ? body.scriptureReference.slice(0, MAX_FIELD_LEN) : '';

  let outro = '\n\n';
  if (title) {
    outro += `${title}. `;
  }
  if (scriptureRef) {
    outro += `${scriptureRef}. `;
  }
  outro += `\n\n${BRANDING_OUTRO}`;

  const fullText = body.text + outro;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('ElevenLabs API error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json({ error: 'TTS API configuration error' }, { status: 500 });
      }

      return NextResponse.json({ error: 'Failed to generate audio' }, { status: 502 });
    }

    // Stream the audio bytes back to the client
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('TTS error:', error.message);
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: 502 });
  }
}
