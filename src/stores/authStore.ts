import { create } from 'zustand';
import type { SpotifyUser } from '../types/spotify';

interface AuthState {
  token: string | null;
  tokenExpiry: number | null;
  user: SpotifyUser | null;

  setToken: (token: string, expiresIn: number) => void;
  setUser: (user: SpotifyUser) => void;
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

  logout: () => {
    sessionStorage.removeItem('spotify_token');
    sessionStorage.removeItem('spotify_token_expiry');
    sessionStorage.removeItem('spotify_user');
    set({ token: null, tokenExpiry: null, user: null });
    window.location.href = '/';
  },

  isTokenValid: () => {
    const { token, tokenExpiry } = get();
    if (!token || !tokenExpiry) return false;
    return Date.now() < tokenExpiry;
  },
}));
