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
    expect(CLAUDE_PROMPT).toContain('http://localhost:5173/callback');
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
