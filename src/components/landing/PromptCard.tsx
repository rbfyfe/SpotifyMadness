import { useState } from 'react';

/**
 * Kept byte-identical to the copy in the RippedPages working paper at
 * work/music-madness/index.html (repo: rbfyfe/rippedpages). Change both together.
 */
export const CLAUDE_PROMPT = `Clone and set up Music Madness, a March Madness-style bracket tournament
for my Spotify top artists.

Repo: https://github.com/rbfyfe/SpotifyMadness

Please:
1. Clone it and install dependencies
2. Walk me through creating a Spotify Developer App — I need a Client ID,
   and http://localhost:5173/callback added as a redirect URI
3. Create my .env from .env.example with that Client ID
4. Start the dev server and tell me what to click

Notes:
- Auth is Spotify PKCE — no backend needed
- Supabase is optional; skip it unless I ask (sharing just turns off)
- My app will be in Developer Mode, so add my own Spotify account under
  "Users" in the dashboard before I try to log in`;

export function PromptCard() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(CLAUDE_PROMPT);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary">
      <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-text-secondary">
          Paste into Claude Code
        </span>
        <button
          type="button"
          onClick={copy}
          className="cursor-pointer rounded-full bg-spotify-green px-5 py-2 font-body text-sm font-bold text-black transition-colors duration-200 hover:bg-spotify-green-bright"
        >
          {copied ? 'Copied' : 'Copy the prompt'}
        </button>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-text-secondary">
        {CLAUDE_PROMPT}
      </pre>
    </div>
  );
}
