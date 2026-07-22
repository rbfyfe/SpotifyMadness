import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { generateRandomString, generateCodeChallenge } from '../utils/pkce';

// No hardcoded fallback here: a fresh clone with a blank .env must get a
// visible config error, not silently use someone else's 25-user-capped
// Spotify app. Read lazily so the check happens where it can be surfaced.
function getClientId(): string | undefined {
  return import.meta.env.VITE_SPOTIFY_CLIENT_ID || undefined;
}

export function isSpotifyConfigured(): boolean {
  return getClientId() !== undefined;
}

const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/callback`;
const SCOPES = 'user-top-read streaming user-read-email user-read-private';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

export function useSpotifyAuth() {
  const { setToken, setUser } = useAuthStore();

  const login = useCallback(async () => {
    const clientId = getClientId();
    if (!clientId) {
      throw new Error(
        'VITE_SPOTIFY_CLIENT_ID is not set. Copy .env.example to .env and add your Spotify app client ID.'
      );
    }

    const verifier = generateRandomString(128);
    sessionStorage.setItem('pkce_verifier', verifier);

    const challenge = await generateCodeChallenge(verifier);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });

    window.location.href = `${AUTH_URL}?${params.toString()}`;
  }, []);

  const handleCallback = useCallback(async (): Promise<boolean> => {
    const clientId = getClientId();
    if (!clientId) {
      console.error('VITE_SPOTIFY_CLIENT_ID is not set; cannot complete Spotify login.');
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error || !code) {
      console.error('Auth error:', error);
      return false;
    }

    const verifier = sessionStorage.getItem('pkce_verifier');
    if (!verifier) {
      console.error('No PKCE verifier found');
      return false;
    }

    try {
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: clientId,
          code_verifier: verifier,
        }),
      });

      if (!response.ok) {
        console.error('Token exchange failed:', response.status);
        return false;
      }

      const data = await response.json();
      setToken(data.access_token, data.expires_in);
      sessionStorage.removeItem('pkce_verifier');

      // Fetch user profile
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      }

      return true;
    } catch (err) {
      console.error('Auth callback error:', err);
      return false;
    }
  }, [setToken, setUser]);

  return { login, handleCallback };
}
