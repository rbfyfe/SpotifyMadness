# Music Madness

A March Madness-style single-elimination bracket tournament powered by the Spotify API. The app pulls your top 32 artists, seeds them by popularity, and lets you pit them head-to-head by listening to song previews until a champion is crowned.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Animations**: Framer Motion + CSS keyframes
- **Audio**: HTML5 Audio with volume fading
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Spotify account
- A Spotify Developer App with Client ID (already configured)

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
│   └── celebration/
│       ├── WinnerScreen.tsx   # Champion celebration overlay
│       ├── ConfettiOverlay.tsx # canvas-confetti bursts
│       └── AlbumSpin.tsx      # 3D album cover spin animation
├── stores/
│   ├── authStore.ts           # Spotify auth token + user
│   ├── bracketStore.ts        # Bracket state + winner logic
│   └── audioStore.ts          # Global audio playback
├── hooks/
│   ├── useSpotifyAuth.ts      # PKCE login/callback flow
│   └── useSpotifyApi.ts       # Authenticated API calls
├── utils/
│   ├── pkce.ts                # PKCE crypto (SHA-256, base64url)
│   ├── seeding.ts             # Serpentine draft seeding algorithm
│   └── bracketEngine.ts       # Bracket construction + matchup wiring
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

**Seeding**: Uses a serpentine draft to distribute artists evenly across regions. The most popular artist goes to Region 0, second to Region 1, etc., then reverses for the next seed level.

**Bracket Wiring**: Matchups reference their "child" matchups via `childMatchupIds`. When a winner is selected, they propagate into the parent matchup. Changing a previous winner recursively invalidates all downstream matchups containing the old winner.

**Audio**: A singleton `HTMLAudioElement` ensures only one track plays at a time. Volume fades over 200ms on play/pause for smooth transitions.

**Auth**: Spotify PKCE flow with no backend. Tokens stored in sessionStorage. 401 responses trigger automatic re-auth.

## Bracket Sizes

| Size | Regions | Rounds | When Used |
|------|---------|--------|-----------|
| 32 | 4 (Amplifier, Crescendo, Encore, Anthem) | 5 | Default |
| 16 | 2 (Amplifier, Crescendo) | 4 | < 32 artists available |
| 8 | 1 (Amplifier) | 3 | < 16 artists available |

## Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel
```

Set these environment variables in Vercel:
- `VITE_SPOTIFY_CLIENT_ID` — Your Spotify app client ID
- `VITE_REDIRECT_URI` — `https://<your-domain>/callback`

## Testing

Tests cover the critical business logic:
- **Seeding**: Serpentine draft correctness, balanced regions, proper seed assignment
- **Bracket Engine**: Round structure, matchup wiring, child references
- **Bracket Store**: Winner selection, propagation, undo/invalidation, champion detection
- **PKCE**: String generation entropy, code challenge determinism

```bash
npm test        # Run once
npm run test:watch  # Watch mode
```
