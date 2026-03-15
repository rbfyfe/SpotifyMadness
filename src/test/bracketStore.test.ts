import { describe, it, expect, beforeEach } from 'vitest';
import { useBracketStore } from '../stores/bracketStore';
import type { SpotifyArtist } from '../types/spotify';

function makeArtist(id: string, popularity: number): SpotifyArtist {
  return {
    id,
    name: `Artist ${id}`,
    images: [{ url: `https://img/${id}`, width: 320, height: 320 }],
    popularity,
    genres: ['pop'],
  };
}

function makeArtists(count: number): SpotifyArtist[] {
  return Array.from({ length: count }, (_, i) =>
    makeArtist(`a${i + 1}`, 100 - i)
  );
}

describe('bracketStore', () => {
  beforeEach(() => {
    useBracketStore.setState({
      allArtists: [],
      bracket: null,
      currentMatchupId: null,
      trackCache: {},
    });
  });

  it('initializes a bracket from artists', () => {
    const store = useBracketStore.getState();
    store.setArtists(makeArtists(8));
    store.initBracket(8);

    const bracket = useBracketStore.getState().bracket;
    expect(bracket).not.toBeNull();
    expect(bracket!.size).toBe(8);
    expect(bracket!.rounds).toHaveLength(3);
  });

  it('selects a winner and propagates to next round', () => {
    const store = useBracketStore.getState();
    store.setArtists(makeArtists(8));
    store.initBracket(8);

    let bracket = useBracketStore.getState().bracket!;
    const matchup = bracket.rounds[0]!.matchups[0]!;
    const winner = matchup.artistA!;

    useBracketStore.getState().selectWinner(matchup.id, winner);

    bracket = useBracketStore.getState().bracket!;
    const decided = bracket.rounds[0]!.matchups[0]!;
    expect(decided.winner?.id).toBe(winner.id);

    // Check propagation to next round
    const nextRoundMatchup = bracket.rounds[1]!.matchups[0]!;
    const hasWinner =
      nextRoundMatchup.artistA?.id === winner.id ||
      nextRoundMatchup.artistB?.id === winner.id;
    expect(hasWinner).toBe(true);
  });

  it('changing a winner invalidates downstream', () => {
    const store = useBracketStore.getState();
    store.setArtists(makeArtists(8));
    store.initBracket(8);

    let bracket = useBracketStore.getState().bracket!;
    const m0 = bracket.rounds[0]!.matchups[0]!;
    const originalWinner = m0.artistA!;
    const newWinner = m0.artistB!;

    // Pick original winner
    useBracketStore.getState().selectWinner(m0.id, originalWinner);

    // Verify propagation
    bracket = useBracketStore.getState().bracket!;
    const nextMatchup = bracket.rounds[1]!.matchups[0]!;
    expect(
      nextMatchup.artistA?.id === originalWinner.id ||
      nextMatchup.artistB?.id === originalWinner.id
    ).toBe(true);

    // Change to new winner
    useBracketStore.getState().selectWinner(m0.id, newWinner);

    // Original winner should be removed from next round
    bracket = useBracketStore.getState().bracket!;
    const updated = bracket.rounds[1]!.matchups[0]!;
    const hasOldWinner =
      updated.artistA?.id === originalWinner.id ||
      updated.artistB?.id === originalWinner.id;
    expect(hasOldWinner).toBe(false);

    // New winner should be in next round
    const hasNewWinner =
      updated.artistA?.id === newWinner.id ||
      updated.artistB?.id === newWinner.id;
    expect(hasNewWinner).toBe(true);
  });

  it('sets champion when final matchup decided', () => {
    const store = useBracketStore.getState();
    store.setArtists(makeArtists(8));
    store.initBracket(8);

    // Walk through all rounds picking artistA each time
    for (let r = 0; r < 3; r++) {
      const bracket = useBracketStore.getState().bracket!;
      const round = bracket.rounds[r]!;
      for (const matchup of round.matchups) {
        if (matchup.artistA && matchup.artistB) {
          useBracketStore.getState().selectWinner(matchup.id, matchup.artistA);
        }
      }
    }

    const bracket = useBracketStore.getState().bracket!;
    expect(bracket.champion).not.toBeNull();
  });

  it('opens and closes matchup modal', () => {
    useBracketStore.getState().openMatchup('r0-m0');
    expect(useBracketStore.getState().currentMatchupId).toBe('r0-m0');

    useBracketStore.getState().closeMatchup();
    expect(useBracketStore.getState().currentMatchupId).toBeNull();
  });

  it('caches tracks', () => {
    const tracks = [{ id: 't1', name: 'Track 1', preview_url: null, external_urls: { spotify: '' }, album: { name: 'Album', images: [] }, duration_ms: 30000 }];
    useBracketStore.getState().cacheTracks('a1', tracks);
    expect(useBracketStore.getState().trackCache['a1']).toEqual(tracks);
  });

  it('resets bracket state', () => {
    const store = useBracketStore.getState();
    store.setArtists(makeArtists(8));
    store.initBracket(8);
    store.openMatchup('r0-m0');

    store.resetBracket();
    const state = useBracketStore.getState();
    expect(state.bracket).toBeNull();
    expect(state.currentMatchupId).toBeNull();
  });
});
