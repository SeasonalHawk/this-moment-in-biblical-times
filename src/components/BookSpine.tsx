'use client';

import type { BibleStory } from '../lib/bibleStories';

interface BookSpineProps {
  story: BibleStory;
  isRead: boolean;
  onSelect: (story: BibleStory) => void;
}

/**
 * Individual book on the shelf — a tappable card showing story title and theme.
 * Read stories glow gold, unread stories are dim.
 */
export default function BookSpine({ story, isRead, onSelect }: BookSpineProps) {
  return (
    <button
      onClick={() => onSelect(story)}
      className={`flex-shrink-0 w-36 h-44 rounded-lg p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer border
        ${
          isRead
            ? 'bg-amber-900/30 border-amber-500/40 shadow-md shadow-amber-500/10'
            : 'bg-indigo-800/40 border-indigo-700/30 hover:bg-indigo-800/60 hover:border-indigo-600/40'
        }
      `}
      aria-label={`${story.title}${isRead ? ' (already heard)' : ''}`}
    >
      {/* Read indicator */}
      {isRead && (
        <div className="self-end">
          <span className="text-amber-400 text-xs">✦</span>
        </div>
      )}

      {/* Title */}
      <div className="flex-1 flex items-center">
        <h4
          className={`text-sm font-semibold leading-tight font-serif ${
            isRead ? 'text-amber-200' : 'text-indigo-100'
          }`}
        >
          {story.title}
        </h4>
      </div>

      {/* Theme badge */}
      <div className="mt-2">
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            isRead ? 'bg-amber-800/50 text-amber-300' : 'bg-indigo-700/50 text-indigo-300'
          }`}
        >
          {story.themes[0]}
        </span>
      </div>
    </button>
  );
}
