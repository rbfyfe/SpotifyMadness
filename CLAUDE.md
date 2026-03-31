# CLAUDE.md

Project-specific instructions for Claude Code when working in this repository.

## Project Overview

**Music Madness** is a March Madness-style single-elimination bracket tournament for Spotify. Users authenticate via Spotify OAuth PKCE, their top artists are seeded into a bracket, and they pick winners round-by-round until a champion is crowned. Completed brackets can be shared as PNG images with a unique URL.

## Tech Stack

- **React 19** + **TypeScript** + **Vite 6** (SPA, no SSR)
- **Tailwind CSS v4** (CSS-first config via `@import "tailwindcss"`)
- **Zustand** for state management (3 stores: auth, bracket, audio)
- **Framer Motion** for animations
- **Supabase** (PostgreSQL) for shared bracket storage + analytics
- **html2canvas** for share card image generation
- **Vercel** for deployment with SPA rewrites

## Architecture

### Routing

Custom pathname-based routing in `App.tsx` — no React Router. Routes are:
- `/` — Login page (Spotify OAuth or Demo mode)
- `/callback` — OAuth callback handler
- `/bracket` — Main bracket view (requires auth)
- `/shared/:id` — Read-only shared bracket viewer (no auth required)

Route changes use `window.history.pushState` + `popstate` events.

### State Management

Three Zustand stores in `src/stores/`:
- **authStore** — Token, user profile, demo mode flag. Persisted via `sessionStorage`.
- **bracketStore** — Bracket data, matchup selection, winner propagation, read-only mode. Has `selectWinner` which handles downstream invalidation when changing a previous pick.
- **audioStore** — Singleton HTMLAudioElement, volume fading, track state.

### Bracket Engine

- `src/utils/seeding.ts` — Serpentine draft distributes artists across 4 regions
- `src/utils/bracketEngine.ts` — Builds tournament structure with `childMatchupIds` for parent-child matchup wiring
- Standard tournament seeding: 1v8, 4v5, 3v6, 2v7 in each region
- Winner propagation: selecting a winner places them in the parent matchup; changing a winner recursively invalidates downstream matchups

### Sharing Flow

1. User completes bracket → WinnerScreen shows
2. "Share Results" → `ShareCardModal` opens
3. Modal calls `saveBracket()` → inserts into `shared_brackets` + `matchup_results` tables in Supabase
4. `html2canvas` captures the `ShareCard` component as a 1200x630 PNG
5. User can download image, use native share API, or copy the `/shared/:id` link
6. Recipients visit `/shared/:id` → `SharedBracketPage` loads bracket from Supabase in read-only mode

### Supabase Schema

**`shared_brackets`** — One row per completed bracket:
- `id` (uuid PK), `bracket_size`, `champion_spotify_id`, `champion_name`, `champion_image_url`
- `bracket_data` (jsonb — full bracket state), `spotify_user_id`, `spotify_display_name`
- `created_at`

**`matchup_results`** — One row per decided matchup (denormalized for analytics):
- `bracket_id` (FK), `round_name`, `round_index`
- `winner_spotify_id`, `winner_name`, `winner_seed`
- `loser_spotify_id`, `loser_name`, `loser_seed`
- `region_index`

RLS: Public SELECT + INSERT via anon key.

### Demo Mode

`useAuthStore.setDemo()` sets a fake token + user. `useSpotifyApi` checks `isDemo` and returns static data from `src/data/demoArtists.ts` and `src/data/demoTracks.ts` instead of calling the Spotify API. Demo data has 32 pre-built artists with placeholder images.

## Development Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Type check + production build
npm test             # Run Vitest once
npm run test:watch   # Vitest in watch mode
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SPOTIFY_CLIENT_ID` | Spotify Developer App client ID | Yes |
| `VITE_REDIRECT_URI` | OAuth callback URL | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | For sharing |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | For sharing |

The Supabase client (`src/lib/supabase.ts`) gracefully returns `null` if env vars are missing — sharing features degrade but the app still works.

## Testing

Tests live in `src/test/` using Vitest + jsdom. They cover core business logic:
- **bracketEngine.test.ts** — Bracket structure, round counts, matchup wiring, seeding
- **bracketStore.test.ts** — Winner selection, propagation, downstream invalidation, champion detection, read-only mode
- **seeding.test.ts** — Serpentine draft, region balance, popularity distribution
- **pkce.test.ts** — Crypto string generation, code challenge determinism

## Code Conventions

- Components use named exports, not default exports
- Tailwind classes for styling; inline styles only in `ShareCard.tsx` (for html2canvas reliability)
- Type imports use `import type { ... }` syntax
- Spotify API types in `src/types/spotify.ts`, bracket domain types in `src/types/bracket.ts`
- No React Router — custom pathname routing in `App.tsx`
- The `ShareCard` component uses `forwardRef` so html2canvas can capture its DOM node

## Common Pitfalls

- **Demo mode API calls**: Any new Spotify API method in `useSpotifyApi.ts` must check `isDemo` and return mock data. Otherwise the fake token triggers a 401 → logout.
- **html2canvas**: The `ShareCard` uses inline styles, not Tailwind. Tailwind classes don't render reliably in html2canvas captures.
- **Bracket invalidation**: When changing a winner in an earlier round, `invalidateDownstream` removes the old winner from all subsequent rounds. Always get fresh state via `store.getState()` after mutations.
- **SPA routing**: Vercel's `vercel.json` rewrites all paths to `index.html`. The `/shared/:id` route must be handled before the auth check in `App.tsx`.
