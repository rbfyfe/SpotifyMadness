# Music Madness

A March Madness-style single-elimination bracket tournament powered by the Spotify API. The app pulls your top 32 artists, seeds them by popularity, and lets you pit them head-to-head by listening to song previews until a champion is crowned. Share your completed bracket as a card image or send a link for others to view.

## Stack

- **Frontend**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Animations**: Framer Motion + CSS keyframes
- **Audio**: HTML5 Audio with volume fading
- **Database**: Supabase (PostgreSQL) for shared brackets + analytics
- **Image Export**: html2canvas for share card generation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Spotify account
- A Spotify Developer App with Client ID (already configured)
- A Supabase project (optional — required for sharing features)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Spotify Developer Dashboard

The app uses PKCE auth (no backend needed). Ensure your Spotify app has these redirect URIs configured:

- **Dev**: `http://localhost:5173/callback`
- **Prod**: `https://<your-vercel-domain>/callback`

### Supabase Setup

Create a Supabase project and run the following SQL to set up the sharing tables:

```sql
-- Shared brackets table
CREATE TABLE shared_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  bracket_size SMALLINT NOT NULL,
  champion_spotify_id TEXT NOT NULL,
  champion_name TEXT NOT NULL,
  champion_image_url TEXT,
  bracket_data JSONB NOT NULL,
  spotify_user_id TEXT NOT NULL,
  spotify_display_name TEXT
);

-- Matchup results table (denormalized for analytics)
CREATE TABLE matchup_results (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bracket_id UUID REFERENCES shared_brackets(id) ON DELETE CASCADE,
  round_name TEXT NOT NULL,
  round_index SMALLINT NOT NULL,
  winner_spotify_id TEXT NOT NULL,
  winner_name TEXT NOT NULL,
  winner_seed SMALLINT NOT NULL,
  loser_spotify_id TEXT NOT NULL,
  loser_name TEXT NOT NULL,
  loser_seed SMALLINT NOT NULL,
  region_index SMALLINT
);

-- Enable Row Level Security
ALTER TABLE shared_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchup_results ENABLE ROW LEVEL SECURITY;

-- Public read + write (anon key)
CREATE POLICY "Anyone can view shared brackets"
  ON shared_brackets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shared brackets"
  ON shared_brackets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view matchup results"
  ON matchup_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert matchup results"
  ON matchup_results FOR INSERT WITH CHECK (true);

-- Performance indexes
CREATE INDEX idx_shared_brackets_champion ON shared_brackets (champion_spotify_id);
CREATE INDEX idx_shared_brackets_user ON shared_brackets (spotify_user_id);
CREATE INDEX idx_matchup_results_bracket ON matchup_results (bracket_id);
CREATE INDEX idx_matchup_results_winner ON matchup_results (winner_spotify_id);
```

Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app works without Supabase — sharing features simply won't be available.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type check + production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Architecture

### Project Structure

```
src/
├── components/
│   ├── LoginPage.tsx          # Spotify OAuth login
│   ├── CallbackPage.tsx       # OAuth callback handler
│   ├── BracketPage.tsx        # Main bracket view
│   ├── ErrorBoundary.tsx      # App-wide error boundary
│   ├── bracket/
│   │   ├── BracketLayout.tsx  # Horizontal scrolling bracket tree
│   │   ├── Region.tsx         # Single region (4 themed regions)
│   │   ├── RoundColumn.tsx    # Vertical column of matchups
│   │   └── MatchupCard.tsx    # Individual matchup card
│   ├── matchup/
│   │   ├── MatchupModal.tsx   # Split-screen matchup detail
│   │   ├── ArtistPanel.tsx    # Artist info + tracks + choose button
│   │   └── TrackList.tsx      # Top 3 tracks with preview playback
│   ├── audio/
│   │   ├── MiniPlayer.tsx     # Fixed bottom audio player bar
│   │   └── WaveformBars.tsx   # Animated audio visualization
│   ├── celebration/
│   │   ├── WinnerScreen.tsx   # Champion celebration overlay
│   │   ├── ConfettiOverlay.tsx # canvas-confetti bursts
│   │   └── AlbumSpin.tsx      # 3D album cover spin animation
│   ├── share/
│   │   ├── ShareCard.tsx      # 1200x630 static card for image export
│   │   └── ShareCardModal.tsx # Save to Supabase + capture + share UI
│   └── shared/
│       └── SharedBracketPage.tsx # Read-only bracket viewer (/shared/:id)
├── stores/
│   ├── authStore.ts           # Spotify auth token + user + demo mode
│   ├── bracketStore.ts        # Bracket state + winner logic + read-only
│   └── audioStore.ts          # Global audio playback
├── hooks/
│   ├── useSpotifyAuth.ts      # PKCE login/callback flow
│   └── useSpotifyApi.ts       # Authenticated API calls + demo stubs
├── lib/
│   └── supabase.ts            # Supabase client (nullable if unconfigured)
├── utils/
│   ├── pkce.ts                # PKCE crypto (SHA-256, base64url)
│   ├── seeding.ts             # Serpentine draft seeding algorithm
│   ├── bracketEngine.ts       # Bracket construction + matchup wiring
│   └── bracketStorage.ts      # Save/load brackets from Supabase
├── data/
│   ├── demoArtists.ts         # 32 static artists for demo mode
│   └── demoTracks.ts          # Static tracks for demo mode
├── types/
│   ├── spotify.ts             # Spotify API response types
│   └── bracket.ts             # Bracket domain types
└── test/
    ├── setup.ts               # Vitest setup
    ├── seeding.test.ts        # Seeding algorithm tests
    ├── bracketEngine.test.ts  # Bracket construction tests
    ├── bracketStore.test.ts   # Store + winner propagation tests
    └── pkce.test.ts           # PKCE crypto tests
```

### Key Design Decisions

**Seeding**: Uses a serpentine draft to distribute artists evenly across regions. The most popular artist goes to Region 0, second to Region 1, etc., then reverses for the next seed level. Enforces popularity balance within 15% across regions.

**Bracket Wiring**: Matchups reference their "child" matchups via `childMatchupIds`. When a winner is selected, they propagate into the parent matchup. Changing a previous winner recursively invalidates all downstream matchups containing the old winner.

**Audio**: A singleton `HTMLAudioElement` ensures only one track plays at a time. Volume fades over 200ms on play/pause for smooth transitions.

**Auth**: Spotify PKCE flow with no backend. Tokens stored in sessionStorage. 401 responses trigger automatic re-auth.

**Sharing**: Completed brackets are saved to Supabase with a UUID. The share card (1200x630 PNG) is captured via html2canvas using inline styles for rendering reliability. Recipients view brackets at `/shared/:id` in read-only mode without needing a Spotify account.

**Analytics Schema**: The `matchup_results` table denormalizes each matchup decision so aggregate queries (top champions, biggest upsets, win rates) run efficiently without parsing JSONB.

## Bracket Sizes

| Size | Regions | Rounds | When Used |
|------|---------|--------|-----------|
| 32 | 4 (Amplifier, Crescendo, Encore, Anthem) | 5 | Default |
| 16 | 2 (Amplifier, Crescendo) | 4 | < 32 artists available |
| 8 | 1 (Amplifier) | 3 | < 16 artists available |

## Sharing & Analytics

### Sharing a Bracket

After crowning a champion, click "Share Results" to:
1. Save the bracket to Supabase
2. Generate a 1200x630 share card image
3. Download the image, use native OS share, or copy the share link

### Viewing a Shared Bracket

Visit any `/shared/:id` URL to see the complete bracket read-only. No Spotify login required — all data comes from Supabase.

### Analytics Queries

The denormalized `matchup_results` table enables queries like:

```sql
-- Most popular champions
SELECT champion_name, COUNT(*) as wins
FROM shared_brackets GROUP BY 1 ORDER BY wins DESC;

-- Biggest upsets (low seed beats high seed)
SELECT winner_name, winner_seed, loser_name, loser_seed,
       round_name, (winner_seed - loser_seed) as upset_magnitude
FROM matchup_results WHERE winner_seed > loser_seed
ORDER BY upset_magnitude DESC;

-- Artist win rates
SELECT winner_name, COUNT(*) as total_wins,
  COUNT(*) FILTER (WHERE round_name = 'Championship') as championships
FROM matchup_results GROUP BY 1 ORDER BY total_wins DESC;
```

## Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel
```

### Environment Variables (Vercel)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SPOTIFY_CLIENT_ID` | Spotify Developer App client ID | Yes |
| `VITE_REDIRECT_URI` | `https://<your-domain>/callback` | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | For sharing |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key | For sharing |

## Testing

Tests cover the critical business logic:
- **Seeding**: Serpentine draft correctness, balanced regions, proper seed assignment
- **Bracket Engine**: Round structure, matchup wiring, child references
- **Bracket Store**: Winner selection, propagation, undo/invalidation, champion detection, read-only mode
- **PKCE**: String generation entropy, code challenge determinism

```bash
npm test            # Run once
npm run test:watch  # Watch mode
```
