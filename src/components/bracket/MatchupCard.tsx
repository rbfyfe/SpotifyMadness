import { motion } from 'framer-motion';
import type { Matchup, SeededArtist } from '../../types/bracket';
import { useBracketStore } from '../../stores/bracketStore';

interface MatchupCardProps {
  matchup: Matchup;
}

export function MatchupCard({ matchup }: MatchupCardProps) {
  const openMatchup = useBracketStore((s) => s.openMatchup);
  const readOnly = useBracketStore((s) => s.readOnly);

  const isActive = matchup.artistA && matchup.artistB && !matchup.winner;
  const isDecided = matchup.winner !== null;
  const isEmpty = !matchup.artistA && !matchup.artistB;

  const handleClick = () => {
    if (readOnly || isEmpty) return;
    // Allow clicking decided matchups to change winner
    if (matchup.artistA && matchup.artistB) {
      openMatchup(matchup.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        rounded-lg overflow-hidden mx-1
        ${isEmpty ? 'bg-bg-secondary/50 border border-border-subtle/30' : 'bg-bg-secondary border border-border-subtle'}
        ${!readOnly && isActive ? 'glow-pulse cursor-pointer border-spotify-green/50' : ''}
        ${!readOnly && isDecided ? 'cursor-pointer hover:border-text-secondary/50' : ''}
        ${readOnly || (!isEmpty && !isActive && !isDecided) ? 'cursor-default' : ''}
      `}
      onClick={handleClick}
      whileHover={!readOnly && (isActive || isDecided) ? { scale: 1.02 } : undefined}
    >
      <ArtistRow
        artist={matchup.artistA}
        isWinner={matchup.winner?.id === matchup.artistA?.id}
        isLoser={isDecided && matchup.winner?.id !== matchup.artistA?.id}
      />

      {/* VS divider */}
      <div className="h-px bg-border-subtle relative">
        {isActive && (
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card text-[10px] text-text-secondary px-1.5 font-body">
            VS
          </span>
        )}
      </div>

      <ArtistRow
        artist={matchup.artistB}
        isWinner={matchup.winner?.id === matchup.artistB?.id}
        isLoser={isDecided && matchup.winner?.id !== matchup.artistB?.id}
      />
    </motion.div>
  );
}

function ArtistRow({
  artist,
  isWinner,
  isLoser,
}: {
  artist: SeededArtist | null;
  isWinner: boolean;
  isLoser: boolean;
}) {
  if (!artist) {
    return <div className="h-10 flex items-center px-2 text-text-secondary/30 text-xs font-body">TBD</div>;
  }

  const image = artist.images.find((img) => img.width === 320 || img.width === 300) ?? artist.images[0];

  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5 transition-opacity duration-300
        ${isWinner ? 'bg-spotify-green/10' : ''}
        ${isLoser ? 'opacity-40' : ''}
      `}
    >
      {/* Artist Image */}
      <img
        src={image?.url}
        alt={artist.name}
        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
      />

      {/* Seed */}
      <span className="text-[10px] text-text-secondary font-body w-3 text-center flex-shrink-0">
        {artist.seed}
      </span>

      {/* Name */}
      <span
        className={`text-xs truncate flex-1 font-body ${isWinner ? 'text-spotify-green font-semibold' : 'text-text-primary'}`}
      >
        {artist.name}
      </span>

      {/* Popularity */}
      <span className="text-[10px] text-text-secondary font-body flex-shrink-0">
        {artist.popularity}
      </span>
    </div>
  );
}
