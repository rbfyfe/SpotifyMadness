import type { Matchup } from '../../types/bracket';
import { MatchupCard } from './MatchupCard';

// Card height: two ArtistRow (h-10 + py-1.5 each ≈ 46px) + 1px divider ≈ 76px rendered
const CARD_HEIGHT = 76;
const BASE_GAP = 8;

// Gap formula: gap(N) = 2^N * (CARD_HEIGHT + BASE_GAP) - CARD_HEIGHT
// This ensures each round N+1 card is vertically centered between its two feeder cards in round N
function getGap(roundIndex: number): number {
  return Math.pow(2, roundIndex) * (CARD_HEIGHT + BASE_GAP) - CARD_HEIGHT;
}

interface RoundColumnProps {
  matchups: Matchup[];
  roundIndex: number;
  direction: 'ltr' | 'rtl';
}

export function RoundColumn({ matchups, roundIndex, direction }: RoundColumnProps) {
  const gap = getGap(roundIndex);

  // Top padding to vertically center this round relative to round 0
  // Round N needs (2^N - 1) * (CARD_HEIGHT + BASE_GAP) / 2 top offset
  const topPadding = roundIndex === 0 ? 0 : (Math.pow(2, roundIndex) - 1) * (CARD_HEIGHT + BASE_GAP) / 2;

  return (
    <div className="relative" style={{ width: '180px', flexShrink: 0 }}>
      <div
        className="flex flex-col"
        style={{ gap: `${gap}px`, paddingTop: `${topPadding}px` }}
      >
        {matchups.map((matchup, i) => (
          <div key={matchup.id} className="relative">
            <MatchupCard matchup={matchup} />
            {/* Bracket connector lines: connect each pair of matchups to the next round */}
            {i % 2 === 0 && matchups[i + 1] && (
              <ConnectorLine
                direction={direction}
                gap={gap}
                cardHeight={CARD_HEIGHT}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectorLine({
  direction,
  gap,
  cardHeight,
}: {
  direction: 'ltr' | 'rtl';
  gap: number;
  cardHeight: number;
}) {
  const isLtr = direction === 'ltr';
  // Vertical line spans from center of current card to center of next card
  const lineHeight = cardHeight + gap;
  // Horizontal tick width
  const tickWidth = 12;

  return (
    <>
      {/* Vertical line connecting the pair */}
      <div
        className="absolute border-border-subtle"
        style={{
          [isLtr ? 'right' : 'left']: `-${tickWidth}px`,
          top: `${cardHeight / 2}px`,
          height: `${lineHeight}px`,
          width: '0px',
          [isLtr ? 'borderRight' : 'borderLeft']: '2px solid',
        }}
      />
      {/* Top horizontal tick (from current card to vertical line) */}
      <div
        className="absolute border-border-subtle"
        style={{
          [isLtr ? 'right' : 'left']: `-${tickWidth}px`,
          top: `${cardHeight / 2}px`,
          height: '0px',
          width: `${tickWidth}px`,
          borderTop: '2px solid',
        }}
      />
      {/* Bottom horizontal tick (from next card to vertical line) */}
      <div
        className="absolute border-border-subtle"
        style={{
          [isLtr ? 'right' : 'left']: `-${tickWidth}px`,
          top: `${cardHeight / 2 + lineHeight}px`,
          height: '0px',
          width: `${tickWidth}px`,
          borderTop: '2px solid',
        }}
      />
      {/* Horizontal tick from midpoint outward to next round */}
      <div
        className="absolute border-border-subtle"
        style={{
          [isLtr ? 'right' : 'left']: `-${tickWidth * 2}px`,
          top: `${cardHeight / 2 + lineHeight / 2}px`,
          height: '0px',
          width: `${tickWidth}px`,
          borderTop: '2px solid',
        }}
      />
    </>
  );
}
