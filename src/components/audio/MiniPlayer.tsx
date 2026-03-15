import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '../../stores/audioStore';
import { WaveformBars } from './WaveformBars';

export function MiniPlayer() {
  const { currentTrack, isPlaying, progress, duration, pause, resume, stop } = useAudioStore();

  if (!currentTrack) return null;

  const albumImage = currentTrack.album.images[currentTrack.album.images.length - 1];
  const elapsed = duration * (progress / 100);
  const remaining = duration - elapsed;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 80 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-border-subtle"
      >
        {/* Progress bar */}
        <div className="h-1 bg-bg-card">
          <div
            className="h-full bg-spotify-green transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-2">
          {/* Album art */}
          {albumImage && (
            <img
              src={albumImage.url}
              alt=""
              className="w-10 h-10 rounded object-cover"
            />
          )}

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate font-body">{currentTrack.name}</p>
            <p className="text-xs text-text-secondary truncate font-body">
              {currentTrack.album.name}
            </p>
          </div>

          {/* Waveform (when playing) */}
          {isPlaying && <WaveformBars size="small" />}

          {/* Time */}
          <span className="text-xs text-text-secondary font-body tabular-nums">
            -{formatTime(remaining)}
          </span>

          {/* Play/Pause */}
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="w-8 h-8 flex items-center justify-center text-text-primary hover:text-spotify-green cursor-pointer"
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" rx="1" />
                <rect x="9" y="2" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <polygon points="3,1 14,8 3,15" />
              </svg>
            )}
          </button>

          {/* Close */}
          <button
            onClick={stop}
            className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
