# This Moment in Biblical Times

AI-powered Bible bedtime stories for children ages 6-12 with voice narration.
Tonight's story is waiting. Just press play.

[Wiki](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki) | [Issues](https://github.com/SeasonalHawk/this-moment-in-biblical-times/issues)

## How It Works

1. **Open the app** — Tonight's Story is ready on the Storybook Lamp home screen
2. **Tap "Read to Me"** — an immersive 2nd-person Bible story generates just for bedtime
3. **Listen** — gentle narration plays with calming background music
4. **Goodnight** — the story ends with a blessing and a peaceful music fade-out
5. **Browse** — open the Bookshelf to pick from 65+ Bible stories organized by category

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| AI Storytelling | Anthropic Claude API (Haiku 4.5) with tool use |
| Voice Narration | ElevenLabs TTS API (Adam voice, Flash v2.5) |
| Background Music | Calming instrumental (static asset) |
| Bible Version | Configurable (NABRE default) — NABRE, NIV, KJV, ESV, NLT, NKJV |
| Testing | Vitest, React Testing Library |
| Prompt Framework | Kajiro IQ Pro |
| Deployment | Vercel |

## Quick Start

**Prerequisites:** Node.js 18+, pnpm, [Anthropic API key](https://console.anthropic.com), [ElevenLabs API key](https://elevenlabs.io)

```bash
git clone https://github.com/SeasonalHawk/this-moment-in-biblical-times.git
cd this-moment-in-biblical-times
pnpm install
```

Create `.env.local`:

```env
ANTHROPIC_API_KEY=your-anthropic-key
ELEVENLABS_API_KEY=your-elevenlabs-key
BIBLE_VERSION=NABRE
```

```bash
pnpm dev
```

Open [http://localhost:3002](http://localhost:3002)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for story generation |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key for voice narration |
| `BIBLE_VERSION` | No | Default Bible translation (default: `NABRE`). Supported: `NABRE`, `NIV`, `KJV`, `ESV`, `NLT`, `NKJV` |
| `RATE_LIMIT_MAX` | No | Max requests per IP per window (default: 10) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: 60000) |

## Testing

```bash
pnpm test          # Run all 242 tests
pnpm build         # Production build
pnpm test:watch    # Watch mode
```

## Project Structure

```
this-moment-in-biblical-times/
├── public/          # Static assets (audio, logos, favicons, PWA manifest)
├── src/app/         # Next.js App Router (pages + API routes)
├── src/components/  # React components (TonightStoryCard, StoryPlayer, Bookshelf, BookSpine, BookPreview, Settings, etc.)
├── src/hooks/       # Custom hooks (useBibleStory, useTextToSpeech, useBackgroundMusic)
├── src/lib/         # Shared utilities (bibleStories, storyProgress, settings, prompts, costs, validation, rateLimit)
└── src/__tests__/   # 14 test files, 242 tests
```

See [Wiki > Architecture](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki/Architecture) for the complete file map.

## Documentation

| Topic | Link |
|-------|------|
| Architecture & Data Flow | [Wiki: Architecture](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki/Architecture) |
| Developer Guide | [Wiki: Guide](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki/Guide) |
| API Costs & Security | [Wiki: Operations](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki/Operations) |
| Release History | [Wiki: Releases](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki/Releases) |
| Product Roadmap | [Wiki: Roadmap](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki/Roadmap) |
| Assets & Branding | [Wiki: Assets](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki/Assets) |
| Contributing | [Wiki: Contributing](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki/Contributing) |
| Getting Started (detailed) | [Wiki: Getting Started](https://github.com/SeasonalHawk/this-moment-in-biblical-times/wiki/Getting-Started) |

## License

MIT

---

*Built with Kajiro IQ Pro | Powered by Anthropic Claude + ElevenLabs | Kenneth Benavides*
