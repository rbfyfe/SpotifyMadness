import { supabase } from '../lib/supabase';
import type { BracketData } from '../types/bracket';
import type { SpotifyUser } from '../types/spotify';

export async function saveBracket(bracket: BracketData, user: SpotifyUser): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured');

  const champion = bracket.champion;
  if (!champion) throw new Error('Cannot share a bracket without a champion');

  // Insert the bracket
  const { data, error } = await supabase
    .from('shared_brackets')
    .insert({
      bracket_size: bracket.size,
      champion_spotify_id: champion.id,
      champion_name: champion.name,
      champion_image_url: champion.images[0]?.url ?? null,
      bracket_data: bracket,
      spotify_user_id: user.id,
      spotify_display_name: user.display_name,
    })
    .select('id')
    .single();

  if (error) throw error;
  const bracketId = data.id as string;

  // Extract and insert matchup results for analytics
  const matchupResults = [];
  for (const round of bracket.rounds) {
    for (const matchup of round.matchups) {
      if (!matchup.winner) continue;

      const loser = matchup.artistA?.id === matchup.winner.id
        ? matchup.artistB
        : matchup.artistA;

      if (!loser) continue;

      matchupResults.push({
        bracket_id: bracketId,
        round_name: round.name,
        round_index: round.index,
        winner_spotify_id: matchup.winner.id,
        winner_name: matchup.winner.name,
        winner_seed: matchup.winner.seed,
        loser_spotify_id: loser.id,
        loser_name: loser.name,
        loser_seed: loser.seed,
        region_index: matchup.regionIndex,
      });
    }
  }

  if (matchupResults.length > 0 && supabase) {
    const { error: resultsError } = await supabase
      .from('matchup_results')
      .insert(matchupResults);

    if (resultsError) {
      console.error('Failed to insert matchup results:', resultsError);
      // Don't throw — the bracket was saved successfully
    }
  }

  return bracketId;
}

export async function loadBracket(id: string): Promise<BracketData | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('shared_brackets')
    .select('bracket_data')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return data.bracket_data as BracketData;
}
