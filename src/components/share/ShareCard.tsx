import { forwardRef } from 'react';
import type { SeededArtist } from '../../types/bracket';
import type { BracketSize } from '../../types/bracket';

interface ShareCardProps {
  champion: SeededArtist;
  bracketPath: { round: string; opponent: string }[];
  shareUrl: string;
  size: BracketSize;
}

/** Static card component (1200x630) captured by html2canvas as a PNG. Uses inline styles for reliable rendering. */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ champion, bracketPath, shareUrl, size }, ref) => {
    const championImage = champion.images[0]?.url;

    return (
      <div
        ref={ref}
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0D0D0D 0%, #1a1a1a 50%, #0D0D0D 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Montserrat', 'DM Sans', sans-serif",
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative green glow behind champion */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29, 185, 84, 0.15) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Header */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '2px',
            marginBottom: '24px',
            textTransform: 'uppercase',
            color: '#1DB954',
          }}
        >
          Music Madness
        </div>

        {/* Champion Image */}
        {championImage && (
          <img
            src={championImage}
            alt={champion.name}
            crossOrigin="anonymous"
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '4px solid #1DB954',
              marginBottom: '16px',
            }}
          />
        )}

        {/* Trophy + Champion Name */}
        <div
          style={{
            fontSize: '42px',
            fontWeight: 900,
            marginBottom: '8px',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {champion.name}
        </div>

        <div
          style={{
            fontSize: '16px',
            color: '#1DB954',
            fontWeight: 700,
            marginBottom: '20px',
          }}
        >
          {'\u{1F3C6}'} {size}-Artist Bracket Champion {'\u{1F3C6}'}
        </div>

        {/* Championship Run */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#B3B3B3',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '4px',
            }}
          >
            Championship Run
          </div>
          {bracketPath.map((step, i) => (
            <div
              key={i}
              style={{
                fontSize: '13px',
                color: '#B3B3B3',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {step.round}: beat {step.opponent}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#1DB954',
            }}
          >
            Create your own bracket
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {shareUrl.replace(/^https?:\/\//, '')}
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = 'ShareCard';
