import { useBracketStore } from '../../stores/bracketStore';
import { Region } from './Region';

export function BracketLayout() {
  const bracket = useBracketStore((s) => s.bracket);
  if (!bracket) return null;

  const { regions, rounds, size } = bracket;
  const regionCount = regions.length;

  // Determine how many rounds are "regional" (within each region)
  // 32-bracket: 3 regional rounds (R32, S16, E8) + Final Four + Championship
  // 16-bracket: 3 regional rounds + Championship
  // 8-bracket: all rounds in single region
  const regionalRoundCount = size === 8 ? rounds.length : 3;

  // Split regions into left and right halves
  const leftRegionIndices = regionCount <= 2
    ? Array.from({ length: regionCount }, (_, i) => i)
    : [0, 1];
  const rightRegionIndices = regionCount > 2 ? [2, 3] : [];

  // Cross-region rounds (Final Four, Championship)
  const crossRegionRounds = rounds.slice(regionalRoundCount);

  return (
    <div className="overflow-x-auto overflow-y-auto p-4 md:p-8">
      {/* Round Labels */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex gap-0">
          {rounds.map((round) => (
            <div
              key={round.index}
              className="text-center text-xs md:text-sm font-heading font-semibold text-text-secondary uppercase tracking-wider"
              style={{ width: '180px', flexShrink: 0 }}
            >
              {round.name}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-stretch justify-center" style={{ minWidth: rounds.length * 180 }}>
        {/* Left Regions */}
        <div className="flex flex-col">
          {leftRegionIndices.map((regionIndex) => (
            <Region
              key={regionIndex}
              regionIndex={regionIndex}
              regionName={regions[regionIndex]!}
              rounds={rounds.slice(0, regionalRoundCount)}
              direction="ltr"
            />
          ))}
        </div>

        {/* Cross-Region Rounds (Final Four + Championship) */}
        {crossRegionRounds.length > 0 && (
          <div className="flex items-center">
            {crossRegionRounds.map((round) => (
              <div
                key={round.index}
                className="flex flex-col justify-center gap-8"
                style={{ width: '180px' }}
              >
                {round.matchups.map((matchup) => (
                  <MatchupCardImport key={matchup.id} matchup={matchup} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Right Regions (mirrored) */}
        {rightRegionIndices.length > 0 && (
          <div className="flex flex-col">
            {rightRegionIndices.map((regionIndex) => (
              <Region
                key={regionIndex}
                regionIndex={regionIndex}
                regionName={regions[regionIndex]!}
                rounds={rounds.slice(0, regionalRoundCount)}
                direction="rtl"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Import at bottom to avoid circular dependency issues
import { MatchupCard as MatchupCardImport } from './MatchupCard';
