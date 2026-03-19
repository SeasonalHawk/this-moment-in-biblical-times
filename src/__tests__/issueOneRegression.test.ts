import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Regression tests for Issue #1 code review bugs.
 * These tests ensure the 3 bugs stay fixed across future changes.
 */

describe('Bug 1: togglePlayPause returns boolean (stale closure fix)', () => {
  it('togglePlayPause return type is declared in useTextToSpeech source', () => {
    const hookSource = fs.readFileSync(
      path.resolve(__dirname, '../hooks/useTextToSpeech.ts'),
      'utf-8'
    );
    // togglePlayPause must return boolean, not void
    expect(hookSource).toContain('const togglePlayPause = useCallback((): boolean');
  });

  it('handleTogglePlayPause uses return value, not tts.playing', () => {
    const pageSource = fs.readFileSync(
      path.resolve(__dirname, '../app/page.tsx'),
      'utf-8'
    );
    // Must use the return value pattern, not the stale closure pattern
    expect(pageSource).toContain('const nowPlaying = tts.togglePlayPause()');
    expect(pageSource).not.toMatch(/tts\.togglePlayPause\(\);\s*\n\s*if\s*\(tts\.playing\)/);
  });
});

describe('Bug 2 & 3: Legacy api/ directory removed', () => {
  const legacyDir = path.resolve(__dirname, '../../api');

  it('legacy api/ directory does not exist', () => {
    expect(fs.existsSync(legacyDir)).toBe(false);
  });

  it('legacy api/history.js does not exist', () => {
    expect(fs.existsSync(path.join(legacyDir, 'history.js'))).toBe(false);
  });

  it('legacy api/_prompts.js does not exist', () => {
    expect(fs.existsSync(path.join(legacyDir, '_prompts.js'))).toBe(false);
  });

  it('legacy api/_validate.js does not exist', () => {
    expect(fs.existsSync(path.join(legacyDir, '_validate.js'))).toBe(false);
  });

  it('legacy api/_rateLimit.js does not exist', () => {
    expect(fs.existsSync(path.join(legacyDir, '_rateLimit.js'))).toBe(false);
  });

  it('no source files import from legacy api/ directory', () => {
    const srcDir = path.resolve(__dirname, '..');
    const checkDir = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== '__tests__' && entry.name !== 'node_modules') {
          checkDir(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content).not.toMatch(/from\s+['"].*\/api\/_/);
        }
      }
    };
    checkDir(srcDir);
  });
});

describe('STORY_MODEL single source of truth (Bug 2 guard)', () => {
  it('App Router pipeline route uses STORY_MODEL import', () => {
    const routeSource = fs.readFileSync(
      path.resolve(__dirname, '../app/api/pipeline/route.ts'),
      'utf-8'
    );
    expect(routeSource).toMatch(/import\s*\{[^}]*STORY_MODEL[^}]*\}\s*from\s*['"]@\/lib\/prompts['"]/);
    expect(routeSource).toContain('model: STORY_MODEL');
    // Must NOT hardcode any model string
    expect(routeSource).not.toMatch(/model:\s*['"]claude-/);
  });
});

describe('Dead code cleanup', () => {
  it('useHistoryStory.ts is deleted (replaced by useBibleStory)', () => {
    const oldHookPath = path.resolve(__dirname, '../hooks/useHistoryStory.ts');
    expect(fs.existsSync(oldHookPath)).toBe(false);
  });

  it('CalendarPicker.tsx is deleted', () => {
    const calendarPath = path.resolve(__dirname, '../components/CalendarPicker.tsx');
    expect(fs.existsSync(calendarPath)).toBe(false);
  });

  it('StoryCard.tsx is deleted (replaced by StoryPlayer)', () => {
    const storyCardPath = path.resolve(__dirname, '../components/StoryCard.tsx');
    expect(fs.existsSync(storyCardPath)).toBe(false);
  });

  it('genres.ts is deleted (replaced by bibleStories)', () => {
    const genresPath = path.resolve(__dirname, '../lib/genres.ts');
    expect(fs.existsSync(genresPath)).toBe(false);
  });
});
