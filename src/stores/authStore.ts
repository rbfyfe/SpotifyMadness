import { create } from 'zustand';
import type { SpotifyUser } from '../types/spotify';

interface AuthState {
  token: string | null;
  tokenExpiry: number | null;
  user: SpotifyUser | null;
  isDemo: boolean;

  setToken: (token: string, expiresIn: number) => void;
  setUser: (user: SpotifyUser) => void;
  setDemo: () => void;
  logout: () => void;
  isTokenValid: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: sessionStorage.getItem('spotify_token'),
  tokenExpiry: (() => {
    const expiry = sessionStorage.getItem('spotify_token_expiry');
    return expiry ? parseInt(expiry, 10) : null;
  })(),
  user: (() => {
    const user = sessionStorage.getItem('spotify_user');
    return user ? (JSON.parse(user) as SpotifyUser) : null;
  })(),
  isDemo: sessionStorage.getItem('demo_mode') === 'true',

  setToken: (token, expiresIn) => {
    const expiry = Date.now() + expiresIn * 1000;
    sessionStorage.setItem('spotify_token', token);
    sessionStorage.setItem('spotify_token_expiry', expiry.toString());
    set({ token, tokenExpiry: expiry });
  },

  setUser: (user) => {
    sessionStorage.setItem('spotify_user', JSON.stringify(user));
    set({ user });
  },

  setDemo: () => {
    sessionStorage.setItem('demo_mode', 'true');
    set({
      isDemo: true,
      token: 'demo',
      tokenExpiry: Date.now() + 86400000,
      user: {
        id: 'demo-user',
        display_name: 'Demo User',
        email: 'demo@example.com',
        images: [],
      },
    });
  },

  logout: () => {
    sessionStorage.removeItem('spotify_token');
    sessionStorage.removeItem('spotify_token_expiry');
    sessionStorage.removeItem('spotify_user');
    sessionStorage.removeItem('demo_mode');
    set({ token: null, tokenExpiry: null, user: null, isDemo: false });
    window.location.href = '/';
  },

  isTokenValid: () => {
    const { token, tokenExpiry, isDemo } = get();
    if (isDemo) return true;
    if (!token || !tokenExpiry) return false;
    return Date.now() < tokenExpiry;
  },
}));
