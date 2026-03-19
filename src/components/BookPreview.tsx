'use client';

import type { BibleStory } from '../lib/bibleStories';

interface BookPreviewProps {
  story: BibleStory;
  isRead: boolean;
  onReadToMe: (story: BibleStory) => void;
  onClose: () => void;
}

/**
 * Slide-up preview overlay shown when a book spine is tapped.
 * Shows story details and a "Read to Me" button.
 */
export default function BookPreview({
  story,
  isRead,
  onReadToMe,
  onClose,
}: BookPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Preview card */}
      <div className="relative w-full max-w-md bg-indigo-900 border-t border-indigo-700 rounded-t-2xl p-6 animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-indigo-400 hover:text-amber-50 hover:bg-indigo-800 transition-colors cursor-pointer"
          aria-label="Close preview"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
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

        {/* Read status */}
        {isRead && (
          <p className="text-xs text-amber-400 mb-2">✦ Already heard</p>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-amber-50 font-serif mb-2">
          {story.title}
        </h3>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-800 text-indigo-200">
            {story.testament}
          </span>
          {story.themes.map((theme) => (
            <span
              key={theme}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-300"
            >
              {theme}
            </span>
          ))}
        </div>

        {/* Teaser */}
        <p className="text-sm text-indigo-200 italic mb-1">
          {story.teaser}
        </p>

        {/* Scripture */}
        <p className="text-xs text-indigo-400 mb-5">
          {story.scriptureRef}
        </p>

        {/* Read to Me */}
        <button
          onClick={() => onReadToMe(story)}
          className="w-full py-3 px-6 rounded-xl text-lg font-semibold bg-amber-500 text-indigo-950 hover:bg-amber-400 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-amber-500/20"
          aria-label={`Read to me: ${story.title}`}
        >
          ▶ Read to Me
        </button>
      </div>
    </div>
  );
}
