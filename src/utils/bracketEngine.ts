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

/** Find a matchup anywhere in the bracket by id. */
export function findMatchup(bracket: BracketData, id: string): Matchup | undefined {
  for (const round of bracket.rounds) {
    const found = round.matchups.find((m) => m.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Recursively remove an artist from all downstream matchups. Mutates in place. */
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
  if (bracket.champion?.id === artistId) {
    bracket.champion = null;
  }
}

/**
 * Record a winner and propagate them forward, returning a new bracket.
 * Changing an existing winner invalidates every downstream matchup they reached.
 * Returns the input unchanged if the matchup id is unknown.
 */
export function applyWinner(
  bracket: BracketData,
  matchupId: string,
  winner: SeededArtist,
): BracketData {
  const next: BracketData = {
    ...bracket,
    champion: bracket.champion ? { ...bracket.champion } : null,
    regions: [...bracket.regions],
    rounds: bracket.rounds.map((r) => ({
      ...r,
      matchups: r.matchups.map((m) => ({ ...m })),
    })),
  };

  const matchup = findMatchup(next, matchupId);
  if (!matchup) return bracket;

  if (matchup.winner && matchup.winner.id !== winner.id) {
    invalidateDownstream(next, matchup.round + 1, matchup.winner.id);
  }

  matchup.winner = winner;

  const nextRound = next.rounds[matchup.round + 1];
  if (nextRound) {
    const parent = nextRound.matchups.find(
      (m) =>
        m.childMatchupIds &&
        (m.childMatchupIds[0] === matchupId || m.childMatchupIds[1] === matchupId),
    );
    if (parent) {
      if (parent.childMatchupIds?.[0] === matchupId) {
        parent.artistA = winner;
      } else {
        parent.artistB = winner;
      }
    }
  } else {
    next.champion = winner;
  }

  return next;
}
