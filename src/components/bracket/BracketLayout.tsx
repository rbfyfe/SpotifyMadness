import { useBracketStore } from '../../stores/bracketStore';
import { RoundColumn } from './RoundColumn';
import { MatchupCard } from './MatchupCard';
import type { Matchup, Round } from '../../types/bracket';

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

/** Filter matchups from rounds that belong to specific regionIndices */
function filterRoundsByRegions(rounds: Round[], regionIndices: number[]): Matchup[][] {
  return rounds.map((round) =>
    round.matchups
      .filter((m) => regionIndices.includes(m.regionIndex))
      .sort((a, b) => a.position - b.position)
  );
}

export function BracketLayout() {
  const bracket = useBracketStore((s) => s.bracket);
  if (!bracket) return null;

  const { regions, rounds, size } = bracket;
  const regionCount = regions.length;

  // How many rounds are "regional" (within individual regions)
  const regionalRoundCount = size === 8 ? rounds.length : 3;
  const regionalRounds = rounds.slice(0, regionalRoundCount);
  const crossRegionRounds = rounds.slice(regionalRoundCount);

  // For small brackets (8), just render a single bracket tree
  if (regionCount === 1) {
    const allMatchups = regionalRounds.map((r) => r.matchups);
    return (
      <div className="overflow-x-auto overflow-y-auto p-4 md:p-8">
        <div className="flex items-start justify-center gap-6">
          {allMatchups.map((matchups, i) => (
            <RoundColumn key={i} matchups={matchups} roundIndex={i} direction="ltr" />
          ))}
        </div>
      </div>
    );
  }

  // Split regions into left and right halves
  const leftRegionIndices = regionCount <= 2 ? [0, 1] : [0, 1];
  const rightRegionIndices = regionCount > 2 ? [2, 3] : [];

  // Get matchups per round for each half
  const leftRoundMatchups = filterRoundsByRegions(regionalRounds, leftRegionIndices);
  const rightRoundMatchups = filterRoundsByRegions(regionalRounds, rightRegionIndices);

  // For 16-bracket (2 regions, no right half, no cross-region)
  if (rightRegionIndices.length === 0) {
    return (
      <div className="overflow-x-auto overflow-y-auto p-4 md:p-8">
        <div className="flex items-start justify-center gap-6">
          {/* Region labels */}
          <div className="flex flex-col justify-start" style={{ width: '24px', flexShrink: 0 }}>
            <RegionLabel name={regions[0]!} top={0} />
            <RegionLabel name={regions[1]!} top={4 * (CARD_HEIGHT + BASE_GAP)} />
          </div>
          {/* Unified bracket columns */}
          {leftRoundMatchups.map((matchups, i) => (
            <RoundColumn key={i} matchups={matchups} roundIndex={i} direction="ltr" />
          ))}
          {/* Championship */}
          {crossRegionRounds.map((round, i) => {
            const roundIndex = regionalRoundCount + i;
            return (
              <CenterColumn
                key={round.index}
                matchups={round.matchups}
                roundIndex={roundIndex}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 32-bracket: Left half → Left FF → Championship → Right FF → Right half (mirrored)
  // Each half has 8 R0 matchups. The vertical center of each half is at topPadding(3) = 294px.
  // Split FF matchups: m0 goes with left half, m1 with right half.
  // Championship sits alone in the center. All three center columns at the same y = 294.
  const finalFourRound = crossRegionRounds[0];
  const championshipRound = crossRegionRounds[1];

  // The topPadding to vertically center a single matchup within the 8-matchup bracket half
  const centerTopPadding = getTopPadding(regionalRoundCount);

  return (
    <div className="overflow-x-auto overflow-y-auto p-4 md:p-8">
      <div className="flex items-start justify-center" style={{ minWidth: (regionalRoundCount * 2 + 3 + 2) * 204 }}>
        {/* Left region labels */}
        <div className="relative flex-shrink-0" style={{ width: '28px' }}>
          <RegionLabel name={regions[0]!} top={0} />
          <RegionLabel name={regions[1]!} top={4 * (CARD_HEIGHT + BASE_GAP)} />
        </div>

        {/* Left half: 3 round columns (LTR) */}
        <div className="flex items-start gap-6">
          {leftRoundMatchups.map((matchups, i) => (
            <RoundColumn key={`left-${i}`} matchups={matchups} roundIndex={i} direction="ltr" />
          ))}
        </div>

        {/* Left Final Four matchup (single matchup, centered) */}
        {finalFourRound && (
          <div className="mx-2" style={{ width: '180px', flexShrink: 0 }}>
            <div style={{ paddingTop: `${centerTopPadding}px` }}>
              <MatchupCard matchup={finalFourRound.matchups[0]!} />
            </div>
          </div>
        )}

        {/* Championship (single matchup, centered) */}
        {championshipRound && (
          <div className="mx-2" style={{ width: '180px', flexShrink: 0 }}>
            <div style={{ paddingTop: `${centerTopPadding}px` }}>
              <div className="text-center text-xs font-heading text-spotify-green mb-2">🏆 Championship</div>
              <MatchupCard matchup={championshipRound.matchups[0]!} />
            </div>
          </div>
        )}

        {/* Right Final Four matchup (single matchup, centered) */}
        {finalFourRound && finalFourRound.matchups[1] && (
          <div className="mx-2" style={{ width: '180px', flexShrink: 0 }}>
            <div style={{ paddingTop: `${centerTopPadding}px` }}>
              <MatchupCard matchup={finalFourRound.matchups[1]} />
            </div>
          </div>
        )}

        {/* Right half: 3 round columns (RTL — reversed order, mirrored connectors) */}
        <div className="flex items-start gap-6 flex-row-reverse">
          {rightRoundMatchups.map((matchups, i) => (
            <RoundColumn key={`right-${i}`} matchups={matchups} roundIndex={i} direction="rtl" />
          ))}
        </div>

        {/* Right region labels */}
        <div className="relative flex-shrink-0" style={{ width: '28px' }}>
          <RegionLabel name={regions[2]!} top={0} align="right" />
          <RegionLabel name={regions[3]!} top={4 * (CARD_HEIGHT + BASE_GAP)} align="right" />
        </div>
      </div>
    </div>
  );
}

/** A center-aligned column for cross-region rounds (Final Four, Championship) */
function CenterColumn({ matchups, roundIndex }: { matchups: Matchup[]; roundIndex: number }) {
  const gap = getGap(roundIndex);
  const topPadding = getTopPadding(roundIndex);

  return (
    <div style={{ width: '180px', flexShrink: 0 }}>
      <div
        className="flex flex-col"
        style={{ gap: `${gap}px`, paddingTop: `${topPadding}px` }}
      >
        {matchups.map((matchup) => (
          <MatchupCard key={matchup.id} matchup={matchup} />
        ))}
      </div>
    </div>
  );
}

/** Small region label positioned at a specific vertical offset */
function RegionLabel({ name, top, align = 'left' }: { name: string; top: number; align?: 'left' | 'right' }) {
  return (
    <div
      className={`absolute text-[10px] font-heading font-bold text-spotify-green whitespace-nowrap ${align === 'right' ? 'text-right right-0' : 'text-left left-0'}`}
      style={{
        top: `${top}px`,
        writingMode: 'vertical-lr',
        textOrientation: 'mixed',
      }}
    >
      {name}
    </div>
  );
}
