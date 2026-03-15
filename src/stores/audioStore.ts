import { create } from 'zustand';
import type { SpotifyTrack } from '../types/spotify';
import { useAuthStore } from './authStore';

let player: SpotifyPlayer | null = null;
let deviceId: string | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;
let sdkReadyPromise: Promise<void> | null = null;

function waitForSDK(): Promise<void> {
  if (sdkReadyPromise) return sdkReadyPromise;
  sdkReadyPromise = new Promise((resolve) => {
    if (window.Spotify) {
      resolve();
    } else {
      window.onSpotifyWebPlaybackSDKReady = () => resolve();
    }
  });
  return sdkReadyPromise;
}

async function initPlayer(): Promise<string | null> {
  if (player && deviceId) return deviceId;

  await waitForSDK();

  const token = useAuthStore.getState().token;
  if (!token) return null;

  return new Promise((resolve) => {
    player = new window.Spotify.Player({
      name: 'Music Madness',
      getOAuthToken: (cb) => {
        const currentToken = useAuthStore.getState().token;
        if (currentToken) cb(currentToken);
      },
      volume: 0.8,
    });

    player.addListener('ready', (data: unknown) => {
      const { device_id } = data as { device_id: string };
      deviceId = device_id;
      resolve(device_id);
    });

    player.addListener('not_ready', () => {
      deviceId = null;
    });

    player.addListener('player_state_changed', (state: unknown) => {
      const playerState = state as SpotifyPlayerState | null;
      if (!playerState) return;

      const store = useAudioStore.getState();
      if (playerState.paused && store.isPlaying) {
        useAudioStore.setState({ isPlaying: false });
      }
    });

    player.addListener('initialization_error', (e: unknown) => {
      console.error('Spotify SDK init error:', e);
      resolve(null);
    });

    player.addListener('authentication_error', (e: unknown) => {
      console.error('Spotify SDK auth error:', e);
      resolve(null);
    });

    player.connect();
  });
}

function startProgressTracking() {
  stopProgressTracking();
  progressInterval = setInterval(async () => {
    if (!player) return;
    const state = await player.getCurrentState();
    if (state && !state.paused) {
      useAudioStore.setState({
        progress: (state.position / state.duration) * 100,
        duration: state.duration / 1000,
      });
    }
  }, 500);
}

function stopProgressTracking() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

interface AudioState {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  sdkReady: boolean;
  sdkError: string | null;

  play: (track: SpotifyTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  seekTo: (progress: number) => void;
  initSDK: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  duration: 0,
  sdkReady: false,
  sdkError: null,

  initSDK: () => {
    initPlayer().then((id) => {
      if (id) {
        set({ sdkReady: true, sdkError: null });
      } else {
        set({ sdkError: 'Could not initialize Spotify player' });
      }
    });
  },

  play: async (track) => {
    const { currentTrack } = get();

    // If same track, just resume
    if (currentTrack?.id === track.id) {
      get().resume();
      return;
    }

    // Try Web Playback SDK first
    const devId = await initPlayer();
    if (devId) {
      const token = useAuthStore.getState().token;
      if (!token) return;

      try {
        const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${devId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: [`spotify:track:${track.id}`] }),
        });

        if (res.ok || res.status === 204) {
          set({ currentTrack: track, isPlaying: true, progress: 0 });
          startProgressTracking();
          return;
        }
      } catch {
        // Fall through to preview_url fallback
      }
    }

    // Fallback: use preview_url if SDK fails
    if (track.preview_url) {
      playPreview(track, get().volume, set);
    }
  },

  pause: async () => {
    if (player) {
      try {
        await player.pause();
      } catch { /* ignore */ }
    }
    stopProgressTracking();
    set({ isPlaying: false });
  },

  resume: async () => {
    if (player) {
      try {
        await player.resume();
        set({ isPlaying: true });
        startProgressTracking();
        return;
      } catch { /* ignore */ }
    }
    set({ isPlaying: true });
  },

  stop: async () => {
    if (player) {
      try {
        await player.pause();
      } catch { /* ignore */ }
    }
    stopProgressTracking();
    // Stop the fallback audio element too
    if (fallbackAudio) {
      fallbackAudio.pause();
      fallbackAudio.src = '';
    }
    set({ currentTrack: null, isPlaying: false, progress: 0, duration: 0 });
  },

  setVolume: async (v) => {
    if (player) {
      try {
        await player.setVolume(v);
      } catch { /* ignore */ }
    }
    if (fallbackAudio) {
      fallbackAudio.volume = v;
    }
    set({ volume: v });
  },

  seekTo: async (progress) => {
    const { duration } = get();
    if (player && duration) {
      try {
        await player.seek((progress / 100) * duration * 1000);
      } catch { /* ignore */ }
    }
  },
}));

// Fallback preview_url audio element (for when SDK isn't available)
let fallbackAudio: HTMLAudioElement | null = null;

function playPreview(
  track: SpotifyTrack,
  volume: number,
  set: (state: Partial<AudioState>) => void
) {
  if (!track.preview_url) return;

  if (!fallbackAudio) {
    fallbackAudio = new Audio();
  }

  fallbackAudio.onended = () => set({ isPlaying: false, progress: 0 });
  fallbackAudio.ontimeupdate = () => {
    if (fallbackAudio && fallbackAudio.duration && !isNaN(fallbackAudio.currentTime)) {
      set({
        progress: (fallbackAudio.currentTime / fallbackAudio.duration) * 100,
        duration: fallbackAudio.duration,
      });
    }
  };

  fallbackAudio.src = track.preview_url;
  fallbackAudio.volume = volume;
  fallbackAudio.play().catch(() => { /* autoplay blocked */ });
  set({ currentTrack: track, isPlaying: true, progress: 0 });
}
