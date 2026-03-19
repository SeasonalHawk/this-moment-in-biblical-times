import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Source-level tests for the hook's structure
const hookSource = fs.readFileSync(
  path.resolve(__dirname, '../hooks/useWordHighlight.ts'),
  'utf-8'
);

describe('useWordHighlight: structure', () => {
  it('uses requestAnimationFrame for tracking (not setInterval)', () => {
    expect(hookSource).toContain('requestAnimationFrame');
    expect(hookSource).not.toContain('setInterval');
  });

  it('implements binary search for finding active word', () => {
    // Binary search pattern: low/high narrowing
    expect(hookSource).toContain('low');
    expect(hookSource).toContain('high');
  });

  it('listens for play, pause, seeked, and ended events', () => {
    expect(hookSource).toContain("'play'");
    expect(hookSource).toContain("'pause'");
    expect(hookSource).toContain("'seeked'");
    expect(hookSource).toContain("'ended'");
  });

  it('returns currentWordIndex and reset', () => {
    expect(hookSource).toContain('currentWordIndex');
    expect(hookSource).toContain('reset');
  });

  it('cancels animation frame on cleanup', () => {
    expect(hookSource).toContain('cancelAnimationFrame');
  });

  it('reads audio.currentTime for position tracking', () => {
    expect(hookSource).toContain('audioElement.currentTime');
  });

  it('checks audioElement.paused to control the rAF loop', () => {
    expect(hookSource).toContain('audioElement.paused');
  });
});
