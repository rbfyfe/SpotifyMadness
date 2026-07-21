import type { Matchup, SeededArtist } from '../../types/bracket';

interface MiniMatchupCardProps {
  matchup: Matchup;
  onPick: (winner: SeededArtist) => void;
}

/** Two-letter monogram, e.g. "The Weeknd" -> "TW", "Drake" -> "DR". */
function initials(name: string): string {
  const words = name.split(' ').filter(Boolean);
  if (words.length === 1) return (words[0] ?? '').slice(0, 2).toUpperCase();
  return words
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function MiniMatchupCard({ matchup, onPick }: MiniMatchupCardProps) {
  const slots: (SeededArtist | null)[] = [matchup.artistA, matchup.artistB];

  return (
    <div
      data-testid={`mini-matchup-${matchup.id}`}
      className="flex flex-col gap-px overflow-hidden rounded-lg border border-border-subtle bg-border-subtle"
    >
      {slots.map((artist, index) =>
        artist ? (
          <button
            key={artist.id}
            type="button"
            onClick={() => onPick(artist)}
            aria-label={`Pick ${artist.name}`}
            aria-pressed={matchup.winner?.id === artist.id}
            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 ${
              matchup.winner?.id === artist.id
                ? 'bg-spotify-green text-black'
                : 'bg-bg-card text-text-primary hover:bg-bg-secondary'
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                matchup.winner?.id === artist.id
                  ? 'bg-black/20 text-black'
                  : 'bg-spotify-green/15 text-spotify-green'
              }`}
            >
              {initials(artist.name)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{artist.name}</span>
            <span className="shrink-0 text-xs opacity-60">{artist.seed}</span>
          </button>
        ) : (
          <div
            key={`empty-${index}`}
            className="flex items-center gap-3 bg-bg-card px-3 py-2.5 text-text-secondary"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border-subtle text-xs">
              —
            </span>
            <span className="flex-1 text-sm italic opacity-60">Awaiting winner</span>
          </div>
        ),
      )}
    </div>
  );
}
