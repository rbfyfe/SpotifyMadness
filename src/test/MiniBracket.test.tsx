import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MiniBracket } from '../components/landing/MiniBracket';

/** Round sizes for an 8-artist bracket: 4 quarterfinals, 2 semifinals, 1 final. */
const ROUNDS: [number, number][] = [
  [0, 4],
  [1, 2],
  [2, 1],
];

/** Click the first artist in every matchup, round by round. */
function playThrough(): void {
  for (const [round, count] of ROUNDS) {
    for (let m = 0; m < count; m++) {
      const card = screen.getByTestId(`mini-matchup-r${round}-m${m}`);
      const picks = within(card).getAllByRole('button');
      fireEvent.click(picks[0]!);
    }
  }
}

describe('MiniBracket', () => {
  it('renders all seven matchups', () => {
    render(<MiniBracket onPlayDemo={() => {}} />);

    for (const [round, count] of ROUNDS) {
      for (let m = 0; m < count; m++) {
        expect(screen.getByTestId(`mini-matchup-r${round}-m${m}`)).toBeInTheDocument();
      }
    }
  });

  it('crowns no champion before any picks', () => {
    render(<MiniBracket onPlayDemo={() => {}} />);

    expect(screen.queryByTestId('mini-champion')).not.toBeInTheDocument();
  });

  it('crowns a champion after all seven picks', () => {
    render(<MiniBracket onPlayDemo={() => {}} />);

    playThrough();

    expect(screen.getByTestId('mini-champion')).toBeInTheDocument();
  });

  it('clears the champion when an earlier pick is changed', () => {
    render(<MiniBracket onPlayDemo={() => {}} />);
    playThrough();
    expect(screen.getByTestId('mini-champion')).toBeInTheDocument();

    const card = screen.getByTestId('mini-matchup-r0-m0');
    const picks = within(card).getAllByRole('button');
    fireEvent.click(picks[1]!);

    expect(screen.queryByTestId('mini-champion')).not.toBeInTheDocument();
  });

  it('renders two-letter monograms for single-word artists like Drake and SZA', () => {
    render(<MiniBracket onPlayDemo={() => {}} />);

    const card = screen.getByTestId('mini-matchup-r0-m3');
    const monograms = within(card).getAllByRole('button').map((btn) => {
      const span = btn.querySelector('span');
      return span?.textContent || '';
    });

    monograms.forEach((monogram) => {
      expect(monogram).toHaveLength(2);
    });
  });

  it('renders no images — monograms only, so the page makes no external requests', () => {
    const { container } = render(<MiniBracket onPlayDemo={() => {}} />);

    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});
