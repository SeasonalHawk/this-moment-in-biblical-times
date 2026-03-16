'use client';

import { TOTAL_STORIES } from '../lib/bibleStories';

interface ProgressTrackerProps {
  storiesHeard: number;
}

/**
 * Simple progress bar showing how many stories the child has heard.
 */
export default function ProgressTracker({ storiesHeard }: ProgressTrackerProps) {
  const percentage = Math.min((storiesHeard / TOTAL_STORIES) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-indigo-400">Your Story Journey</span>
        <span className="text-xs text-indigo-300">
          {storiesHeard} of {TOTAL_STORIES} stories
        </span>
      </div>
      <div className="w-full h-2 bg-indigo-900/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={storiesHeard}
          aria-valuemin={0}
          aria-valuemax={TOTAL_STORIES}
          aria-label={`${storiesHeard} of ${TOTAL_STORIES} stories heard`}
        />
      </div>
    </div>
  );
}
