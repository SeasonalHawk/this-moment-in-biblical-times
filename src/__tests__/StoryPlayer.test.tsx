import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StoryPlayer from '@/components/StoryPlayer';

const defaultProps = {
  story: 'You walk along the dusty road toward the valley...',
  title: 'David and the Giant',
  theme: 'Courage',
  scriptureReference: '1 Samuel 17:1-54',
  verseText: 'The LORD is my shepherd; there is nothing I lack. — Psalm 23:1',
  moral: 'Even when you feel small, God gives you the courage to face big challenges.',
  bibleVersion: 'NABRE',
  expanded: true,
  onToggle: vi.fn(),
  onClose: vi.fn(),
  spinning: false,
  audio: {
    playing: false,
    paused: false,
    hasAudio: false,
    loading: false,
    togglePlayPause: vi.fn(() => true),
    replay: vi.fn(),
  },
  music: {
    muted: false,
    toggleMute: vi.fn(),
  },
  narrationEnded: false,
};

describe('StoryPlayer', () => {
  it('renders the story text', () => {
    render(<StoryPlayer {...defaultProps} />);
    expect(screen.getByText(/You walk along the dusty road/)).toBeInTheDocument();
  });

  it('renders the story title', () => {
    render(<StoryPlayer {...defaultProps} />);
    expect(screen.getByText('David and the Giant')).toBeInTheDocument();
  });

  it('renders the theme badge', () => {
    render(<StoryPlayer {...defaultProps} />);
    expect(screen.getByText('Courage')).toBeInTheDocument();
  });

  it('hides theme badge when null', () => {
    render(<StoryPlayer {...defaultProps} theme={null} />);
    expect(screen.queryByText('Courage')).not.toBeInTheDocument();
  });

  it('renders moral/takeaway', () => {
    render(<StoryPlayer {...defaultProps} />);
    expect(screen.getByText(/Even when you feel small/)).toBeInTheDocument();
  });

  it('hides moral when null', () => {
    render(<StoryPlayer {...defaultProps} moral={null} />);
    expect(screen.queryByText(/Even when you feel small/)).not.toBeInTheDocument();
  });

  // Footer citation — parent-facing
  it('renders scripture reference in footer', () => {
    render(<StoryPlayer {...defaultProps} />);
    expect(screen.getByText(/1 Samuel 17:1-54/)).toBeInTheDocument();
  });

  it('renders verse text in footer', () => {
    render(<StoryPlayer {...defaultProps} />);
    expect(screen.getByText(/The LORD is my shepherd/)).toBeInTheDocument();
  });

  it('renders Bible version in footer', () => {
    render(<StoryPlayer {...defaultProps} />);
    expect(screen.getByText(/NABRE/)).toBeInTheDocument();
  });

  it('hides footer when no scripture data', () => {
    render(
      <StoryPlayer
        {...defaultProps}
        scriptureReference={null}
        verseText={null}
      />
    );
    expect(screen.queryByText(/1 Samuel/)).not.toBeInTheDocument();
  });

  it('shows fallback title when null', () => {
    render(<StoryPlayer {...defaultProps} title={null} />);
    expect(screen.getByText('Your Story')).toBeInTheDocument();
  });

  // Close button
  it('renders close button when not spinning', () => {
    render(<StoryPlayer {...defaultProps} spinning={false} />);
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<StoryPlayer {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('hides close button when spinning', () => {
    render(<StoryPlayer {...defaultProps} spinning={true} />);
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('close control is not a <button> to avoid nested button hydration error', () => {
    render(<StoryPlayer {...defaultProps} spinning={false} />);
    const closeEl = screen.getByLabelText('Close');
    expect(closeEl.tagName).not.toBe('BUTTON');
    expect(closeEl.getAttribute('role')).toBe('button');
  });

  it('close control responds to Enter key', () => {
    const onClose = vi.fn();
    render(<StoryPlayer {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(screen.getByLabelText('Close'), { key: 'Enter' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  // Audio controls — no audio state
  it('does not show audio controls when no audio', () => {
    render(<StoryPlayer {...defaultProps} />);
    expect(screen.queryByLabelText('Pause narration')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Play narration')).not.toBeInTheDocument();
  });

  // Audio controls — after audio generated
  it('shows pause button when audio is playing', () => {
    render(
      <StoryPlayer
        {...defaultProps}
        audio={{ ...defaultProps.audio, hasAudio: true, playing: true }}
      />
    );
    expect(screen.getByLabelText('Pause narration')).toBeInTheDocument();
  });

  it('shows play button when audio is paused', () => {
    render(
      <StoryPlayer
        {...defaultProps}
        audio={{ ...defaultProps.audio, hasAudio: true, playing: false }}
      />
    );
    expect(screen.getByLabelText('Play narration')).toBeInTheDocument();
  });

  it('calls togglePlayPause when play/pause button clicked', () => {
    const togglePlayPause = vi.fn(() => true);
    render(
      <StoryPlayer
        {...defaultProps}
        audio={{ ...defaultProps.audio, hasAudio: true, playing: true, togglePlayPause }}
      />
    );
    fireEvent.click(screen.getByLabelText('Pause narration'));
    expect(togglePlayPause).toHaveBeenCalledOnce();
  });

  // Replay button
  it('shows replay button when audio is available', () => {
    render(
      <StoryPlayer
        {...defaultProps}
        audio={{ ...defaultProps.audio, hasAudio: true }}
      />
    );
    expect(screen.getByLabelText('Replay from beginning')).toBeInTheDocument();
  });

  it('calls replay when replay button clicked', () => {
    const replay = vi.fn();
    render(
      <StoryPlayer
        {...defaultProps}
        audio={{ ...defaultProps.audio, hasAudio: true, replay }}
      />
    );
    fireEvent.click(screen.getByLabelText('Replay from beginning'));
    expect(replay).toHaveBeenCalledOnce();
  });

  // Background music toggle
  it('shows mute music label when music is not muted', () => {
    render(
      <StoryPlayer
        {...defaultProps}
        audio={{ ...defaultProps.audio, hasAudio: true }}
        music={{ muted: false, toggleMute: vi.fn() }}
      />
    );
    expect(screen.getByLabelText('Mute background music')).toBeInTheDocument();
  });

  it('shows unmute music label when music is muted', () => {
    render(
      <StoryPlayer
        {...defaultProps}
        audio={{ ...defaultProps.audio, hasAudio: true }}
        music={{ muted: true, toggleMute: vi.fn() }}
      />
    );
    expect(screen.getByLabelText('Unmute background music')).toBeInTheDocument();
  });

  it('calls toggleMute when music button clicked', () => {
    const toggleMute = vi.fn();
    render(
      <StoryPlayer
        {...defaultProps}
        audio={{ ...defaultProps.audio, hasAudio: true }}
        music={{ muted: false, toggleMute }}
      />
    );
    fireEvent.click(screen.getByLabelText('Mute background music'));
    expect(toggleMute).toHaveBeenCalledOnce();
  });

  // Goodnight card
  it('shows Goodnight card when narration ends', () => {
    render(<StoryPlayer {...defaultProps} narrationEnded={true} />);
    expect(screen.getByText(/Goodnight/)).toBeInTheDocument();
    expect(screen.getByText(/Sweet dreams/)).toBeInTheDocument();
  });

  it('does not show Goodnight card when narration is still playing', () => {
    render(<StoryPlayer {...defaultProps} narrationEnded={false} />);
    expect(screen.queryByText(/Goodnight/)).not.toBeInTheDocument();
  });

  // Follow-along highlighting
  it('renders HighlightedText when followAlongEnabled is true', () => {
    const { container } = render(
      <StoryPlayer {...defaultProps} followAlongEnabled={true} followAlongWordIndex={0} />
    );
    // When enabled, words should be in spans
    const spans = container.querySelectorAll('span');
    expect(spans.length).toBeGreaterThan(0);
  });

  it('renders plain text when followAlongEnabled is false', () => {
    const { container } = render(
      <StoryPlayer {...defaultProps} followAlongEnabled={false} followAlongWordIndex={0} />
    );
    // When disabled, no spans in the story text area
    const storyDiv = container.querySelector('.whitespace-pre-wrap');
    const spans = storyDiv?.querySelectorAll('span') || [];
    expect(spans).toHaveLength(0);
  });

  it('renders story text without follow-along props (backwards compat)', () => {
    render(<StoryPlayer {...defaultProps} />);
    expect(screen.getByText(/You walk along the dusty road/)).toBeInTheDocument();
  });

  // Full audio controls layout
  it('shows all audio controls when hasAudio is true', () => {
    render(
      <StoryPlayer
        {...defaultProps}
        audio={{ ...defaultProps.audio, hasAudio: true, playing: true }}
      />
    );
    expect(screen.getByLabelText('Pause narration')).toBeInTheDocument();
    expect(screen.getByLabelText('Replay from beginning')).toBeInTheDocument();
    expect(screen.getByLabelText(/background music/)).toBeInTheDocument();
  });
});
