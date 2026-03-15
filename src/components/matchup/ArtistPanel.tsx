import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { SeededArtist } from '../../types/bracket';
import { useBracketStore } from '../../stores/bracketStore';
import { useSpotifyApi } from '../../hooks/useSpotifyApi';
import { TrackList } from './TrackList';

interface ArtistPanelProps {
  artist: SeededArtist;
  onSelect: () => void;
  isWinner: boolean;
}

export function ArtistPanel({ artist, onSelect, isWinner }: ArtistPanelProps) {
  const trackCache = useBracketStore((s) => s.trackCache);
  const cacheTracks = useBracketStore((s) => s.cacheTracks);
  const { getArtistTopTracks } = useSpotifyApi();

  const tracks = trackCache[artist.id];

  useEffect(() => {
    if (!tracks) {
      getArtistTopTracks(artist.id).then((t) => cacheTracks(artist.id, t));
    }
  }, [artist.id, tracks, getArtistTopTracks, cacheTracks]);

  const image = artist.images[0];

  return (
    <div className="p-6 flex flex-col items-center">
      {/* Artist Image */}
      <motion.img
        layoutId={`artist-${artist.id}`}
        src={image?.url}
        alt={artist.name}
        className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-bg-card mb-4"
      />

      {/* Name & Seed */}
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-spotify-green text-black text-xs font-bold px-2 py-0.5 rounded-full font-body">
          #{artist.seed}
        </span>
        <h3 className="text-xl md:text-2xl font-heading font-bold text-center">
          {artist.name}
        </h3>
      </div>

      {/* Popularity Bar */}
      <div className="w-full max-w-xs mb-3">
        <div className="flex justify-between text-xs text-text-secondary mb-1 font-body">
          <span>Popularity</span>
          <span>{artist.popularity}/100</span>
        </div>
        <div className="h-2 bg-bg-card rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${artist.popularity}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-spotify-green rounded-full"
          />
        </div>
      </div>

      {/* Genres */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {artist.genres.slice(0, 4).map((genre) => (
          <span
            key={genre}
            className="text-[11px] px-2 py-0.5 rounded-full bg-bg-card text-text-secondary border border-border-subtle font-body"
          >
            {genre}
          </span>
        ))}
      </div>

      {/* Tracks */}
      <div className="w-full mb-6">
        <h4 className="text-sm font-heading font-semibold text-text-secondary mb-2">Top Tracks</h4>
        {tracks ? (
          <TrackList tracks={tracks} />
        ) : (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-bg-card rounded animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* Choose Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSelect}
        className={`
          w-full max-w-xs py-3 rounded-full font-bold font-body text-sm transition-colors cursor-pointer
          ${isWinner
            ? 'bg-spotify-green text-black'
            : 'bg-bg-card border border-spotify-green text-spotify-green hover:bg-spotify-green hover:text-black'
          }
        `}
      >
        {isWinner ? '✓ Selected' : `Choose ${artist.name}`}
      </motion.button>
    </div>
  );
}
