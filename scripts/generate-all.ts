/**
 * Pre-generate ALL Bible stories with audio + alignment data.
 * Skips stories that already have static files.
 *
 * Usage: pnpm generate-all
 *
 * This is a convenience wrapper around generate-story.ts.
 * Run after testing with a single story to batch-generate the full library.
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { BIBLE_STORIES } from '../src/lib/bibleStories';

async function generateAll() {
  const storiesDir = path.resolve(__dirname, '..', 'public', 'stories');

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const story of BIBLE_STORIES) {
    const storyDir = path.join(storiesDir, story.id);
    const hasStory = fs.existsSync(path.join(storyDir, 'story.json'));
    const hasAudio = fs.existsSync(path.join(storyDir, 'audio.mp3'));
    const hasAlignment = fs.existsSync(path.join(storyDir, 'alignment.json'));

    if (hasStory && hasAudio && hasAlignment) {
      console.log(`  [skip] ${story.id} — already generated`);
      skipped++;
      continue;
    }

    console.log(`\n[${generated + skipped + failed + 1}/${BIBLE_STORIES.length}] Generating: ${story.title}...`);

    try {
      execFileSync('pnpm', ['generate-story', story.id], {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
      });
      generated++;
    } catch (err) {
      console.error(`  [FAILED] ${story.id}: ${(err as Error).message}`);
      failed++;
    }

    // Small delay between API calls to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Generation complete!`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Total:     ${BIBLE_STORIES.length}`);
}

generateAll().catch(err => {
  console.error('Batch generation failed:', err.message);
  process.exit(1);
});
