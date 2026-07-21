import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptCard, CLAUDE_PROMPT } from '../components/landing/PromptCard';

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
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
});
