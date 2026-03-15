import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useBracketStore } from '../stores/bracketStore';
import { useSpotifyApi } from '../hooks/useSpotifyApi';
import { useAudioStore } from '../stores/audioStore';
import { BracketLayout } from './bracket/BracketLayout';
import { MatchupModal } from './matchup/MatchupModal';
import { MiniPlayer } from './audio/MiniPlayer';
import { WinnerScreen } from './celebration/WinnerScreen';
import type { BracketSize } from '../types/bracket';

export function BracketPage() {
  const user = useAuthStore((s) => s.user);
  const { bracket, currentMatchupId, initBracket, setArtists } = useBracketStore();
  const { getTopArtists } = useSpotifyApi();
  const initSDK = useAudioStore((s) => s.initSDK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sizeOptions, setSizeOptions] = useState<BracketSize[] | null>(null);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    initSDK();
  }, [initSDK]);

  useEffect(() => {
    if (bracket) {
      setLoading(false);
      return;
    }

    getTopArtists()
      .then((artists) => {
        setArtists(artists);
        if (artists.length >= 32) {
          initBracket(32);
        } else if (artists.length >= 16) {
          setSizeOptions([16]);
        } else if (artists.length >= 8) {
          setSizeOptions([8]);
        } else {
          setError(
            `You only have ${artists.length} top artists. Listen to more music on Spotify — we need at least 8 artists to fill a bracket!`
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load artists');
        setLoading(false);
      });
  }, [bracket, getTopArtists, initBracket, setArtists]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary font-body text-lg">Loading your top artists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
        <p className="text-6xl mb-6">🎵</p>
        <p className="text-text-primary text-xl mb-2 font-heading text-center">{error}</p>
        <a href="/" className="mt-6 text-spotify-green hover:text-spotify-green-bright font-body">
          Back to Home
        </a>
      </div>
    );
  }

  if (sizeOptions && !bracket) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
        <h2 className="text-3xl font-heading font-bold mb-4">Not Enough Artists for 32</h2>
        <p className="text-text-secondary mb-8 font-body text-center max-w-md">
          We couldn't find 32 top artists, but you can still run a smaller bracket!
        </p>
        <div className="flex gap-4">
          {sizeOptions.map((size) => (
            <motion.button
              key={size}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => initBracket(size)}
              className="bg-spotify-green hover:bg-spotify-green-bright text-black font-bold px-8 py-3 rounded-full font-body cursor-pointer"
            >
              {size}-Artist Bracket
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  if (!bracket) return null;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg-primary/90 backdrop-blur-sm border-b border-border-subtle px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-heading font-bold">
          🏆 Music Madness
        </h1>
        {user && (
          <span className="text-text-secondary text-sm font-body">
            {user.display_name}
          </span>
        )}
      </div>

      {/* Bracket */}
      <BracketLayout />

      {/* Matchup Modal */}
      {currentMatchupId && <MatchupModal />}

      {/* Mini Player */}
      <MiniPlayer />

      {/* Winner Celebration */}
      {bracket.champion && <WinnerScreen />}
    </div>
  );
}
