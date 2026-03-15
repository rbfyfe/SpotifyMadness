interface WaveformBarsProps {
  size?: 'small' | 'medium';
}

export function WaveformBars({ size = 'medium' }: WaveformBarsProps) {
  const barHeight = size === 'small' ? 'h-3' : 'h-5';
  const barWidth = size === 'small' ? 'w-0.5' : 'w-1';
  const gap = size === 'small' ? 'gap-px' : 'gap-0.5';

  return (
    <div className={`flex items-end ${gap}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`${barWidth} ${barHeight} bg-spotify-green rounded-full waveform-bar`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
