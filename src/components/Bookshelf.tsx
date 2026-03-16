'use client';

import { useState } from 'react';
import {
  STORY_CATEGORIES,
  getStoriesByCategory,
  getRandomStory,
  type BibleStory,
} from '../lib/bibleStories';
import BookSpine from './BookSpine';
import BookPreview from './BookPreview';

interface BookshelfProps {
  /** Set of story IDs that have been heard */
  heardStoryIds: Set<string>;
  /** Navigate back to the Lamp home screen */
  onBack: () => void;
  /** Start playing a story */
  onReadToMe: (story: BibleStory) => void;
}

/**
 * Bookshelf browse view — stories organized on shelves by category.
 * Secondary screen accessible via "Browse Stories" button on the home screen.
 */
export default function Bookshelf({
  heardStoryIds,
  onBack,
  onReadToMe,
}: BookshelfProps) {
  const [previewStory, setPreviewStory] = useState<BibleStory | null>(null);

  const handleSurpriseMe = () => {
    const randomStory = getRandomStory();
    setPreviewStory(randomStory);
  };

  const handleReadToMe = (story: BibleStory) => {
    setPreviewStory(null);
    onReadToMe(story);
  };

  return (
    <div className="min-h-screen bg-indigo-950 text-amber-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-indigo-300 hover:text-amber-50 hover:bg-indigo-800 transition-colors cursor-pointer"
          aria-label="Back to home"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-amber-400 font-serif">
          Bible Bookshelf
        </h1>
      </div>

      {/* Category shelves */}
      <div className="space-y-6">
        {STORY_CATEGORIES.map((category) => {
          const stories = getStoriesByCategory(category);
          if (stories.length === 0) return null;

          return (
            <section key={category}>
              <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {stories.map((story) => (
                  <BookSpine
                    key={story.id}
                    story={story}
                    isRead={heardStoryIds.has(story.id)}
                    onSelect={setPreviewStory}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Surprise Me */}
      <div className="mt-8 mb-4 text-center">
        <button
          onClick={handleSurpriseMe}
          className="px-6 py-3 rounded-xl bg-indigo-800 text-indigo-200 hover:bg-indigo-700 hover:text-amber-50 transition-colors cursor-pointer text-sm font-medium"
          aria-label="Pick a random story"
        >
          🎁 Surprise Me
        </button>
      </div>

      {/* Book preview overlay */}
      {previewStory && (
        <BookPreview
          story={previewStory}
          isRead={heardStoryIds.has(previewStory.id)}
          onReadToMe={handleReadToMe}
          onClose={() => setPreviewStory(null)}
        />
      )}
    </div>
  );
}
