'use client';

import { useState, useEffect } from 'react';
import {
  SUPPORTED_BIBLE_VERSIONS,
  getBibleVersion,
  setBibleVersion,
  type BibleVersion,
} from '../lib/settings';

interface SettingsProps {
  /** Close the settings panel and return to the main view */
  onClose: () => void;
}

/**
 * Parent-facing settings page. Provides Bible version selection
 * that overrides the deployment default (set via BIBLE_VERSION env var).
 *
 * Stored in localStorage so each device can have its own preference.
 */
export default function Settings({ onClose }: SettingsProps) {
  const [version, setVersion] = useState<BibleVersion>('NABRE');

  // Hydrate from localStorage/env on mount
  useEffect(() => {
    setVersion(getBibleVersion());
  }, []);

  const handleVersionChange = (newVersion: BibleVersion) => {
    setVersion(newVersion);
    setBibleVersion(newVersion);
  };

  return (
    <div className="min-h-screen bg-indigo-950 text-cream-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-amber-400">Settings</h1>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-indigo-300 hover:text-cream-100 hover:bg-indigo-800 transition-colors cursor-pointer"
          aria-label="Close settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Bible Version */}
      <section className="mb-8">
        <label
          htmlFor="bible-version"
          className="block text-sm font-medium text-indigo-300 mb-2"
        >
          Bible Translation
        </label>
        <p className="text-sm text-indigo-400 mb-3">
          Choose the Bible version used for scripture citations and story generation.
        </p>
        <select
          id="bible-version"
          value={version}
          onChange={(e) => handleVersionChange(e.target.value as BibleVersion)}
          className="w-full max-w-xs bg-indigo-900 border border-indigo-700 rounded-lg px-4 py-2.5 text-cream-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
        >
          {SUPPORTED_BIBLE_VERSIONS.map((v) => (
            <option key={v} value={v}>
              {getBibleVersionLabel(v)}
            </option>
          ))}
        </select>
        <p className="text-xs text-indigo-500 mt-2">
          Currently using: <span className="text-amber-400">{getBibleVersionLabel(version)}</span>
        </p>
      </section>

      {/* Info footer */}
      <div className="border-t border-indigo-800 pt-4">
        <p className="text-xs text-indigo-500">
          Settings are saved to this device. The deployment default is set via the
          BIBLE_VERSION environment variable.
        </p>
      </div>
    </div>
  );
}

/** Human-readable labels for Bible version codes. */
function getBibleVersionLabel(version: BibleVersion): string {
  const labels: Record<BibleVersion, string> = {
    NABRE: 'NABRE — New American Bible Revised Edition',
    NIV: 'NIV — New International Version',
    KJV: 'KJV — King James Version',
    ESV: 'ESV — English Standard Version',
    NLT: 'NLT — New Living Translation',
    NKJV: 'NKJV — New King James Version',
  };
  return labels[version];
}
