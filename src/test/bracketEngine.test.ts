import { describe, it, expect } from 'vitest';
import { buildBracket } from '../utils/bracketEngine';
import { seedArtists } from '../utils/seeding';
import type { SpotifyArtist } from '../types/spotify';
import type { BracketSize } from '../types/bracket';

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

function buildTestBracket(size: BracketSize) {
  const artists = makeArtists(size);
  const seeded = seedArtists(artists, size);
  return buildBracket(seeded, size);
}

describe('buildBracket', () => {
  describe('32-artist bracket', () => {
    const bracket = buildTestBracket(32);

    it('creates 5 rounds', () => {
      expect(bracket.rounds).toHaveLength(5);
    });

    it('has correct round names', () => {
      const names = bracket.rounds.map((r) => r.name);
      expect(names).toEqual([
        'Round of 32',
        'Sweet 16',
        'Elite 8',
        'Final Four',
        'Championship',
      ]);
    });

    it('has 16 matchups in round 0', () => {
      expect(bracket.rounds[0]!.matchups).toHaveLength(16);
    });

    it('halves matchups each round: 16, 8, 4, 2, 1', () => {
      const counts = bracket.rounds.map((r) => r.matchups.length);
      expect(counts).toEqual([16, 8, 4, 2, 1]);
    });

    it('round 0 matchups have no childMatchupIds', () => {
      for (const m of bracket.rounds[0]!.matchups) {
        expect(m.childMatchupIds).toBeNull();
      }
    });

    it('all later rounds have childMatchupIds', () => {
      for (let r = 1; r < bracket.rounds.length; r++) {
        for (const m of bracket.rounds[r]!.matchups) {
          expect(m.childMatchupIds).not.toBeNull();
          expect(m.childMatchupIds).toHaveLength(2);
        }
      }
    });

    it('round 0 has #1 vs #8 seed matchups in each region', () => {
      for (let region = 0; region < 4; region++) {
        const regionMatchups = bracket.rounds[0]!.matchups.filter(
          (m) => m.regionIndex === region
        );
        // First matchup in each region should be 1 vs 8
        const m1 = regionMatchups[0]!;
        expect(m1.artistA?.seed).toBe(1);
        expect(m1.artistB?.seed).toBe(8);
      }
    });

    it('all round 0 matchups have both artists populated', () => {
      for (const m of bracket.rounds[0]!.matchups) {
        expect(m.artistA).not.toBeNull();
        expect(m.artistB).not.toBeNull();
      }
    });

    it('later round matchups have null artists (TBD)', () => {
      for (let r = 1; r < bracket.rounds.length; r++) {
        for (const m of bracket.rounds[r]!.matchups) {
          expect(m.artistA).toBeNull();
          expect(m.artistB).toBeNull();
        }
      }
    });

    it('has 4 regions', () => {
      expect(bracket.regions).toHaveLength(4);
    });

    it('champion starts as null', () => {
      expect(bracket.champion).toBeNull();
    });

    it('childMatchupIds reference valid matchups', () => {
      const allIds = new Set(
        bracket.rounds.flatMap((r) => r.matchups.map((m) => m.id))
      );
      for (let r = 1; r < bracket.rounds.length; r++) {
        for (const m of bracket.rounds[r]!.matchups) {
          expect(allIds.has(m.childMatchupIds![0])).toBe(true);
          expect(allIds.has(m.childMatchupIds![1])).toBe(true);
        }
      }
    });

    it('each round 0 matchup is referenced exactly once as a child', () => {
      const childRefs = new Map<string, number>();
      for (let r = 1; r < bracket.rounds.length; r++) {
        for (const m of bracket.rounds[r]!.matchups) {
          for (const childId of m.childMatchupIds!) {
            childRefs.set(childId, (childRefs.get(childId) ?? 0) + 1);
          }
        }
      }
      // Every matchup except championship should be referenced exactly once
      for (let r = 0; r < bracket.rounds.length - 1; r++) {
        for (const m of bracket.rounds[r]!.matchups) {
          expect(childRefs.get(m.id)).toBe(1);
        }
      }
    });
  });

  describe('16-artist bracket', () => {
    const bracket = buildTestBracket(16);

    it('creates 4 rounds', () => {
      expect(bracket.rounds).toHaveLength(4);
    });

    it('has matchup counts: 8, 4, 2, 1', () => {
      const counts = bracket.rounds.map((r) => r.matchups.length);
      expect(counts).toEqual([8, 4, 2, 1]);
    });

    it('has 2 regions', () => {
      expect(bracket.regions).toHaveLength(2);
    });
  });

  describe('8-artist bracket', () => {
    const bracket = buildTestBracket(8);

    it('creates 3 rounds', () => {
      expect(bracket.rounds).toHaveLength(3);
    });

    it('has matchup counts: 4, 2, 1', () => {
      const counts = bracket.rounds.map((r) => r.matchups.length);
      expect(counts).toEqual([4, 2, 1]);
    });

    it('has 1 region', () => {
      expect(bracket.regions).toHaveLength(1);
    });
  });
});
