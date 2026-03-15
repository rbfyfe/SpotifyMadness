import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBracketStore } from '../../stores/bracketStore';
import { useAudioStore } from '../../stores/audioStore';
import { ArtistPanel } from './ArtistPanel';
import type { SeededArtist } from '../../types/bracket';

export function MatchupModal() {
  const currentMatchupId = useBracketStore((s) => s.currentMatchupId);
  const getMatchupById = useBracketStore((s) => s.getMatchupById);
  const selectWinner = useBracketStore((s) => s.selectWinner);
  const closeMatchup = useBracketStore((s) => s.closeMatchup);
  const stopAudio = useAudioStore((s) => s.stop);

  const matchup = currentMatchupId ? getMatchupById(currentMatchupId) : undefined;

  const handleClose = useCallback(() => {
    stopAudio();
    closeMatchup();
  }, [stopAudio, closeMatchup]);

  const handleSelectWinner = useCallback(
    (winner: SeededArtist) => {
      if (!currentMatchupId) return;
      selectWinner(currentMatchupId, winner);
      stopAudio();
      closeMatchup();
    },
    [currentMatchupId, selectWinner, stopAudio, closeMatchup]
  );

  // Escape key to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  if (!matchup || !matchup.artistA || !matchup.artistB) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative bg-bg-primary border border-border-subtle rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-text-secondary hover:text-text-primary z-10 cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Split screen */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
            <ArtistPanel
              artist={matchup.artistA}
              onSelect={() => handleSelectWinner(matchup.artistA!)}
              isWinner={matchup.winner?.id === matchup.artistA.id}
            />
            <ArtistPanel
              artist={matchup.artistB}
              onSelect={() => handleSelectWinner(matchup.artistB!)}
              isWinner={matchup.winner?.id === matchup.artistB.id}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
