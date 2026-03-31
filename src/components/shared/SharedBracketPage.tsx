import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { loadBracket } from '../../utils/bracketStorage';
import { useBracketStore } from '../../stores/bracketStore';
import { BracketLayout } from '../bracket/BracketLayout';

type LoadState = 'loading' | 'loaded' | 'error';

export function SharedBracketPage() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const setBracket = useBracketStore((s) => s.setBracket);
  const setReadOnly = useBracketStore((s) => s.setReadOnly);
  const bracket = useBracketStore((s) => s.bracket);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const bracketId = pathParts[pathParts.length - 1];

    if (!bracketId) {
      setLoadState('error');
      return;
    }

    loadBracket(bracketId).then((data) => {
      if (data) {
        setBracket(data);
        setReadOnly(true);
        setLoadState('loaded');
      } else {
        setLoadState('error');
      }
    }).catch(() => {
      setLoadState('error');
    });

    return () => {
      setReadOnly(false);
    };
  }, [setBracket, setReadOnly]);

  const handleCreateOwn = () => {
    window.location.href = '/';
  };

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-secondary font-body text-lg">Loading bracket...</div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-6">
        <h2 className="text-2xl font-heading font-bold text-text-primary">Bracket not found</h2>
        <p className="text-text-secondary font-body">This bracket link may be invalid or expired.</p>
        <button
          onClick={handleCreateOwn}
          className="bg-spotify-green hover:bg-spotify-green-bright text-black font-bold px-8 py-3 rounded-full font-body cursor-pointer"
        >
          Create Your Own Bracket
        </button>
      </div>
    );
  }

  const champion = bracket?.champion;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h1 className="text-lg font-heading font-bold text-spotify-green">
          Music Madness
        </h1>
        <button
          onClick={handleCreateOwn}
          className="bg-spotify-green hover:bg-spotify-green-bright text-black font-bold px-4 py-2 rounded-full text-sm font-body cursor-pointer"
        >
          Create Your Own
        </button>
      </header>

      {/* Champion Banner */}
      {champion && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 py-4 bg-bg-secondary border-b border-border-subtle"
        >
          {champion.images[0] && (
            <img
              src={champion.images[0].url}
              alt={champion.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-spotify-green"
            />
          )}
          <div className="text-center">
            <div className="text-xs text-text-secondary font-body">{'\u{1F3C6}'} Champion</div>
            <div className="text-xl font-heading font-bold">{champion.name}</div>
          </div>
        </motion.div>
      )}

      {/* Bracket */}
      <div className="flex-1">
        <BracketLayout />
      </div>

      {/* Footer CTA */}
      <div className="sticky bottom-0 bg-bg-secondary/95 backdrop-blur-sm border-t border-border-subtle px-4 py-3 text-center">
        <button
          onClick={handleCreateOwn}
          className="text-spotify-green font-body font-semibold text-sm hover:underline cursor-pointer"
        >
          Create your own Music Madness bracket {'\u{2192}'}
        </button>
      </div>
    </div>
  );
}
