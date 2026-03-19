'use client';

import type { BibleStory } from '../lib/bibleStories';

interface TonightStoryCardProps {
  story: BibleStory;
  onReadToMe: (story: BibleStory) => void;
  disabled?: boolean;
}

/**
 * Hero card for the Storybook Lamp home screen.
 * Shows tonight's curated story with title, theme, testament, and "Read to Me" CTA.
 */
export default function TonightStoryCard({
  story,
  onReadToMe,
  disabled = false,
}: TonightStoryCardProps) {
  return (
    <div className="bg-indigo-900/60 border border-indigo-700/50 rounded-xl p-6 backdrop-blur-sm">
      {/* Category label */}
      <p className="text-xs font-medium text-amber-400/80 uppercase tracking-wider mb-2">
        Tonight&apos;s Story
      </p>

      {/* Title */}
      <h2 className="text-2xl font-bold text-amber-50 mb-2 font-serif">
        {story.title}
      </h2>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-800 text-indigo-200">
          {story.testament}
        </span>
        {story.themes.slice(0, 2).map((theme) => (
          <span
            key={theme}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-300"
          >
            {theme}
          </span>
        ))}
      </div>

      {/* Teaser */}
      <p className="text-sm text-indigo-200 mb-1 italic">
        {story.teaser}
      </p>

      {/* Scripture reference */}
      <p className="text-xs text-indigo-400 mb-5">
        {story.scriptureRef}
      </p>

      {/* Read to Me button */}
      <button
        onClick={() => onReadToMe(story)}
        disabled={disabled}
        className={`w-full py-3 px-6 rounded-xl text-lg font-semibold transition-all duration-200 cursor-pointer
          ${
            disabled
              ? 'bg-indigo-800 text-indigo-500 cursor-not-allowed'
              : 'bg-amber-500 text-indigo-950 hover:bg-amber-400 active:scale-[0.98] shadow-lg shadow-amber-500/20'
          }`}
        aria-label={`Read to me: ${story.title}`}
      >
        ▶ Read to Me
      </button>
    </div>
  );
}
