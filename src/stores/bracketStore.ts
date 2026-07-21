import { create } from 'zustand';
import type { SpotifyArtist, SpotifyTrack } from '../types/spotify';
import type { BracketSize, BracketData, Matchup, SeededArtist } from '../types/bracket';
import { seedArtists } from '../utils/seeding';
import { buildBracket, applyWinner, findMatchup } from '../utils/bracketEngine';

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
      return { bracket: applyWinner(state.bracket, matchupId, winner) };
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

