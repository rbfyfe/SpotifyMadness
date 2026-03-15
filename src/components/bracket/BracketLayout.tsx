import { useBracketStore } from '../../stores/bracketStore';
import { Region } from './Region';
import { MatchupCard } from './MatchupCard';

// Must match RoundColumn constants
const CARD_HEIGHT = 76;
const BASE_GAP = 8;

function getGap(roundIndex: number): number {
  return Math.pow(2, roundIndex) * (CARD_HEIGHT + BASE_GAP) - CARD_HEIGHT;
}

function getTopPadding(roundIndex: number): number {
  if (roundIndex === 0) return 0;
  return (Math.pow(2, roundIndex) - 1) * (CARD_HEIGHT + BASE_GAP) / 2;
}

export function BracketLayout() {
  const bracket = useBracketStore((s) => s.bracket);
  if (!bracket) return null;

  const { regions, rounds, size } = bracket;
  const regionCount = regions.length;

  // Determine how many rounds are "regional"
  const regionalRoundCount = size === 8 ? rounds.length : 3;

  // Split regions into left and right halves
  const leftRegionIndices = regionCount <= 2
    ? Array.from({ length: regionCount }, (_, i) => i)
    : [0, 1];
  const rightRegionIndices = regionCount > 2 ? [2, 3] : [];

  // Cross-region rounds (Final Four, Championship)
  const crossRegionRounds = rounds.slice(regionalRoundCount);

  // For cross-region rounds, the round index continues from regional rounds
  // Final Four is effectively round 3 (after 3 regional rounds), Championship is round 4
  const crossRegionBaseRoundIndex = regionalRoundCount;

  return (
    <div className="overflow-x-auto overflow-y-auto p-4 md:p-8">
      <div className="flex items-start justify-center" style={{ minWidth: rounds.length * 204 }}>
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
          <div className="flex items-start gap-6">
            {crossRegionRounds.map((round, i) => {
              const roundIndex = crossRegionBaseRoundIndex + i;
              const gap = getGap(roundIndex);
              const topPadding = getTopPadding(roundIndex);

              return (
                <div
                  key={round.index}
                  style={{
                    width: '180px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="flex flex-col"
                    style={{
                      gap: `${gap}px`,
                      paddingTop: `${topPadding}px`,
                    }}
                  >
                    {round.matchups.map((matchup) => (
                      <MatchupCard key={matchup.id} matchup={matchup} />
                    ))}
                  </div>
                </div>
              );
            })}
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
