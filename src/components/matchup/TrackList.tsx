import { useAuthStore } from '../../stores/authStore';
import { useAudioStore } from '../../stores/audioStore';
import { WaveformBars } from '../audio/WaveformBars';
import type { SpotifyTrack } from '../../types/spotify';

interface TrackListProps {
  tracks: SpotifyTrack[];
}

export function TrackList({ tracks }: TrackListProps) {
  const isDemo = useAuthStore((s) => s.isDemo);
  const { currentTrack, isPlaying, play, pause, resume } = useAudioStore();

  const handlePlay = (track: SpotifyTrack) => {
    if (isDemo) return;
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      play(track);
    }
  };

  return (
    <div className="space-y-1.5">
      {tracks.map((track) => {
        const isCurrentTrack = !isDemo && currentTrack?.id === track.id;
        const isThisPlaying = isCurrentTrack && isPlaying;
        const albumImage = track.album.images[track.album.images.length - 1];

        return (
          <div
            key={track.id}
            className={`
              flex items-center gap-2 p-2 rounded-lg transition-colors
              ${isDemo ? 'opacity-70' : 'cursor-pointer'}
              ${isCurrentTrack ? 'bg-spotify-green/10' : 'bg-bg-card hover:bg-bg-card/80'}
            `}
            onClick={() => handlePlay(track)}
          >
            {/* Album Art + Play Icon */}
            <div className="relative w-8 h-8 flex-shrink-0 rounded overflow-hidden group">
              {albumImage && (
                <img src={albumImage.url} alt="" className="w-full h-full object-cover" />
              )}
              {!isDemo && (
                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isThisPlaying ? (
                    <WaveformBars size="small" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
                      <polygon points="3,1 12,7 3,13" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs truncate font-body ${isCurrentTrack ? 'text-spotify-green' : 'text-text-primary'}`}>
                {track.name}
              </p>
              <p className="text-[10px] text-text-secondary truncate font-body">
                {track.album.name}
              </p>
            </div>

            {/* Playing indicator */}
            {isThisPlaying && (
              <WaveformBars size="small" />
            )}
          </div>
        );
      })}
      {isDemo && (
        <p className="text-[10px] text-text-secondary/60 text-center pt-1 font-body">
          Audio previews available with Spotify
        </p>
      )}
    </div>
  );
}
