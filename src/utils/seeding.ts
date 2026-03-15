import type { SpotifyArtist } from '../types/spotify';
import type { BracketSize, SeededArtist } from '../types/bracket';

/**
 * Seeds artists into regions using a serpentine draft pattern.
 * For 32 artists: 4 regions of 8 each.
 * For 16 artists: 2 regions of 8 each.
 * For 8 artists: 1 region of 8.
 */
export function seedArtists(
  artists: SpotifyArtist[],
  size: BracketSize
): SeededArtist[] {
  // Sort by popularity descending
  const sorted = [...artists]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, size);

  const regionCount = size === 32 ? 4 : size === 16 ? 2 : 1;
  const artistsPerRegion = 8;

  // Distribute artists into regions using serpentine draft.
  // Each region gets one artist per seed level.
  // Even seed levels go left-to-right (region 0,1,2,3),
  // odd seed levels go right-to-left (region 3,2,1,0).
  const regions: SpotifyArtist[][] = Array.from({ length: regionCount }, () => []);
  let globalIdx = 0;

  for (let seedLevel = 0; seedLevel < artistsPerRegion; seedLevel++) {
    for (let r = 0; r < regionCount; r++) {
      const regionIndex = seedLevel % 2 === 0 ? r : regionCount - 1 - r;
      const artist = sorted[globalIdx];
      if (artist) {
        regions[regionIndex]!.push(artist);
      }
      globalIdx++;
    }
  }

  // Convert to SeededArtist with seed = position within region (1-based)
  const seeded: SeededArtist[] = [];
  for (let r = 0; r < regionCount; r++) {
    for (let s = 0; s < regions[r]!.length; s++) {
      seeded.push({
        ...regions[r]![s]!,
        seed: s + 1,
        regionIndex: r,
      });
    }
  }

  return seeded;
}
