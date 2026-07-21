import { createHash } from 'node:crypto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptCard, CLAUDE_PROMPT } from '../components/landing/PromptCard';

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

afterEach(() => {
  // @ts-expect-error - navigator.clipboard is not defined by jsdom; remove the test stub
  delete navigator.clipboard;
});

describe('PromptCard', () => {
  it('renders the prompt text', () => {
    render(<PromptCard />);

    expect(screen.getByText(/Clone and set up Music Madness/)).toBeInTheDocument();
  });

  it('names the repo and the Developer Mode gotcha', () => {
    expect(CLAUDE_PROMPT).toContain('https://github.com/rbfyfe/SpotifyMadness');
    expect(CLAUDE_PROMPT).toContain('Developer Mode');
    expect(CLAUDE_PROMPT).toContain('http://127.0.0.1:5173/callback');
  });

  // Pins the entire prompt text byte-for-byte. CLAUDE_PROMPT is kept identical to
  // the copy in work/music-madness/index.html in the rbfyfe/rippedpages repository
  // (see the comment above CLAUDE_PROMPT in PromptCard.tsx). If this test fails
  // because CLAUDE_PROMPT was intentionally edited, the other repository's copy
  // must be updated to match in the same change, and the expected digest below
  // must be recomputed and replaced.
  it('matches the pinned SHA-256 digest of the full prompt text', () => {
    const digest = createHash('sha256').update(CLAUDE_PROMPT, 'utf8').digest('hex');

    expect(digest).toBe('6d4ae007ea36505ac9d4a50176115004878e6c5e2a41a8f02c72298d6e6173eb');
  });

  it('copies the prompt to the clipboard', async () => {
    render(<PromptCard />);

    fireEvent.click(screen.getByRole('button', { name: /copy the prompt/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(CLAUDE_PROMPT));
  });

  it('confirms the copy to the user', async () => {
    render(<PromptCard />);

    fireEvent.click(screen.getByRole('button', { name: /copy the prompt/i }));

    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument();
  });

  it('resets back to the prompt copy label 2 seconds after a successful copy', async () => {
    vi.useFakeTimers();

    try {
      render(<PromptCard />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /copy the prompt/i }));
        // Let the writeText() microtask (and the state update chained onto it) settle.
        // Fake timers only stub setTimeout/setInterval, not the microtask queue, so
        // this doesn't require advancing timers.
        await Promise.resolve();
      });

      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByRole('button', { name: /copy the prompt/i })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a failure state and resets it, without an unhandled rejection, when the clipboard write is rejected', async () => {
    writeText.mockImplementationOnce(() => Promise.reject(new Error('clipboard denied')));

    vi.useFakeTimers();

    try {
      render(<PromptCard />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /copy the prompt/i }));
        await Promise.resolve();
        // The rejection is caught with a try/catch inside an async handler, which
        // needs an extra microtask tick to propagate the state update.
        await Promise.resolve();
      });

      expect(screen.getByRole('button', { name: /copy failed/i })).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByRole('button', { name: /copy the prompt/i })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
