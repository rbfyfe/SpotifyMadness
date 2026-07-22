import { describe, it, expect } from 'vitest';
import { seedArtists } from '../utils/seeding';
import { buildBracket, applyWinner } from '../utils/bracketEngine';
import type { SpotifyArtist } from '../types/spotify';
import type { BracketData } from '../types/bracket';

function makeArtists(count: number): SpotifyArtist[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `a${i + 1}`,
    name: `Artist ${i + 1}`,
    images: [{ url: `https://img/${i + 1}`, width: 320, height: 320 }],
    popularity: 100 - i,
    genres: ['pop'],
  }));
}

function freshBracket(): BracketData {
  return buildBracket(seedArtists(makeArtists(8), 8), 8);
}

describe('applyWinner', () => {
  it('sets the winner on the target matchup', () => {
    const bracket = freshBracket();
    const m0 = bracket.rounds[0]!.matchups[0]!;
    const winner = m0.artistA!;

    const next = applyWinner(bracket, m0.id, winner);

    expect(next.rounds[0]!.matchups[0]!.winner?.id).toBe(winner.id);
  });

  it('does not mutate the input bracket', () => {
    const bracket = freshBracket();
    const m0 = bracket.rounds[0]!.matchups[0]!;

    applyWinner(bracket, m0.id, m0.artistA!);

    expect(bracket.rounds[0]!.matchups[0]!.winner).toBeNull();
  });

  it('propagates the winner into the parent matchup', () => {
    const bracket = freshBracket();
    const m0 = bracket.rounds[0]!.matchups[0]!;
    const winner = m0.artistA!;

    const next = applyWinner(bracket, m0.id, winner);

    const parent = next.rounds[1]!.matchups[0]!;
    expect(parent.artistA?.id === winner.id || parent.artistB?.id === winner.id).toBe(true);
  });

  it('sets the champion when the final round is decided', () => {
    let bracket = freshBracket();

    for (let r = 0; r < 3; r++) {
      for (const matchup of bracket.rounds[r]!.matchups) {
        const live = bracket.rounds[r]!.matchups.find((m) => m.id === matchup.id)!;
        if (live.artistA && live.artistB) {
          bracket = applyWinner(bracket, live.id, live.artistA);
        }
      }
    }

    expect(bracket.champion).not.toBeNull();
  });

  it('invalidates downstream when an earlier winner changes', () => {
    let bracket = freshBracket();
    const m0 = bracket.rounds[0]!.matchups[0]!;
    const original = m0.artistA!;
    const replacement = m0.artistB!;

    bracket = applyWinner(bracket, m0.id, original);
    expect(bracket.rounds[1]!.matchups[0]!.artistA?.id).toBe(original.id);

    bracket = applyWinner(bracket, m0.id, replacement);

    const parent = bracket.rounds[1]!.matchups[0]!;
    expect(parent.artistA?.id === original.id || parent.artistB?.id === original.id).toBe(false);
    expect(parent.artistA?.id === replacement.id || parent.artistB?.id === replacement.id).toBe(true);
  });

  it('clears the champion when the deciding winner is invalidated', () => {
    let bracket = freshBracket();

    for (let r = 0; r < 3; r++) {
      for (const matchup of bracket.rounds[r]!.matchups) {
        const live = bracket.rounds[r]!.matchups.find((m) => m.id === matchup.id)!;
        if (live.artistA && live.artistB) {
          bracket = applyWinner(bracket, live.id, live.artistA);
        }
      }
    }
    expect(bracket.champion).not.toBeNull();

    const m0 = bracket.rounds[0]!.matchups[0]!;
    bracket = applyWinner(bracket, m0.id, m0.artistB!);

    expect(bracket.champion).toBeNull();
  });

  it('returns the bracket unchanged for an unknown matchup id', () => {
    const bracket = freshBracket();
    const winner = bracket.rounds[0]!.matchups[0]!.artistA!;

    const next = applyWinner(bracket, 'does-not-exist', winner);

    expect(next).toBe(bracket);
  });
});
