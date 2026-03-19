/**
 * Application settings with two-tier resolution:
 *   1. localStorage (per-device override, set via in-app Settings page)
 *   2. Environment variable (deployment default, set via .env)
 *   3. Hardcoded fallback
 *
 * This pattern makes the app clone-ready — change one env var to switch
 * the Bible version for an entire deployment without touching code.
 */

export const SUPPORTED_BIBLE_VERSIONS = [
  'NABRE',
  'NIV',
  'KJV',
  'ESV',
  'NLT',
  'NKJV',
] as const;

export type BibleVersion = (typeof SUPPORTED_BIBLE_VERSIONS)[number];

const DEFAULT_BIBLE_VERSION: BibleVersion = 'NABRE';
const STORAGE_KEY_BIBLE_VERSION = 'bible-version';

/**
 * Resolve the active Bible version.
 * Priority: localStorage → env var → hardcoded default ("NABRE").
 */
export function getBibleVersion(): BibleVersion {
  // 1. Check localStorage (only in browser)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_BIBLE_VERSION);
    if (stored && isSupportedVersion(stored)) {
      return stored;
    }
  }

  // 2. Check environment variable
  const envVersion = process.env.BIBLE_VERSION ?? process.env.NEXT_PUBLIC_BIBLE_VERSION;
  if (envVersion && isSupportedVersion(envVersion)) {
    return envVersion;
  }

  // 3. Hardcoded fallback
  return DEFAULT_BIBLE_VERSION;
}

/**
 * Save a Bible version override to localStorage.
 * Called from the in-app Settings page.
 */
export function setBibleVersion(version: BibleVersion): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_BIBLE_VERSION, version);
  }
}

/**
 * Clear the localStorage override, reverting to env/default.
 */
export function clearBibleVersionOverride(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_BIBLE_VERSION);
  }
}

/**
 * Type guard for supported Bible versions.
 */
function isSupportedVersion(value: string): value is BibleVersion {
  return SUPPORTED_BIBLE_VERSIONS.includes(value as BibleVersion);
}

// ── Follow-Along Setting ─────────────────────────────────────────────────────

const STORAGE_KEY_FOLLOW_ALONG = 'follow-along';

/**
 * Get the follow-along preference (highlight words as they're spoken).
 * Default: true (enabled) — targets children learning to read.
 */
export function getFollowAlong(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY_FOLLOW_ALONG);
    if (stored !== null) return stored === 'true';
  }
  return true;
}

/**
 * Save the follow-along preference to localStorage.
 */
export function setFollowAlong(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_FOLLOW_ALONG, String(enabled));
  }
}
