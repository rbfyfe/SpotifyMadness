import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { LoginPage } from '../components/LoginPage';
// Namespace import so these tests describe the desired API surface
// (isSpotifyConfigured) without crashing the whole file if it's absent.
import * as spotifyAuth from '../hooks/useSpotifyAuth';

// The app must never fall back to a hardcoded Spotify client ID: a fresh
// clone with a blank .env would silently use the maintainer's 25-user-capped
// Spotify app — the exact failure mode the landing page exists to explain.
// A missing VITE_SPOTIFY_CLIENT_ID has to surface as a visible config error.
describe('Spotify client ID configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  describe('isSpotifyConfigured', () => {
    it('returns false when VITE_SPOTIFY_CLIENT_ID is empty', () => {
      vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', '');

      expect(spotifyAuth.isSpotifyConfigured()).toBe(false);
    });

    it('returns true when VITE_SPOTIFY_CLIENT_ID is set', () => {
      vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'test-client-id');

      expect(spotifyAuth.isSpotifyConfigured()).toBe(true);
    });
  });

  describe('LoginPage', () => {
    it('shows a config error instead of the Spotify button when the client ID is missing', () => {
      vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', '');

      render(<LoginPage />);

      expect(
        screen.queryByRole('button', { name: /connect with spotify/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText('VITE_SPOTIFY_CLIENT_ID')).toBeInTheDocument();
      // Demo mode needs no Spotify app, so it must stay available.
      expect(screen.getByRole('button', { name: /try demo/i })).toBeInTheDocument();
    });

    it('shows the Spotify button and no config error when the client ID is set', () => {
      vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'test-client-id');

      render(<LoginPage />);

      expect(
        screen.getByRole('button', { name: /connect with spotify/i })
      ).toBeInTheDocument();
      expect(screen.queryByText('VITE_SPOTIFY_CLIENT_ID')).not.toBeInTheDocument();
    });
  });

  describe('useSpotifyAuth', () => {
    it('login() rejects with an error naming the missing variable', async () => {
      vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', '');

      const { result } = renderHook(() => spotifyAuth.useSpotifyAuth());

      await expect(result.current.login()).rejects.toThrow(/VITE_SPOTIFY_CLIENT_ID/);
    });

    it('handleCallback() fails fast without calling the token endpoint when the client ID is missing', async () => {
      vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', '');
      window.history.pushState({}, '', '/callback?code=abc123');
      sessionStorage.setItem('pkce_verifier', 'test-verifier');
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('token endpoint must not be called'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => spotifyAuth.useSpotifyAuth());
      const succeeded = await result.current.handleCallback();

      expect(succeeded).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
