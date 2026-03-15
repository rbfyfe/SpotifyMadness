import type { Matchup } from '../../types/bracket';
import { MatchupCard } from './MatchupCard';

interface RoundColumnProps {
  matchups: Matchup[];
  roundIndex: number;
  direction: 'ltr' | 'rtl';
}

export function RoundColumn({ matchups, roundIndex, direction }: RoundColumnProps) {
  // Increase spacing as rounds progress to align with bracket lines
  const gapClass = roundIndex === 0 ? 'gap-2' : roundIndex === 1 ? 'gap-12' : 'gap-28';

  return (
    <div className="relative" style={{ width: '180px', flexShrink: 0 }}>
      <div className={`flex flex-col justify-center ${gapClass} py-2`} style={{ minHeight: matchups.length > 1 ? matchups.length * 100 : 120 }}>
        {matchups.map((matchup, i) => (
          <div key={matchup.id} className="relative">
            <MatchupCard matchup={matchup} />
            {/* Bracket connector lines */}
            {roundIndex < 2 && i % 2 === 0 && matchups[i + 1] && (
              <ConnectorLine direction={direction} roundIndex={roundIndex} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectorLine({ direction, roundIndex }: { direction: 'ltr' | 'rtl'; roundIndex: number }) {
  const side = direction === 'ltr' ? 'right' : 'left';
  const borderSide = direction === 'ltr' ? 'border-r-2' : 'border-l-2';

  return (
    <div
      className={`absolute ${borderSide} border-border-subtle`}
      style={{
        [side]: '-8px',
        top: '50%',
        height: roundIndex === 0 ? '60px' : '120px',
        width: '8px',
      }}
    />
  );
}
