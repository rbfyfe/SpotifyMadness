import type { SpotifyArtist } from './spotify';

export type BracketSize = 32 | 16 | 8;

export const REGION_NAMES = ['🎸 Amplifier', '🎹 Crescendo', '🥁 Encore', '🎤 Anthem'] as const;
export type RegionName = (typeof REGION_NAMES)[number];

export interface SeededArtist extends SpotifyArtist {
  seed: number;
  regionIndex: number;
}

export interface Matchup {
  id: string;
  round: number;
  position: number;
  regionIndex: number;
  artistA: SeededArtist | null;
  artistB: SeededArtist | null;
  winner: SeededArtist | null;
  childMatchupIds: [string, string] | null;
}

export interface Round {
  index: number;
  name: string;
  matchups: Matchup[];
}

export interface BracketData {
  size: BracketSize;
  regions: RegionName[];
  rounds: Round[];
  champion: SeededArtist | null;
}
