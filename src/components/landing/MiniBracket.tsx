import { useState } from 'react';
import type { BracketData, SeededArtist } from '../../types/bracket';
import { demoArtists } from '../../data/demoArtists';
import { seedArtists } from '../../utils/seeding';
import { buildBracket, applyWinner } from '../../utils/bracketEngine';
import { MiniMatchupCard } from './MiniMatchupCard';

/**
 * An 8-artist bracket — the app's real smallest size — built by the real engine
 * so the taste on the landing page is the genuine mechanic, not a mock.
 */
function initialBracket(): BracketData {
  return buildBracket(seedArtists(demoArtists.slice(0, 8), 8), 8);
}

interface MiniBracketProps {
  onPlayDemo: () => void;
}

export function MiniBracket({ onPlayDemo }: MiniBracketProps) {
  const [bracket, setBracket] = useState<BracketData>(initialBracket);

  const pick = (matchupId: string, winner: SeededArtist) => {
    setBracket((current) => applyWinner(current, matchupId, winner));
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {bracket.rounds.map((round) => (
          <div key={round.index} className="flex flex-col gap-3">
            <h3 className="font-heading text-xs font-bold uppercase tracking-[0.16em] text-text-secondary">
              {round.name}
            </h3>
            <div className="flex flex-col justify-around gap-3 sm:h-full">
              {round.matchups.map((matchup) => (
                <MiniMatchupCard
                  key={matchup.id}
                  matchup={matchup}
                  onPick={(winner) => pick(matchup.id, winner)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {bracket.champion && (
        <div
          data-testid="mini-champion"
          className="mt-8 rounded-xl border border-spotify-green/40 bg-spotify-green/10 p-6 text-center"
        >
          <p className="font-heading text-xs font-bold uppercase tracking-[0.16em] text-spotify-green">
            Champion
          </p>
          <p className="mt-2 font-heading text-3xl font-black text-text-primary">
            {bracket.champion.name}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
            That&rsquo;s the mechanic. The real thing seeds your actual Spotify top 32, with full
            track playback for Premium listeners.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onPlayDemo}
              className="cursor-pointer rounded-full bg-spotify-green px-7 py-3 font-body font-bold text-black transition-colors duration-200 hover:bg-spotify-green-bright"
            >
              Play the full demo
            </button>
            <button
              type="button"
              onClick={() => setBracket(initialBracket())}
              className="cursor-pointer rounded-full border border-text-secondary/40 px-6 py-3 font-body text-sm font-semibold text-text-secondary transition-colors duration-200 hover:border-text-primary hover:text-text-primary"
            >
              Play it again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
