import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HighlightedText from '@/components/HighlightedText';

describe('HighlightedText', () => {
  it('renders all words from the text', () => {
    render(<HighlightedText text="Hello beautiful world" currentWordIndex={-1} enabled={true} />);
    expect(screen.getByText('Hello')).toBeDefined();
    expect(screen.getByText('beautiful')).toBeDefined();
    expect(screen.getByText('world')).toBeDefined();
  });

  it('applies highlight class to the active word', () => {
    render(<HighlightedText text="Hello beautiful world" currentWordIndex={1} enabled={true} />);
    const highlighted = screen.getByText('beautiful');
    expect(highlighted.className).toContain('bg-amber-300/40');
  });

  it('does not apply highlight class to inactive words', () => {
    render(<HighlightedText text="Hello beautiful world" currentWordIndex={1} enabled={true} />);
    const inactive = screen.getByText('Hello');
    expect(inactive.className).not.toContain('bg-amber-300/40');
  });

  it('renders plain text (no spans) when disabled', () => {
    const { container } = render(
      <HighlightedText text="Hello world" currentWordIndex={0} enabled={false} />
    );
    // When disabled, should render as a text node, not spans
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(0);
  });

  it('renders no highlight when currentWordIndex is -1', () => {
    const { container } = render(
      <HighlightedText text="Hello world" currentWordIndex={-1} enabled={true} />
    );
    const highlighted = container.querySelectorAll('.bg-amber-300\\/40');
    expect(highlighted).toHaveLength(0);
  });
});
