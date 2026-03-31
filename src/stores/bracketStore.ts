import { create } from 'zustand';
import type { SpotifyArtist, SpotifyTrack } from '../types/spotify';
import type { BracketSize, BracketData, Matchup, SeededArtist } from '../types/bracket';
import { seedArtists } from '../utils/seeding';
import { buildBracket } from '../utils/bracketEngine';

interface BracketState {
  allArtists: SpotifyArtist[];
  bracket: BracketData | null;
  currentMatchupId: string | null;
  trackCache: Record<string, SpotifyTrack[]>;
  readOnly: boolean;

  setArtists: (artists: SpotifyArtist[]) => void;
  initBracket: (size: BracketSize) => void;
  selectWinner: (matchupId: string, winner: SeededArtist) => void;
  openMatchup: (matchupId: string) => void;
  closeMatchup: () => void;
  cacheTracks: (artistId: string, tracks: SpotifyTrack[]) => void;
  resetBracket: () => void;
  getMatchupById: (id: string) => Matchup | undefined;
  setBracket: (bracket: BracketData) => void;
  setReadOnly: (readOnly: boolean) => void;
}

function findMatchup(bracket: BracketData, id: string): Matchup | undefined {
  for (const round of bracket.rounds) {
    const found = round.matchups.find((m) => m.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Recursively remove an artist from all downstream matchups */
function invalidateDownstream(bracket: BracketData, fromRound: number, artistId: string): void {
  for (let r = fromRound; r < bracket.rounds.length; r++) {
    const round = bracket.rounds[r]!;
    for (const matchup of round.matchups) {
      if (matchup.artistA?.id === artistId) {
        matchup.artistA = null;
        if (matchup.winner?.id === artistId) {
          matchup.winner = null;
        }
      }
      if (matchup.artistB?.id === artistId) {
        matchup.artistB = null;
        if (matchup.winner?.id === artistId) {
          matchup.winner = null;
        }
      }
    }
  }
  // Clear champion if invalidated
  if (bracket.champion?.id === artistId) {
    bracket.champion = null;
  }
}

export const useBracketStore = create<BracketState>((set, get) => ({
  allArtists: [],
  bracket: null,
  currentMatchupId: null,
  trackCache: {},
  readOnly: false,

  setArtists: (artists) => set({ allArtists: artists }),

  initBracket: (size) => {
    const { allArtists } = get();
    const seeded = seedArtists(allArtists, size);
    const bracket = buildBracket(seeded, size);
    set({ bracket });
  },

  selectWinner: (matchupId, winner) =>
    set((state) => {
      if (!state.bracket || state.readOnly) return state;

      // Structured deep clone (avoids JSON.parse fragility)
      const bracket: BracketData = {
        ...state.bracket,
        champion: state.bracket.champion ? { ...state.bracket.champion } : null,
        regions: [...state.bracket.regions],
        rounds: state.bracket.rounds.map((r) => ({
          ...r,
          matchups: r.matchups.map((m) => ({ ...m })),
        })),
      };

      const matchup = findMatchup(bracket, matchupId);
      if (!matchup) return state;

      // If changing an existing winner, invalidate downstream
      if (matchup.winner && matchup.winner.id !== winner.id) {
        invalidateDownstream(bracket, matchup.round + 1, matchup.winner.id);
      }

      matchup.winner = winner;

      // Propagate to parent matchup
      const nextRound = bracket.rounds[matchup.round + 1];
      if (nextRound) {
        const parentMatchup = nextRound.matchups.find(
          (m) =>
            m.childMatchupIds &&
            (m.childMatchupIds[0] === matchupId || m.childMatchupIds[1] === matchupId)
        );
        if (parentMatchup) {
          if (parentMatchup.childMatchupIds?.[0] === matchupId) {
            parentMatchup.artistA = winner;
          } else {
            parentMatchup.artistB = winner;
          }
        }
      } else {
        // This was the final round — set champion
        bracket.champion = winner;
      }

      return { bracket };
    }),

  openMatchup: (matchupId) => set({ currentMatchupId: matchupId }),
  closeMatchup: () => set({ currentMatchupId: null }),

  cacheTracks: (artistId, tracks) =>
    set((state) => ({
      trackCache: { ...state.trackCache, [artistId]: tracks },
    })),

  resetBracket: () => set({ bracket: null, currentMatchupId: null, readOnly: false }),

  setBracket: (bracket) => set({ bracket }),
  setReadOnly: (readOnly) => set({ readOnly }),

  getMatchupById: (id) => {
    const { bracket } = get();
    if (!bracket) return undefined;
    return findMatchup(bracket, id);
  },
}));

