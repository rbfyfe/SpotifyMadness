import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBracketStore } from '../../stores/bracketStore';
import { useAudioStore } from '../../stores/audioStore';
import { useSpotifyApi } from '../../hooks/useSpotifyApi';
import { ConfettiOverlay } from './ConfettiOverlay';
import { AlbumSpin } from './AlbumSpin';
import type { SpotifyAlbum } from '../../types/spotify';

export function WinnerScreen() {
  const bracket = useBracketStore((s) => s.bracket);
  const trackCache = useBracketStore((s) => s.trackCache);
  const cacheTracks = useBracketStore((s) => s.cacheTracks);
  const resetBracket = useBracketStore((s) => s.resetBracket);
  const { play } = useAudioStore();
  const { getArtistLatestAlbum, getArtistTopTracks } = useSpotifyApi();

  const [album, setAlbum] = useState<SpotifyAlbum | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [bracketPath, setBracketPath] = useState<string[]>([]);

  const champion = bracket?.champion;

  // Build bracket path (who they beat in each round)
  useEffect(() => {
    if (!bracket || !champion) return;

    const path: string[] = [];
    for (const round of bracket.rounds) {
      for (const matchup of round.matchups) {
        if (matchup.winner?.id === champion.id) {
          const opponent = matchup.artistA?.id === champion.id ? matchup.artistB : matchup.artistA;
          if (opponent) {
            path.push(`${round.name}: beat ${opponent.name}`);
          }
        }
      }
    }
    setBracketPath(path);
  }, [bracket, champion]);

  // Fetch album and auto-play
  useEffect(() => {
    if (!champion) return;

    getArtistLatestAlbum(champion.id).then((a) => setAlbum(a));

    const cached = trackCache[champion.id];
    if (cached?.[0]) {
      try { play(cached[0]); } catch { /* autoplay blocked */ }
    } else {
      getArtistTopTracks(champion.id).then((tracks) => {
        cacheTracks(champion.id, tracks);
        if (tracks[0]) {
          try { play(tracks[0]); } catch { /* autoplay blocked */ }
        }
      });
    }

    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [champion, trackCache, cacheTracks, getArtistLatestAlbum, getArtistTopTracks, play]);

  const handlePlayAgain = useCallback(() => {
    resetBracket();
    window.history.pushState({}, '', '/bracket');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [resetBracket]);

  const handleShare = useCallback(async () => {
    const text = `🏆 My Music Madness Champion: ${champion?.name}!\n\n${bracketPath.join('\n')}\n\nPlay at Music Madness!`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch { /* fallback to clipboard */ }
    }

    try {
      await navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    } catch {
      alert('Could not copy to clipboard. Try sharing manually.');
    }
  }, [champion, bracketPath]);

  if (!champion) return null;

  const image = champion.images[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 overflow-y-auto"
    >
      {showConfetti && <ConfettiOverlay />}

      <motion.h2
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        className="text-3xl md:text-5xl font-heading font-black text-glow mb-8 text-center"
      >
        🏆 YOUR CHAMPION 🏆
      </motion.h2>

      {/* Album Spin */}
      {album && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <AlbumSpin imageUrl={album.images[0]?.url ?? ''} />
        </motion.div>
      )}

      {/* Champion Image */}
      <motion.img
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
        src={image?.url}
        alt={champion.name}
        className="w-32 h-32 rounded-full object-cover border-4 border-spotify-green mb-4"
      />

      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-4xl md:text-6xl font-heading font-black mb-6 text-center"
      >
        {champion.name}
      </motion.h3>

      {/* Bracket Path */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="mb-8 text-center"
      >
        <p className="text-text-secondary text-sm font-heading font-semibold mb-2">Championship Run</p>
        <div className="space-y-1">
          {bracketPath.map((line, i) => (
            <p key={i} className="text-text-secondary text-xs font-body">{line}</p>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="flex gap-4"
      >
        <button
          onClick={handlePlayAgain}
          className="bg-spotify-green hover:bg-spotify-green-bright text-black font-bold px-8 py-3 rounded-full font-body cursor-pointer"
        >
          Play Again
        </button>
        <button
          onClick={handleShare}
          className="border border-spotify-green text-spotify-green hover:bg-spotify-green hover:text-black font-bold px-8 py-3 rounded-full font-body cursor-pointer transition-colors"
        >
          Share Results
        </button>
      </motion.div>
    </motion.div>
  );
}
