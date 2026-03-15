import { describe, it, expect } from 'vitest';
import { seedArtists } from '../utils/seeding';
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

describe('seedArtists', () => {
  describe('32-artist bracket', () => {
    const artists = makeArtists(32);
    const seeded = seedArtists(artists, 32);

    it('returns exactly 32 seeded artists', () => {
      expect(seeded).toHaveLength(32);
    });

    it('assigns 8 artists per region', () => {
      for (let r = 0; r < 4; r++) {
        const regionArtists = seeded.filter((a) => a.regionIndex === r);
        expect(regionArtists).toHaveLength(8);
      }
    });

    it('assigns seeds 1-8 within each region', () => {
      for (let r = 0; r < 4; r++) {
        const seeds = seeded
          .filter((a) => a.regionIndex === r)
          .map((a) => a.seed)
          .sort((a, b) => a - b);
        expect(seeds).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      }
    });

    it('distributes top 4 artists across all 4 regions as #1 seeds', () => {
      const topSeeds = seeded.filter((a) => a.seed === 1);
      expect(topSeeds).toHaveLength(4);
      const regionIndices = topSeeds.map((a) => a.regionIndex).sort();
      expect(regionIndices).toEqual([0, 1, 2, 3]);
    });

    it('uses serpentine: #1 overall goes to region 0, #2 to region 1, etc.', () => {
      // The most popular artist (id "a1", popularity 100) should be seed 1 in region 0
      const mostPopular = seeded.find((a) => a.id === 'a1');
      expect(mostPopular?.seed).toBe(1);
      expect(mostPopular?.regionIndex).toBe(0);

      // Second most popular should be seed 1 in region 1
      const second = seeded.find((a) => a.id === 'a2');
      expect(second?.seed).toBe(1);
      expect(second?.regionIndex).toBe(1);
    });

    it('serpentine reverses on odd seed levels', () => {
      // For seed level 1 (0-indexed), direction reverses: region 3, 2, 1, 0
      // Artists 5-8 (indices 4-7) should go to regions 3, 2, 1, 0
      const seed2Artists = seeded.filter((a) => a.seed === 2);
      expect(seed2Artists).toHaveLength(4);

      // Artist a5 (5th most popular) should be seed 2 in region 3 (reversed)
      const a5 = seeded.find((a) => a.id === 'a5');
      expect(a5?.seed).toBe(2);
      expect(a5?.regionIndex).toBe(3);
    });

    it('ensures balanced regions by popularity', () => {
      // Each region should have a similar total popularity
      const regionPops: number[] = [0, 0, 0, 0];
      for (const a of seeded) {
        regionPops[a.regionIndex]! += a.popularity;
      }
      const avg = regionPops.reduce((s, v) => s + v, 0) / 4;
      for (const pop of regionPops) {
        // Each region should be within 15% of average
        expect(Math.abs(pop - avg) / avg).toBeLessThan(0.15);
      }
    });
  });

  describe('16-artist bracket', () => {
    const artists = makeArtists(16);
    const seeded = seedArtists(artists, 16);

    it('returns exactly 16 seeded artists', () => {
      expect(seeded).toHaveLength(16);
    });

    it('uses 2 regions with 8 artists each', () => {
      const r0 = seeded.filter((a) => a.regionIndex === 0);
      const r1 = seeded.filter((a) => a.regionIndex === 1);
      expect(r0).toHaveLength(8);
      expect(r1).toHaveLength(8);
    });
  });

  describe('8-artist bracket', () => {
    const artists = makeArtists(8);
    const seeded = seedArtists(artists, 8);

    it('returns exactly 8 seeded artists', () => {
      expect(seeded).toHaveLength(8);
    });

    it('uses 1 region with 8 artists', () => {
      const r0 = seeded.filter((a) => a.regionIndex === 0);
      expect(r0).toHaveLength(8);
    });

    it('most popular artist is seed 1', () => {
      const seed1 = seeded.find((a) => a.seed === 1);
      expect(seed1?.popularity).toBe(100);
    });

    it('least popular is seed 8', () => {
      const seed8 = seeded.find((a) => a.seed === 8);
      expect(seed8?.popularity).toBe(93);
    });
  });
});
