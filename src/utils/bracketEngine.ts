import type { BracketSize, BracketData, SeededArtist, Matchup, Round, RegionName } from '../types/bracket';
import { REGION_NAMES } from '../types/bracket';

/** Seeding pattern for first-round matchups within a region: 1v8, 4v5, 3v6, 2v7 */
const SEED_MATCHUPS: [number, number][] = [
  [1, 8],
  [4, 5],
  [3, 6],
  [2, 7],
];

function getRoundNames(size: BracketSize): string[] {
  if (size === 32) return ['Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'];
  if (size === 16) return ['Round of 16', 'Quarterfinal', 'Semifinal', 'Championship'];
  return ['Quarterfinal', 'Semifinal', 'Championship'];
}

function getRegions(size: BracketSize): RegionName[] {
  if (size === 32) return [...REGION_NAMES];
  if (size === 16) return [REGION_NAMES[0], REGION_NAMES[1]];
  return [REGION_NAMES[0]];
}

export function buildBracket(seededArtists: SeededArtist[], size: BracketSize): BracketData {
  const regions = getRegions(size);
  const roundNames = getRoundNames(size);
  const regionCount = regions.length;
  const rounds: Round[] = [];

  // Group artists by region
  const artistsByRegion = new Map<number, SeededArtist[]>();
  for (const artist of seededArtists) {
    const list = artistsByRegion.get(artist.regionIndex) ?? [];
    list.push(artist);
    artistsByRegion.set(artist.regionIndex, list);
  }

  // Round 0: Initial matchups within each region
  let globalMatchupIndex = 0;
  const round0Matchups: Matchup[] = [];

  for (let r = 0; r < regionCount; r++) {
    const regionArtists = artistsByRegion.get(r) ?? [];

    for (const [seedA, seedB] of SEED_MATCHUPS) {
      const artistA = regionArtists.find((a) => a.seed === seedA) ?? null;
      const artistB = regionArtists.find((a) => a.seed === seedB) ?? null;

      round0Matchups.push({
        id: `r0-m${globalMatchupIndex}`,
        round: 0,
        position: globalMatchupIndex,
        regionIndex: r,
        artistA,
        artistB,
        winner: null,
        childMatchupIds: null,
      });
      globalMatchupIndex++;
    }
  }

  rounds.push({ index: 0, name: roundNames[0]!, matchups: round0Matchups });

  // Subsequent rounds
  let prevMatchups = round0Matchups;
  for (let roundIndex = 1; roundIndex < roundNames.length; roundIndex++) {
    const currentMatchups: Matchup[] = [];
    globalMatchupIndex = 0;

    // Pair up adjacent matchups from previous round
    for (let i = 0; i + 1 < prevMatchups.length; i += 2) {
      const child1 = prevMatchups[i]!;
      const child2 = prevMatchups[i + 1]!;

      // Region index: for rounds within regions, inherit.
      // For cross-region rounds (Final Four+), use -1.
      const regionIdx = child1.regionIndex === child2.regionIndex
        ? child1.regionIndex
        : -1;

      currentMatchups.push({
        id: `r${roundIndex}-m${globalMatchupIndex}`,
        round: roundIndex,
        position: globalMatchupIndex,
        regionIndex: regionIdx,
        artistA: null,
        artistB: null,
        winner: null,
        childMatchupIds: [child1.id, child2.id],
      });
      globalMatchupIndex++;
    }

    rounds.push({
      index: roundIndex,
      name: roundNames[roundIndex]!,
      matchups: currentMatchups,
    });
    prevMatchups = currentMatchups;
  }

  return {
    size,
    regions,
    rounds,
    champion: null,
  };
}
