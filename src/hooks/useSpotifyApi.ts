import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { SpotifyArtist, SpotifyTrack, SpotifyAlbum } from '../types/spotify';

const BASE_URL = 'https://api.spotify.com/v1';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useSpotifyApi() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const fetchWithAuth = useCallback(
    async (url: string, retries = 3): Promise<Response> => {
      const res = await fetch(`${BASE_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
        if (retries > 0) {
          await delay(retryAfter * 1000);
          return fetchWithAuth(url, retries - 1);
        }
        throw new Error('Rate limited by Spotify. Please try again in a moment.');
      }

      if (!res.ok) {
        throw new Error(`Spotify API error: ${res.status}`);
      }

      return res;
    },
    [token, logout]
  );

  const getTopArtists = useCallback(async (): Promise<SpotifyArtist[]> => {
    const artists = new Map<string, SpotifyArtist>();
    const timeRanges = ['medium_term', 'long_term', 'short_term'] as const;

    for (const timeRange of timeRanges) {
      if (artists.size >= 32) break;

      const res = await fetchWithAuth(
        `/me/top/artists?limit=50&time_range=${timeRange}`
      );
      const data = await res.json();

      for (const artist of data.items as SpotifyArtist[]) {
        if (!artists.has(artist.id)) {
          artists.set(artist.id, artist);
        }
      }
    }

    return Array.from(artists.values());
  }, [fetchWithAuth]);

  const getArtistTopTracks = useCallback(
    async (artistId: string): Promise<SpotifyTrack[]> => {
      const res = await fetchWithAuth(
        `/artists/${artistId}/top-tracks?market=US`
      );
      const data = await res.json();
      return (data.tracks as SpotifyTrack[]).slice(0, 3);
    },
    [fetchWithAuth]
  );

  const getArtistLatestAlbum = useCallback(
    async (artistId: string): Promise<SpotifyAlbum | null> => {
      const res = await fetchWithAuth(
        `/artists/${artistId}/albums?limit=1&include_groups=album,single&market=US`
      );
      const data = await res.json();
      return (data.items as SpotifyAlbum[])[0] ?? null;
    },
    [fetchWithAuth]
  );

  return { getTopArtists, getArtistTopTracks, getArtistLatestAlbum };
}
