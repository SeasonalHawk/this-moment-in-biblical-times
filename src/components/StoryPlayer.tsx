'use client';

import Collapsible from './Collapsible';

interface StoryPlayerProps {
  /** The generated story text */
  story: string;
  /** Story title */
  title: string | null;
  /** Primary theme */
  theme: string | null;
  /** Scripture reference (e.g., "1 Samuel 17:1-54") */
  scriptureReference: string | null;
  /** Actual verse text in configured Bible version — footer citation for parents */
  verseText: string | null;
  /** Moral/takeaway for the child */
  moral: string | null;
  /** Bible version used */
  bibleVersion?: string;
  /** Whether the story section is expanded */
  expanded: boolean;
  /** Toggle story expand/collapse */
  onToggle: () => void;
  /** Close story and return to home */
  onClose: () => void;
  /** Whether the pipeline is actively generating */
  spinning: boolean;
  /** Audio controls */
  audio: {
    playing: boolean;
    paused: boolean;
    hasAudio: boolean;
    loading: boolean;
    togglePlayPause: () => boolean;
    replay: () => void;
  };
  /** Background music controls */
  music: {
    muted: boolean;
    toggleMute: () => void;
  };
  /** Whether audio narration has ended (show Goodnight state) */
  narrationEnded: boolean;
}

/**
 * Story display with audio controls and scripture footer citation.
 * Replaces the old StoryCard — simplified for bedtime Bible stories.
 */
export default function StoryPlayer({
  story,
  title,
  theme,
  scriptureReference,
  verseText,
  moral,
  bibleVersion,
  expanded,
  onToggle,
  onClose,
  spinning,
  audio,
  music,
  narrationEnded,
}: StoryPlayerProps) {
  return (
    <div className="bg-indigo-900/60 border border-indigo-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
      <Collapsible
        id="story-player"
        expanded={expanded}
        onToggle={onToggle}
        locked={spinning}
        header={
          <div className="flex items-center justify-between w-full px-4 py-3">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-lg font-bold text-amber-50 font-serif truncate">
                {title || 'Your Story'}
              </h3>
              {theme && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-300 mt-1">
                  {theme}
                </span>
              )}
            </div>

            {/* Close button — hidden during active loading */}
            {onClose && !spinning && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 rounded-lg text-indigo-400 hover:text-amber-50 hover:bg-indigo-800 transition-colors cursor-pointer ml-3"
                title="Close and start over"
                aria-label="Close"
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
            )}
          </div>
        }
      >
        <div className="px-4 pb-4 space-y-4">
          {/* Story text */}
          <div className="text-base text-indigo-100 leading-relaxed whitespace-pre-wrap font-light">
            {story}
          </div>

          {/* Moral / takeaway */}
          {moral && (
            <div className="bg-indigo-800/40 rounded-lg p-3 border border-indigo-700/30">
              <p className="text-sm text-amber-200 italic">
                💛 {moral}
              </p>
            </div>
          )}

          {/* Audio controls */}
          {audio.hasAudio && (
            <div className="flex items-center gap-3 pt-2">
              {/* Play/Pause — large button */}
              <button
                onClick={() => audio.togglePlayPause()}
                className="p-3 rounded-full bg-amber-500 text-indigo-950 hover:bg-amber-400 transition-colors cursor-pointer shadow-lg"
                aria-label={audio.playing ? 'Pause narration' : 'Play narration'}
              >
                {audio.playing ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>

              {/* Replay */}
              <button
                onClick={audio.replay}
                className="p-2 rounded-lg text-indigo-300 hover:text-amber-50 hover:bg-indigo-800 transition-colors cursor-pointer"
                aria-label="Replay from beginning"
                title="Replay"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>

              {/* Music toggle */}
              <button
                onClick={music.toggleMute}
                className="p-2 rounded-lg text-indigo-300 hover:text-amber-50 hover:bg-indigo-800 transition-colors cursor-pointer"
                aria-label={music.muted ? 'Unmute background music' : 'Mute background music'}
                title={music.muted ? 'Unmute music' : 'Mute music'}
              >
                {music.muted ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 0 19 12c0-3.87-3.13-7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* Goodnight card — shown when narration ends */}
          {narrationEnded && (
            <div className="bg-indigo-800/40 rounded-lg p-4 border border-amber-500/20 text-center">
              <p className="text-lg text-amber-300 font-serif mb-1">
                Goodnight ✨
              </p>
              <p className="text-sm text-indigo-300">
                Sweet dreams. God bless you tonight.
              </p>
            </div>
          )}

          {/* Footer citation — for parents */}
          {(scriptureReference || verseText) && (
            <div className="border-t border-indigo-800/50 pt-3 mt-4">
              {scriptureReference && (
                <p className="text-xs text-indigo-500">
                  {scriptureReference}
                  {bibleVersion && ` (${bibleVersion})`}
                </p>
              )}
              {verseText && (
                <p className="text-xs text-indigo-500 mt-1 italic">
                  {verseText}
                </p>
              )}
            </div>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
