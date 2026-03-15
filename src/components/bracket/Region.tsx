import type { Round, RegionName } from '../../types/bracket';
import { RoundColumn } from './RoundColumn';

interface RegionProps {
  regionIndex: number;
  regionName: RegionName;
  rounds: Round[];
  direction: 'ltr' | 'rtl';
}

export function Region({ regionIndex, regionName, rounds, direction }: RegionProps) {
  // Filter matchups to only this region's matchups
  const regionRounds = rounds.map((round) => ({
    ...round,
    matchups: round.matchups.filter((m) => m.regionIndex === regionIndex),
  }));

  const orderedRounds = direction === 'rtl' ? [...regionRounds].reverse() : regionRounds;

  return (
    <div className="mb-4">
      {/* Region Label */}
      <div className={`text-sm font-heading font-bold text-spotify-green mb-3 px-2 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
        {regionName}
      </div>

      <div className={`flex items-start gap-6 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
        {orderedRounds.map((round, i) => (
          <RoundColumn
            key={round.index}
            matchups={round.matchups}
            roundIndex={i}
            direction={direction}
          />
        ))}
      </div>
    </div>
  );
}
