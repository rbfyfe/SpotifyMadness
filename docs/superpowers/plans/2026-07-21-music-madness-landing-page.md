# Music Madness Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Music Madness front door with a landing page that lets a visitor play the bracket mechanic immediately and leave with a prompt that builds them their own copy, and file a matching working paper on RippedPages.

**Architecture:** Two independent deliverables in two repositories. Phase A adds a `LandingPage` at `/` in the React app, moving the untouched `LoginPage` to `/login`; a playable 8-artist mini-bracket reuses the real bracket engine via a pure `applyWinner()` extracted out of the Zustand store. Phase B adds a static working paper at `work/music-madness/index.html` on RippedPages, following the house form set by the merged ClaudeCleaner paper and the in-flight Calendez paper.

**Tech Stack:** React 19, TypeScript (strict), Vite 6, Tailwind CSS v4, Zustand, Vitest + @testing-library/react + jsdom. Phase B is hand-written static HTML with inline CSS, no build step, no dependencies.

**Spec:** `docs/superpowers/specs/2026-07-20-music-madness-landing-page-design.md`

**Sequencing:** Phase A is unblocked and can start immediately. **Phase B is blocked** on
RippedPages PR #1 merging — see Task 5 Step 1. Do Phase A first.

## Global Constraints

- **TypeScript is strict** with `noUnusedLocals`, `noUnusedParameters`, and `noUncheckedIndexedAccess`. Array and record indexing yields `T | undefined`, so index access needs `!` or a guard. This is why existing code reads `bracket.rounds[0]!.matchups[0]!`. Match it.
- **Components use named exports**, never default exports.
- **Type-only imports use `import type { … }`.**
- **Tailwind classes for styling** in the React app. Inline styles only in `ShareCard.tsx` (out of scope here).
- **Existing app behavior must not change.** `src/test/bracketStore.test.ts` is the regression guard for Task 1 and must pass unmodified.
- **`LoginPage.tsx`'s markup and copy stay exactly as they are.** Task 4 edits only its imports and the body of its demo click handler, which move to a shared `startDemo()` helper. Every rendered string, class, and element stays byte-identical. The spec's non-goal is about its copy, not about never opening the file.
- **`/shared/:id` must keep being matched before the auth check** in `App.tsx`.
- **`CLAUDE.md` on RippedPages `main` is the authority for Phase B**, above this plan and above any coordination message. Read it first; if it has changed since 2026-07-21, it wins. Its rules as of that date are reflected below.
- **RippedPages work happens only in** `/Users/russellfyfe/rippedpages/.claude/worktrees/music-madness` on branch `music-madness-page`. Never in `~/rippedpages`, which stays clean on `main`.
- **Never merge a PR, never push to `main`, never run `vercel`.** Merging auto-deploys the public site. Open the PR, report the URL, stop.
- **`data/projects.json` is generated.** Edit `inventory.full.json`, then run `node scripts/build-public.mjs`. Never hand-edit it. It conflicts in every stacked PR — resolve by re-running the script, never by hand.
- **The RippedPages register (`index.html`) is not edited.** The `page`-field change it needs belongs to PR #1 / PR #4, not to this branch.
- **Standard page CTAs**, exactly as `CLAUDE.md` specifies: live deployment → `SEE IT LIVE` → the URL with `target="_blank"`; public repo → `READ THE SOURCE` → the GitHub URL with `target="_blank"`. Music Madness has both.
- **Never mention Rainplan in any RippedPages file.** A prior commit had to scrub a leak; do not reintroduce one.
- **Local preview is** `python3 -m http.server 3907` from the worktree root.

### THE PROMPT (verbatim, shared by both phases)

This exact text appears in `src/components/landing/PromptCard.tsx` (Phase A) and
`work/music-madness/index.html` (Phase B). The two copies must be byte-identical. Copy it;
do not retype or reflow it.

```
Clone and set up Music Madness, a March Madness-style bracket tournament
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
  "Users" in the dashboard before I try to log in
```

---

## File Structure

**Phase A — `/Users/russellfyfe/SpotifyMadness/.claude/worktrees/spotify-landing-page-a08967`**

| File | Responsibility |
|---|---|
| `src/utils/bracketEngine.ts` (modify) | Gains `applyWinner`, `findMatchup`, `invalidateDownstream` — all pure |
| `src/stores/bracketStore.ts` (modify) | `selectWinner` shrinks to a guard plus delegation |
| `src/components/landing/MiniMatchupCard.tsx` (create) | Renders one head-to-head tile; emits a pick |
| `src/components/landing/MiniBracket.tsx` (create) | Owns local bracket state; renders three rounds and the champion |
| `src/components/landing/PromptCard.tsx` (create) | Holds `CLAUDE_PROMPT`; renders it with a copy button |
| `src/components/landing/LandingPage.tsx` (create) | Page shell; all prose sections |
| `src/utils/startDemo.ts` (create) | Enter demo mode and navigate to the bracket; shared by both pages |
| `src/components/LoginPage.tsx` (modify) | Handler body only — delegates to `startDemo()`. Markup and copy untouched |
| `src/App.tsx` (modify) | `/` → LandingPage, `/login` → LoginPage |
| `src/test/bracketEngine.applyWinner.test.ts` (create) | Unit tests for the extracted function |
| `src/test/MiniBracket.test.tsx` (create) | Play-through and invalidation |
| `src/test/PromptCard.test.tsx` (create) | Clipboard behavior |
| `src/test/App.routing.test.tsx` (create) | Route resolution |

**Phase B — `/Users/russellfyfe/rippedpages/.claude/worktrees/music-madness`**

| File | Responsibility |
|---|---|
| `work/music-madness/index.html` (create) | The working paper, self-contained |
| `inventory.full.json` (modify) | Corrected blurb, `page` field |
| `data/projects.json` (regenerate) | Never hand-edited |

---

# Phase A — The Vite app

## Task 1: Extract `applyWinner` as a pure function

Pulls the winner-propagation logic out of the Zustand `set` callback so the mini-bracket can
reuse it without writing to the singleton store the real app depends on.

**Files:**
- Modify: `src/utils/bracketEngine.ts`
- Modify: `src/stores/bracketStore.ts:26-57` (move `findMatchup` and `invalidateDownstream` out), `src/stores/bracketStore.ts:75-121` (`selectWinner`)
- Test: `src/test/bracketEngine.applyWinner.test.ts`

**Interfaces:**
- Consumes: `BracketData`, `SeededArtist`, `Matchup` from `src/types/bracket.ts`; `buildBracket` and `seedArtists` already exist.
- Produces: `applyWinner(bracket: BracketData, matchupId: string, winner: SeededArtist): BracketData` — returns a new `BracketData`, never mutates the argument. Tasks 2 and 4 depend on this exact signature.

- [ ] **Step 1: Write the failing test**

Create `src/test/bracketEngine.applyWinner.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { seedArtists } from '../utils/seeding';
import { buildBracket, applyWinner } from '../utils/bracketEngine';
import type { SpotifyArtist } from '../types/spotify';
import type { BracketData } from '../types/bracket';

function makeArtists(count: number): SpotifyArtist[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `a${i + 1}`,
    name: `Artist ${i + 1}`,
    images: [{ url: `https://img/${i + 1}`, width: 320, height: 320 }],
    popularity: 100 - i,
    genres: ['pop'],
  }));
}

function freshBracket(): BracketData {
  return buildBracket(seedArtists(makeArtists(8), 8), 8);
}

describe('applyWinner', () => {
  it('sets the winner on the target matchup', () => {
    const bracket = freshBracket();
    const m0 = bracket.rounds[0]!.matchups[0]!;
    const winner = m0.artistA!;

    const next = applyWinner(bracket, m0.id, winner);

    expect(next.rounds[0]!.matchups[0]!.winner?.id).toBe(winner.id);
  });

  it('does not mutate the input bracket', () => {
    const bracket = freshBracket();
    const m0 = bracket.rounds[0]!.matchups[0]!;

    applyWinner(bracket, m0.id, m0.artistA!);

    expect(bracket.rounds[0]!.matchups[0]!.winner).toBeNull();
  });

  it('propagates the winner into the parent matchup', () => {
    const bracket = freshBracket();
    const m0 = bracket.rounds[0]!.matchups[0]!;
    const winner = m0.artistA!;

    const next = applyWinner(bracket, m0.id, winner);

    const parent = next.rounds[1]!.matchups[0]!;
    expect(parent.artistA?.id === winner.id || parent.artistB?.id === winner.id).toBe(true);
  });

  it('sets the champion when the final round is decided', () => {
    let bracket = freshBracket();

    for (let r = 0; r < 3; r++) {
      for (const matchup of bracket.rounds[r]!.matchups) {
        const live = bracket.rounds[r]!.matchups.find((m) => m.id === matchup.id)!;
        if (live.artistA && live.artistB) {
          bracket = applyWinner(bracket, live.id, live.artistA);
        }
      }
    }

    expect(bracket.champion).not.toBeNull();
  });

  it('invalidates downstream when an earlier winner changes', () => {
    let bracket = freshBracket();
    const m0 = bracket.rounds[0]!.matchups[0]!;
    const original = m0.artistA!;
    const replacement = m0.artistB!;

    bracket = applyWinner(bracket, m0.id, original);
    expect(bracket.rounds[1]!.matchups[0]!.artistA?.id).toBe(original.id);

    bracket = applyWinner(bracket, m0.id, replacement);

    const parent = bracket.rounds[1]!.matchups[0]!;
    expect(parent.artistA?.id === original.id || parent.artistB?.id === original.id).toBe(false);
    expect(parent.artistA?.id === replacement.id || parent.artistB?.id === replacement.id).toBe(true);
  });

  it('clears the champion when the deciding winner is invalidated', () => {
    let bracket = freshBracket();

    for (let r = 0; r < 3; r++) {
      for (const matchup of bracket.rounds[r]!.matchups) {
        const live = bracket.rounds[r]!.matchups.find((m) => m.id === matchup.id)!;
        if (live.artistA && live.artistB) {
          bracket = applyWinner(bracket, live.id, live.artistA);
        }
      }
    }
    expect(bracket.champion).not.toBeNull();

    const m0 = bracket.rounds[0]!.matchups[0]!;
    bracket = applyWinner(bracket, m0.id, m0.artistB!);

    expect(bracket.champion).toBeNull();
  });

  it('returns the bracket unchanged for an unknown matchup id', () => {
    const bracket = freshBracket();
    const winner = bracket.rounds[0]!.matchups[0]!.artistA!;

    const next = applyWinner(bracket, 'does-not-exist', winner);

    expect(next).toBe(bracket);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- bracketEngine.applyWinner`
Expected: FAIL — `applyWinner` is not exported by `../utils/bracketEngine`.

- [ ] **Step 3: Add `applyWinner` to `bracketEngine.ts`**

Append to `src/utils/bracketEngine.ts` (the file already imports the types it needs):

```ts
/** Find a matchup anywhere in the bracket by id. */
export function findMatchup(bracket: BracketData, id: string): Matchup | undefined {
  for (const round of bracket.rounds) {
    const found = round.matchups.find((m) => m.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Recursively remove an artist from all downstream matchups. Mutates in place. */
function invalidateDownstream(bracket: BracketData, fromRound: number, artistId: string): void {
  for (let r = fromRound; r < bracket.rounds.length; r++) {
    const round = bracket.rounds[r]!;
    for (const matchup of round.matchups) {
      if (matchup.artistA?.id === artistId) {
        matchup.artistA = null;
        if (matchup.winner?.id === artistId) {
          matchup.winner = null;
        }
      }
      if (matchup.artistB?.id === artistId) {
        matchup.artistB = null;
        if (matchup.winner?.id === artistId) {
          matchup.winner = null;
        }
      }
    }
  }
  if (bracket.champion?.id === artistId) {
    bracket.champion = null;
  }
}

/**
 * Record a winner and propagate them forward, returning a new bracket.
 * Changing an existing winner invalidates every downstream matchup they reached.
 * Returns the input unchanged if the matchup id is unknown.
 */
export function applyWinner(
  bracket: BracketData,
  matchupId: string,
  winner: SeededArtist,
): BracketData {
  const next: BracketData = {
    ...bracket,
    champion: bracket.champion ? { ...bracket.champion } : null,
    regions: [...bracket.regions],
    rounds: bracket.rounds.map((r) => ({
      ...r,
      matchups: r.matchups.map((m) => ({ ...m })),
    })),
  };

  const matchup = findMatchup(next, matchupId);
  if (!matchup) return bracket;

  if (matchup.winner && matchup.winner.id !== winner.id) {
    invalidateDownstream(next, matchup.round + 1, matchup.winner.id);
  }

  matchup.winner = winner;

  const nextRound = next.rounds[matchup.round + 1];
  if (nextRound) {
    const parent = nextRound.matchups.find(
      (m) =>
        m.childMatchupIds &&
        (m.childMatchupIds[0] === matchupId || m.childMatchupIds[1] === matchupId),
    );
    if (parent) {
      if (parent.childMatchupIds?.[0] === matchupId) {
        parent.artistA = winner;
      } else {
        parent.artistB = winner;
      }
    }
  } else {
    next.champion = winner;
  }

  return next;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- bracketEngine.applyWinner`
Expected: PASS, 7 tests.

- [ ] **Step 5: Rewrite `selectWinner` to delegate**

In `src/stores/bracketStore.ts`, delete the module-private `findMatchup` (lines 26-32) and
`invalidateDownstream` (lines 34-57), change the import line, and replace `selectWinner`.

**`getMatchupById` also calls `findMatchup`** (line 136-140). Deleting the local copy without
importing the exported one breaks the build — that is why `applyWinner` exports it. Change
the import to bring in all three:

```ts
import { buildBracket, applyWinner, findMatchup } from '../utils/bracketEngine';
```

Replace `selectWinner` in its entirety with:

```ts
  selectWinner: (matchupId, winner) =>
    set((state) => {
      if (!state.bracket || state.readOnly) return state;
      return { bracket: applyWinner(state.bracket, matchupId, winner) };
    }),
```

Leave `getMatchupById` as it is — it now resolves `findMatchup` from the import:

```ts
  getMatchupById: (id) => {
    const { bracket } = get();
    if (!bracket) return undefined;
    return findMatchup(bracket, id);
  },
```

- [ ] **Step 6: Run the full suite — the store tests are the regression guard**

Run: `npm test`
Expected: PASS. `src/test/bracketStore.test.ts` must pass with **no edits to that file**. If
any store test fails, `applyWinner` diverges from the original behavior — fix `applyWinner`,
never the test.

- [ ] **Step 7: Type check**

Run: `npm run build`
Expected: exit 0, no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add src/utils/bracketEngine.ts src/stores/bracketStore.ts src/test/bracketEngine.applyWinner.test.ts
git commit -m "Extract applyWinner from bracketStore as a pure function

The mini-bracket on the landing page needs winner propagation without
writing to the singleton store the real app depends on. Moves the logic
and its two helpers into bracketEngine; selectWinner keeps its guards and
delegates. Store behavior is unchanged — bracketStore.test.ts passes
untouched as the regression guard."
```

---

## Task 2: Playable mini-bracket

**Files:**
- Create: `src/components/landing/MiniMatchupCard.tsx`
- Create: `src/components/landing/MiniBracket.tsx`
- Test: `src/test/MiniBracket.test.tsx`

**Interfaces:**
- Consumes: `applyWinner` from Task 1; `seedArtists` from `src/utils/seeding.ts`; `buildBracket` from `src/utils/bracketEngine.ts`; `demoArtists` from `src/data/demoArtists.ts`.
- Produces:
  - `MiniMatchupCard({ matchup, onPick }: { matchup: Matchup; onPick: (winner: SeededArtist) => void })`
  - `MiniBracket({ onPlayDemo }: { onPlayDemo: () => void })` — Task 4 renders this and supplies `onPlayDemo`.
  - Test hooks that Task 2's tests and nothing else rely on: each card carries `data-testid={\`mini-matchup-${matchup.id}\`}`, the champion banner carries `data-testid="mini-champion"`. Matchup ids follow `r{round}-m{index}` from `buildBracket`.

- [ ] **Step 1: Write the failing test**

Create `src/test/MiniBracket.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MiniBracket } from '../components/landing/MiniBracket';

/** Round sizes for an 8-artist bracket: 4 quarterfinals, 2 semifinals, 1 final. */
const ROUNDS: [number, number][] = [
  [0, 4],
  [1, 2],
  [2, 1],
];

/** Click the first artist in every matchup, round by round. */
function playThrough(): void {
  for (const [round, count] of ROUNDS) {
    for (let m = 0; m < count; m++) {
      const card = screen.getByTestId(`mini-matchup-r${round}-m${m}`);
      const picks = within(card).getAllByRole('button');
      fireEvent.click(picks[0]!);
    }
  }
}

describe('MiniBracket', () => {
  it('renders all seven matchups', () => {
    render(<MiniBracket onPlayDemo={() => {}} />);

    for (const [round, count] of ROUNDS) {
      for (let m = 0; m < count; m++) {
        expect(screen.getByTestId(`mini-matchup-r${round}-m${m}`)).toBeInTheDocument();
      }
    }
  });

  it('crowns no champion before any picks', () => {
    render(<MiniBracket onPlayDemo={() => {}} />);

    expect(screen.queryByTestId('mini-champion')).not.toBeInTheDocument();
  });

  it('crowns a champion after all seven picks', () => {
    render(<MiniBracket onPlayDemo={() => {}} />);

    playThrough();

    expect(screen.getByTestId('mini-champion')).toBeInTheDocument();
  });

  it('clears the champion when an earlier pick is changed', () => {
    render(<MiniBracket onPlayDemo={() => {}} />);
    playThrough();
    expect(screen.getByTestId('mini-champion')).toBeInTheDocument();

    const card = screen.getByTestId('mini-matchup-r0-m0');
    const picks = within(card).getAllByRole('button');
    fireEvent.click(picks[1]!);

    expect(screen.queryByTestId('mini-champion')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- MiniBracket`
Expected: FAIL — cannot resolve `../components/landing/MiniBracket`.

- [ ] **Step 3: Create `MiniMatchupCard.tsx`**

```tsx
import type { Matchup, SeededArtist } from '../../types/bracket';

interface MiniMatchupCardProps {
  matchup: Matchup;
  onPick: (winner: SeededArtist) => void;
}

/** Two-letter monogram, e.g. "The Weeknd" -> "TW", "Drake" -> "DR". */
function initials(name: string): string {
  const words = name.split(' ').filter(Boolean);
  if (words.length === 1) return (words[0] ?? '').slice(0, 2).toUpperCase();
  return words
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function MiniMatchupCard({ matchup, onPick }: MiniMatchupCardProps) {
  const slots: (SeededArtist | null)[] = [matchup.artistA, matchup.artistB];

  return (
    <div
      data-testid={`mini-matchup-${matchup.id}`}
      className="flex flex-col gap-px overflow-hidden rounded-lg border border-border-subtle bg-border-subtle"
    >
      {slots.map((artist, index) =>
        artist ? (
          <button
            key={artist.id}
            type="button"
            onClick={() => onPick(artist)}
            aria-label={`Pick ${artist.name}`}
            aria-pressed={matchup.winner?.id === artist.id}
            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 ${
              matchup.winner?.id === artist.id
                ? 'bg-spotify-green text-black'
                : 'bg-bg-card text-text-primary hover:bg-bg-secondary'
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                matchup.winner?.id === artist.id
                  ? 'bg-black/20 text-black'
                  : 'bg-spotify-green/15 text-spotify-green'
              }`}
            >
              {initials(artist.name)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{artist.name}</span>
            <span className="shrink-0 text-xs opacity-60">{artist.seed}</span>
          </button>
        ) : (
          <div
            key={`empty-${index}`}
            className="flex items-center gap-3 bg-bg-card px-3 py-2.5 text-text-secondary"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-border-subtle text-xs">
              —
            </span>
            <span className="flex-1 text-sm italic opacity-60">Awaiting winner</span>
          </div>
        ),
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `MiniBracket.tsx`**

```tsx
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
            That&rsquo;s the mechanic. The real thing seeds your actual Spotify top 32 and plays
            30-second previews on every matchup.
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- MiniBracket`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/MiniBracket.tsx src/components/landing/MiniMatchupCard.tsx src/test/MiniBracket.test.tsx
git commit -m "Add playable 8-artist mini-bracket for the landing page

Uses seedArtists + buildBracket + applyWinner, so the taste a visitor
plays is the real engine at the app's real smallest bracket size. State
is local; the singleton store is untouched. Tiles render CSS monograms
rather than the placehold.co URLs demo mode uses, so the landing page
makes no external image requests."
```

---

## Task 3: Prompt card

**Files:**
- Create: `src/components/landing/PromptCard.tsx`
- Test: `src/test/PromptCard.test.tsx`

**Interfaces:**
- Produces: `PromptCard()` and `export const CLAUDE_PROMPT: string`. Task 4 renders `PromptCard`.

- [ ] **Step 1: Write the failing test**

Create `src/test/PromptCard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptCard, CLAUDE_PROMPT } from '../components/landing/PromptCard';

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

describe('PromptCard', () => {
  it('renders the prompt text', () => {
    render(<PromptCard />);

    expect(screen.getByText(/Clone and set up Music Madness/)).toBeInTheDocument();
  });

  it('names the repo and the Developer Mode gotcha', () => {
    expect(CLAUDE_PROMPT).toContain('https://github.com/rbfyfe/SpotifyMadness');
    expect(CLAUDE_PROMPT).toContain('Developer Mode');
    expect(CLAUDE_PROMPT).toContain('http://localhost:5173/callback');
  });

  it('copies the prompt to the clipboard', async () => {
    render(<PromptCard />);

    fireEvent.click(screen.getByRole('button', { name: /copy the prompt/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(CLAUDE_PROMPT));
  });

  it('confirms the copy to the user', async () => {
    render(<PromptCard />);

    fireEvent.click(screen.getByRole('button', { name: /copy the prompt/i }));

    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- PromptCard`
Expected: FAIL — cannot resolve `../components/landing/PromptCard`.

- [ ] **Step 3: Create `PromptCard.tsx`**

The template literal below must match THE PROMPT in Global Constraints byte for byte.

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- PromptCard`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/PromptCard.tsx src/test/PromptCard.test.tsx
git commit -m "Add copyable Claude prompt card

Prompt text is byte-identical to the RippedPages working paper copy; a
comment in each file names the other as its counterpart."
```

---

## Task 4: Landing page and routing

**Files:**
- Create: `src/utils/startDemo.ts`
- Create: `src/components/landing/LandingPage.tsx`
- Modify: `src/components/LoginPage.tsx:2,7,9-13,53` (imports and handler body only)
- Modify: `src/App.tsx:23-35`
- Test: `src/test/App.routing.test.tsx`

**Interfaces:**
- Consumes: `MiniBracket` (Task 2), `PromptCard` (Task 3), `useAuthStore` from `src/stores/authStore.ts`.
- Produces: `startDemo(): void` and `LandingPage()`.

- [ ] **Step 1: Write the failing test**

Create `src/test/App.routing.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { useAuthStore } from '../stores/authStore';
import { startDemo } from '../utils/startDemo';

function goTo(path: string) {
  window.history.pushState({}, '', path);
}

beforeEach(() => {
  // authStore hydrates from sessionStorage at module load, and setDemo writes to it.
  sessionStorage.clear();
  useAuthStore.setState({ token: null, tokenExpiry: null, user: null, isDemo: false });
  goTo('/');
});

describe('App routing', () => {
  it('renders the landing page at /', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /music madness/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy the prompt/i })).toBeInTheDocument();
  });

  it('renders the original login page at /login', () => {
    goTo('/login');

    render(<App />);

    expect(screen.getByRole('button', { name: /connect with spotify/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy the prompt/i })).not.toBeInTheDocument();
  });

  it('falls back to the landing page for an unknown path', () => {
    goTo('/nope');

    render(<App />);

    expect(screen.getByRole('button', { name: /copy the prompt/i })).toBeInTheDocument();
  });
});

describe('startDemo', () => {
  it('enters demo mode and navigates to the bracket', () => {
    startDemo();

    expect(useAuthStore.getState().isDemo).toBe(true);
    expect(window.location.pathname).toBe('/bracket');
  });

  it('is the handler both entry points use', () => {
    // Guards against the two pages drifting apart: LoginPage and LandingPage
    // must route through the same helper, not their own copies.
    goTo('/login');
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /try demo/i }));
    expect(useAuthStore.getState().isDemo).toBe(true);
    expect(window.location.pathname).toBe('/bracket');
    unmount();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- App.routing`
Expected: FAIL — no heading/prompt button, because `/` still renders `LoginPage`.

- [ ] **Step 3: Extract the shared `startDemo` helper**

Both pages need to enter demo mode and navigate to the bracket. Rather than duplicate the
three lines, create `src/utils/startDemo.ts`:

```ts
import { useAuthStore } from '../stores/authStore';

/**
 * Enter demo mode and navigate to the bracket.
 * Shared by LoginPage and LandingPage so the two cannot drift.
 */
export function startDemo(): void {
  useAuthStore.getState().setDemo();
  window.history.pushState({}, '', '/bracket');
  window.dispatchEvent(new PopStateEvent('popstate'));
}
```

Then update `src/components/LoginPage.tsx` to use it. **Change only the imports and the
handler — every rendered string, class name, and element stays byte-identical.**

Replace the import of `useAuthStore` (line 3) with:

```tsx
import { startDemo } from '../utils/startDemo';
```

Delete the `setDemo` selector and the `handleDemo` function (lines 7-13), and change the
demo button's handler from `onClick={handleDemo}` to `onClick={startDemo}`.

`useSpotifyAuth` and its `login` binding stay. `noUnusedLocals` is on, so leaving the old
`useAuthStore` import or `setDemo` binding in place fails the build.

- [ ] **Step 4: Create `LandingPage.tsx`**

```tsx
import { motion } from 'framer-motion';
import { startDemo } from '../../utils/startDemo';
import { MiniBracket } from './MiniBracket';
import { PromptCard } from './PromptCard';

const FEATURES = [
  {
    title: 'Seeded from your listening',
    body: 'Your top 32 artists, ranked by popularity and spread across four regions by a serpentine draft.',
  },
  {
    title: 'Previews on every matchup',
    body: 'Open a head-to-head and play 30-second previews of each artist’s top tracks before you decide.',
  },
  {
    title: 'A champion, properly crowned',
    body: 'Confetti, a spinning album, and the one artist who survived five rounds of your own second-guessing.',
  },
  {
    title: 'Shareable when it’s done',
    body: 'Export the bracket as an image, or send a link that anyone can open without a Spotify account.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Paste the prompt into Claude Code',
    body: 'It clones the repo, installs dependencies, and walks you through the rest.',
  },
  {
    n: '02',
    title: 'Create a Spotify Developer App',
    body: 'Free, at developer.spotify.com. You need the Client ID and one redirect URI.',
  },
  {
    n: '03',
    title: 'Add yourself as a user, then run it',
    body: 'Developer Mode apps only admit accounts you list. Add your own, then npm run dev.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <section className="animated-gradient px-4 py-20 text-center sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-6 text-6xl">🏆</div>
          <h1 className="font-heading text-5xl font-black tracking-tight text-glow sm:text-7xl">
            Music Madness
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-body text-lg text-text-secondary">
            Your top artists, seeded into a March Madness bracket. You pick every matchup. One of
            them walks out a champion.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={startDemo}
              className="cursor-pointer rounded-full bg-spotify-green px-9 py-4 font-body text-lg font-bold text-black transition-colors duration-200 hover:bg-spotify-green-bright"
            >
              Play the demo
            </button>
            <a
              href="#build"
              className="cursor-pointer rounded-full border-2 border-text-secondary/50 px-7 py-3.5 font-body font-semibold text-text-secondary transition-colors duration-200 hover:border-text-primary hover:text-text-primary"
            >
              Get the prompt
            </a>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-heading text-3xl font-black text-text-primary">Try it right here</h2>
        <p className="mt-2 max-w-2xl font-body text-text-secondary">
          Eight artists, seven picks. This is the same bracket engine the full app runs — just the
          smallest size it supports.
        </p>
        <div className="mt-8">
          <MiniBracket onPlayDemo={startDemo} />
        </div>
      </section>

      <section className="border-y border-border-subtle bg-bg-secondary px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-3xl font-black text-text-primary">
            What you actually get
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border-subtle bg-bg-card p-6"
              >
                <h3 className="font-heading text-lg font-bold text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-text-secondary">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-heading text-3xl font-black text-text-primary">
          Why you need your own key
        </h2>
        <div className="mt-4 space-y-4 font-body leading-relaxed text-text-secondary">
          <p>
            Spotify caps apps in Developer Mode at 25 manually-listed users. That is the whole
            reason this page exists instead of a login button that works for everyone — if you are
            not on the list, Spotify turns you away before the app ever loads.
          </p>
          <p>
            So the app is yours to run, not mine to host. You make your own Spotify app, get your
            own Client ID, and point your own copy at it. It is free, it takes about ten minutes,
            and nothing you listen to ever passes through me.
          </p>
        </div>
      </section>

      <section id="build" className="mx-auto max-w-3xl scroll-mt-8 px-4 pb-8">
        <h2 className="font-heading text-3xl font-black text-text-primary">Build your own</h2>
        <p className="mt-2 font-body text-text-secondary">
          Hand this to Claude Code and answer its questions.
        </p>
        <div className="mt-6">
          <PromptCard />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n}>
              <div className="font-mono text-xs tracking-[0.14em] text-spotify-green">
                Step {step.n}
              </div>
              <h3 className="mt-2 font-heading text-base font-bold text-text-primary">
                {step.title}
              </h3>
              <p className="mt-1.5 font-body text-sm leading-relaxed text-text-secondary">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border-subtle px-4 py-10 text-center font-body text-sm text-text-secondary">
        <a
          href="https://github.com/rbfyfe/SpotifyMadness"
          className="text-spotify-green hover:underline"
        >
          github.com/rbfyfe/SpotifyMadness
        </a>
        <span className="mx-3 opacity-40">·</span>
        <span>Powered by the Spotify API</span>
      </footer>
    </div>
  );
}
```

- [ ] **Step 5: Wire the routes in `App.tsx`**

Add the import next to the existing component imports:

```tsx
import { LandingPage } from './components/landing/LandingPage';
```

Replace the `<AnimatePresence>` block (lines 23-35) with:

```tsx
    <AnimatePresence mode="wait">
      {path.startsWith('/shared/') ? (
        <SharedBracketPage key="shared" />
      ) : path === '/callback' ? (
        <CallbackPage key="callback" />
      ) : path === '/login' ? (
        <LoginPage key="login" />
      ) : isAuthenticated && path === '/bracket' ? (
        <BracketPage key="bracket" />
      ) : (
        <LandingPage key="landing" />
      )}
    </AnimatePresence>
```

- [ ] **Step 6: Run the routing test**

Run: `npm test -- App.routing`
Expected: PASS, 3 tests.

- [ ] **Step 7: Run the full suite and the build**

Run: `npm test && npm run build`
Expected: all tests PASS, build exits 0.

- [ ] **Step 8: Verify by hand**

Run: `npm run dev`, then check each in the browser:
- `/` shows the landing page; seven picks crown a champion; changing a Quarterfinal pick clears it.
- "Play the demo" and "Play the full demo" both enter demo mode and land on the bracket.
- "Copy the prompt" copies, and the button reads "Copied".
- `/login` shows the original login page, unchanged.
- `/bracket` without auth falls back to the landing page.

- [ ] **Step 9: Commit**

```bash
git add src/components/landing/LandingPage.tsx src/utils/startDemo.ts \
        src/components/LoginPage.tsx src/App.tsx src/test/App.routing.test.tsx
git commit -m "Add landing page at / and move login to /login

Spotify's 25-user Developer Mode cap means the hosted app can't serve
strangers, so / now previews the experience and hands over a prompt for
building your own.

Both pages enter demo mode through a shared startDemo() helper rather than
repeating the store call and history push. LoginPage's markup and copy are
byte-identical; only its imports and click handler changed. It stays
reachable at /login."
```

---

# Phase B — RippedPages working paper

## Task 5: Write the working paper

**Files:**
- Create: `work/music-madness/index.html` in `/Users/russellfyfe/rippedpages/.claude/worktrees/music-madness`

**Interfaces:**
- Consumes: the house form and CSS from `work/calendez/index.html` and `work/claudecleaner/index.html` in the same repo. THE PROMPT from Global Constraints.
- Produces: a page served at `/work/music-madness/`, which Task 6 links from the register.

- [ ] **Step 1: Check the precondition — do not start until it passes**

Phase B depends on the `page`-field infrastructure, which as of 2026-07-21 is **not on
`main`**. Four PRs are open and none is merged:

| PR | Branch | Carries the `page` infra? |
|---|---|---|
| #1 | `claudecleaner-page` | yes — it introduces it |
| #2 | `maplescreenshot-page` | no |
| #3 | `calendez-page` | no |
| #4 | `register-pages` | yes — stacks #1, adds six more papers |

Either #1 or #4 landing unblocks this. Neither has. Without that infrastructure
`build-public.mjs` strips the `page` field out of `data/projects.json` and `index.html` has
no same-tab rendering, so Task 6 silently produces a register row that still opens the live
app in a new tab — a working paper nothing links to.

```bash
cd /Users/russellfyfe/rippedpages/.claude/worktrees/music-madness
git fetch origin
git log --oneline -1 origin/main
grep -c '"page"' scripts/build-public.mjs
grep -c 'p.page' index.html
```

Expected once unblocked: both greps return `1` or more. If either returns `0`, **stop** —
the infrastructure has not landed. Report the block rather than working around it. Do not
add the `page` field to `build-public.mjs` from this branch; that change belongs to PR #1.

- [ ] **Step 1b: Read the authority and confirm the register position**

```bash
git show origin/main:CLAUDE.md
git show origin/main:inventory.full.json | python3 -c "
import json,sys
pub=[p for p in json.load(sys.stdin)['projects'] if p.get('category')=='public']
for i,p in enumerate(pub,1):
    if p['slug']=='music-madness': print(f'RP-{i:02d}')
"
```

`CLAUDE.md` outranks this plan; if it has changed, follow it. The second command prints the
register number to use in the back link and colophon — verified `RP-03` on 2026-07-21, but
derive it rather than assuming, since it is array position and the array can grow.

The manager session fast-forwards this branch after the infra lands. Do not merge `main`
here manually.

- [ ] **Step 2: Read the two reference papers end to end**

```bash
wc -l work/calendez/index.html work/claudecleaner/index.html
```

Read `work/calendez/index.html` in full before writing anything. It is the closest model.
Note especially: the `<head>` block, the `:root` two-comment token split, `.back`, `.cover`,
`.stats`/`.chip`, `.acts`/`.act`, `.reg-label`, `.prose`/`.lede`/`.pull`, the
`figure > .plate > .platescroll > .shot` plate frame with its `.chrome` browser bar,
`.pipe`/`.stage`/`.sn`, `.stack`, and the closing `.colophon`/`.cols`/`.col`/`.foot`.

- [ ] **Step 3: Create `work/music-madness/index.html`**

Build it as a self-contained file. Carry these class definitions over from
`work/calendez/index.html` **unchanged** — they are the house scaffolding:

`.rp .crop .reg .back .cover .kicker .wm .tag .stats .chip .acts .act .stamp section
.reg-label .prose .lede .pull figure .plate .platescroll .shot figcaption .chrome .dot
.urlbar .pipe .stage .sn .stack .colophon .cols .col .foot` plus all three media queries
(`prefers-reduced-motion`, `max-width:760px`, `max-width:640px`).

Do **not** carry over Calendez's plate internals — `.card .p-ev .p-cal .p-slot .owner .evt
.badges .badge .evdesc .paneh .mnav .cal .tzrow .tzsel .slots .slot` are its booking UI.
Replace them with Music Madness equivalents.

Token block — house tokens verbatim from Calendez, then the app's own palette read from
`src/index.css` in the SpotifyMadness repo:

```css
    :root {
      /* RippedPages house tokens — kept identical to the register. */
      --paper:#e7e5db; --cover:#f4f2ea; --ink:#23211a; --mut:#6c6e61;
      --rule:#c6c5b6; --grid:rgba(52,95,140,.07); --ox:#8a2b20; --ox2:#b1432f;
      --blue:#345f8c; --blue-soft:#5a7fa6;
      --serif:"Iowan Old Style", Georgia, "Palatino Linotype", Palatino, serif;
      --mono:ui-monospace, "SF Mono", Menlo, Consolas, monospace;

      /* Plate tokens — the app's own palette, reproduced from source. */
      --mm-bg:#0D0D0D; --mm-panel:#181818; --mm-card:#282828; --mm-line:#333333;
      --mm-green:#1DB954; --mm-green-br:#1ED760; --mm-green-dk:#1AA34A;
      --mm-txt:#FFFFFF; --mm-mut:#B3B3B3;
    }
```

`<head>` follows the Calendez pattern exactly:

```html
  <title>Music Madness — RippedPages</title>
  <meta name="description" content="A March Madness bracket for your Spotify top artists. Thirty-two seeded, previewed head-to-head, one champion — and a prompt that builds you your own copy." />
  <meta name="theme-color" content="#e7e5db" />
  <meta property="og:title" content="Music Madness — RippedPages" />
  <meta property="og:description" content="Thirty-two artists, thirty-one matchups, one champion. Spotify's 25-user cap means you run your own — here's the prompt. A working paper." />
  <meta property="og:type" content="article" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏆</text></svg>" />
```

Body structure:

```html
    <!-- RP-03 matches this row's position in the register, which index.html
         derives from array order (pad(i + 1)). Music Madness is third in
         inventory.full.json. Reorder the register and this must change. -->
    <a class="back" href="/">← <b>RP-03</b> · back to the register</a>

    <header class="cover">
      <div class="stamp" aria-hidden="true"><span>Bring your own<b>RP</b>API key</span></div>
      <div class="kicker">Working paper · Web · 2026</div>
      <h1 class="wm">Music <em>Madness</em></h1>
      <p class="tag">Thirty-two artists you already listen to, and <b>one bad decision at a time</b> until only one is left.</p>
      <div class="stats">
        <span class="chip"><b>32</b> artists</span>
        <span class="chip"><b>31</b> matchups</span>
        <span class="chip"><b>30s</b> previews</span>
        <span class="chip"><b>1</b> champion</span>
      </div>
      <div class="acts">
        <a class="act solid" href="https://music-madness-ashen.vercel.app" target="_blank" rel="noopener noreferrer">SEE IT LIVE</a>
        <a class="act ghost" href="https://github.com/rbfyfe/SpotifyMadness" target="_blank" rel="noopener noreferrer">READ THE SOURCE</a>
      </div>
    </header>
```

The CTA labels and `target="_blank"` are mandated by `CLAUDE.md`, not stylistic. Calendez
predates that rule and uses different wording — follow `CLAUDE.md`, not Calendez, here.
Music Madness has both a live deployment and a public repo, so it takes both CTAs and no
`REQUEST THE CODE` mailto.

Then five sections, each opening with the house `.reg-label` block:

1. **The idea.** Skeleton:

```html
    <section aria-labelledby="s-idea">
      <div class="reg-label">
        <h2 id="s-idea">The idea</h2>
        <span>seeded by what you already play</span>
      </div>
      <div class="prose">
        <p class="lede">…</p>
        <p>…</p>
        <p class="pull">…</p>
        <p>…</p>
      </div>
    </section>
```

   Facts the prose must carry, all verifiable in `src/utils/seeding.ts` and
   `src/utils/bracketEngine.ts`: the top 32 come back from the Spotify API ranked by
   popularity; a serpentine draft spreads them across four regions so favorites cannot
   collide early, balanced within 15%; each region seeds 1v8, 4v5, 3v6, 2v7; 31 matchups
   total; every matchup plays 30-second previews of both artists' top tracks. The angle: a
   bracket is a good format for a question that has no correct answer.

2. **Plate I.** Skeleton:

```html
    <section aria-labelledby="s-plate">
      <div class="reg-label">
        <h2 id="s-plate">Plate I · the bracket</h2>
        <span>React 19 · Spotify Web API</span>
      </div>
      <figure>
        <div class="plate">
          <div class="platescroll"><div class="shot">
            <div class="chrome">
              <span class="dot" style="background:#ff5f57"></span>
              <span class="dot" style="background:#febc2e"></span>
              <span class="dot" style="background:#28c840"></span>
              <span class="urlbar"><b>music-madness</b>.vercel.app/bracket</span>
            </div>
            <div class="mm">
              <!-- one region: 4 quarterfinal pairs → 2 semifinals → 1 championship -->
            </div>
          </div></div>
        </div>
        <figcaption>…</figcaption>
      </figure>
    </section>
```

   Inside `.mm`, build three columns of pairs. Each artist row gets a monogram circle, a
   name, and a seed number. Style the advancing side of a decided pair with `--mm-green` on
   black text, the eliminated side and undecided rows with `--mm-card` on `--mm-mut`. Use
   `--mm-bg` for the plate background and `--mm-line` for separators. The `<figcaption>`
   explains that every winner is carried forward automatically, and that changing an early
   pick clears everything downstream it had already reached.

3. **The catch.** Skeleton:

```html
    <section aria-labelledby="s-catch">
      <div class="reg-label">
        <h2 id="s-catch">The catch</h2>
        <span>25 users, hard cap</span>
      </div>
      <div class="prose">
        <p class="lede">…</p>
        <p>…</p>
      </div>
    </section>
```

   Content: Spotify Developer Mode apps admit only accounts the owner adds by hand, up to 25.
   That makes a public hosted version impossible, which is why this paper hands over a prompt
   instead of a login button. Plain and unapologetic. Offer no workaround — there isn't one.

4. `<h2 id="s-prompt">The prescription</h2>` — span `paste into Claude Code`.
   THE PROMPT from Global Constraints inside `<pre id="prompt" class="slip">`, with a copy
   button. Add these two classes (Calendez has no equivalent):

```css
    .slip{ font-family:var(--mono); font-size:12.5px; line-height:1.6; color:var(--ink);
      background:var(--cover); border:1px solid var(--rule); border-left:2px solid var(--ox);
      padding:18px 20px; overflow-x:auto; white-space:pre; }
    .copy{ font-family:var(--mono); font-size:11px; letter-spacing:.08em; text-transform:uppercase;
      color:var(--cover); background:var(--ox); border:none; padding:9px 16px; cursor:pointer;
      margin-top:12px; }
    .copy:hover{ background:var(--ox2); }
```

   Add a comment above the `<pre>`:

```html
      <!-- Byte-identical to CLAUDE_PROMPT in src/components/landing/PromptCard.tsx
           (repo: rbfyfe/SpotifyMadness). Change both together. -->
```

5. `<h2 id="s-assembly">Assembly</h2>` — span `about ten minutes`.
   Use the house `.pipe` / `.stage` / `.sn` pattern with four stages: **Step 01** paste the
   prompt; **Step 02** create a Spotify Developer App and copy the Client ID; **Step 03** add
   `http://localhost:5173/callback` as a redirect URI *and add your own Spotify account under
   Users*; **Step 04** `npm run dev` and log in. Close the section with a `.stack` strip:
   `React 19`, `TypeScript`, `Vite 6`, `Tailwind v4`, `Zustand`, `Framer Motion`,
   `Spotify Web API`, `Supabase`, `Vercel`.

   Four stages here against the landing page's three (Task 4's `STEPS`) is deliberate, not
   drift. The React page compresses redirect URI and Developer Mode users into one step
   because its three-column grid is tighter; the paper's `.pipe` has room to give the
   Users step its own stage, and it earns one — it is the single most common setup failure.

Closing colophon, matching Calendez's four columns:

```html
    <div class="colophon">
      <div class="cols">
        <div class="col">
          <h3>Status</h3>
          <p>Live, with a demo that needs no Spotify account at all. The real thing runs on your own key — see the prescription above.</p>
        </div>
        <div class="col">
          <h3>Shape</h3>
          <p class="m">32 artists<br>31 matchups<br>5 rounds<br>4 regions</p>
        </div>
        <div class="col">
          <h3>Platform</h3>
          <p class="m">Web · any modern browser<br>Vercel free tier<br>Spotify account required</p>
        </div>
        <div class="col">
          <h3>Filed</h3>
          <p class="m">RP-03<br>Drafted &amp; shipped 2026<br>Russ Fyfe</p>
        </div>
      </div>

      <div class="foot">
        <span><a href="/">← the register</a></span>
        <span>RippedPages · filed &amp; kept by RF</span>
      </div>
    </div>
```

Finally the copy-button script, immediately before `</body>`. This is the only JavaScript on
any working paper; it is deliberate and degrades cleanly, since the `<pre>` stays readable
and selectable without it:

```html
  <script>
    (function () {
      var btn = document.getElementById("copy");
      var pre = document.getElementById("prompt");
      if (!btn || !pre || !navigator.clipboard) return;
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(pre.textContent).then(function () {
          btn.textContent = "Copied";
          setTimeout(function () { btn.textContent = "Copy the prompt"; }, 1600);
        });
      });
    })();
  </script>
```

- [ ] **Step 4: Verify the prompt copy is byte-identical across repos**

```bash
cd /Users/russellfyfe/rippedpages/.claude/worktrees/music-madness
python3 - <<'PY'
import re, html, pathlib
mm = pathlib.Path("work/music-madness/index.html").read_text()
here = html.unescape(re.search(r'<pre id="prompt"[^>]*>(.*?)</pre>', mm, re.S).group(1))
there = pathlib.Path(
    "/Users/russellfyfe/SpotifyMadness/.claude/worktrees/"
    "spotify-landing-page-a08967/src/components/landing/PromptCard.tsx"
).read_text()
there = re.search(r"export const CLAUDE_PROMPT = `(.*?)`;", there, re.S).group(1)
print("IDENTICAL" if here.strip() == there.strip() else "MISMATCH")
if here.strip() != there.strip():
    import difflib
    print("\n".join(difflib.unified_diff(there.strip().splitlines(), here.strip().splitlines(), "PromptCard.tsx", "index.html", lineterm="")))
PY
```

Expected: `IDENTICAL`. If it prints a diff, fix the HTML copy — `PromptCard.tsx` is canonical.

- [ ] **Step 5: Serve and inspect**

```bash
python3 -m http.server 3907
```

Open `http://localhost:3907/work/music-madness/` and confirm:
- The paper background, grid, crop marks, and registration mark match the register exactly.
- The plate is the only dark element on the page.
- The copy button copies, and its label flips to "Copied" and back.
- `← RP-03 · back to the register` returns to `/`.
- At 375px wide nothing overflows horizontally; the plate scrolls inside its own frame.
- Open `/work/calendez/` and `/work/claudecleaner/` side by side — the three must read as the
  same publication.

- [ ] **Step 6: Commit**

```bash
git add work/music-madness/index.html
git commit -m "Add the Music Madness working paper

Follows the house form set by ClaudeCleaner and Calendez: inlined house
tokens, a numbered plate carrying the app's own dark palette, and the
four-column colophon. Adds a .slip/.copy pair and a small copy-button
script for the Claude prompt — the first JS on a working paper, kept
progressive so the prompt is readable without it."
```

---

## Task 6: Wire it into the register and open the PR

**Files:**
- Modify: `inventory.full.json`
- Regenerate: `data/projects.json`

**Interfaces:**
- Consumes: the page from Task 5 at `/work/music-madness/`.
- Produces: a pull request against `main` of `rbfyfe/rippedpages`.

- [ ] **Step 1: Correct the entry in `inventory.full.json`**

The current blurb is factually wrong — it says the app seeds *tracks* and crowns by *vote*.
It seeds artists, and the user picks. In the object with `"slug": "music-madness"`, replace
the `blurb` line and add a `page` line directly after `url`:

```json
      "blurb": "March Madness for your Spotify top artists — 32 seeded, previewed head-to-head, one champion. Clone it and run your own.",
      "tech": ["TypeScript", "Spotify API"],
      "url": "https://music-madness-ashen.vercel.app",
      "page": "/work/music-madness/",
      "action": "live",
```

Leave `url`, `repo`, `category`, `rainplan`, and `visibility` alone. `page` takes precedence
over `url` in the register, so the row opens the paper and the paper links out to the app.

- [ ] **Step 2: Regenerate the public file**

```bash
node scripts/build-public.mjs
```

Expected: `✓ Wrote data/projects.json — N public projects, internal fields stripped.` and
exit 0. The script aborts if any internal field leaks.

- [ ] **Step 3: Confirm nothing private leaked**

```bash
grep -E '"(category|rainplan|repo|notes|visibility)"' data/projects.json && echo "LEAK" || echo "clean"
grep -c '"page": "/work/music-madness/"' data/projects.json
```

Expected: `clean`, then `1`.

- [ ] **Step 4: Confirm the diff is exactly three files**

```bash
git diff main...HEAD --stat
```

Expected: only `work/music-madness/index.html`, `inventory.full.json`, and
`data/projects.json`. If `index.html`, `.vercelignore`, or anything else appears, revert it —
the register and the deploy config are out of scope.

- [ ] **Step 5: Verify the register row end to end**

```bash
python3 -m http.server 3907
```

At `http://localhost:3907/`, confirm the Music Madness row:
- shows the corrected blurb (artists, not tracks; no mention of votes),
- reveals `→ read the file` on hover,
- navigates **in the same tab** to `/work/music-madness/`.

- [ ] **Step 6: Commit and open the PR**

```bash
git add inventory.full.json data/projects.json
git commit -m "File Music Madness in the register

Points the row at the new working paper via the page field, which takes
precedence over url, so the row opens the paper and the paper links out
to the live app. Also corrects the blurb: the app seeds artists, not
tracks, and the user picks — there is no voting."

git push -u origin music-madness-page
gh pr create --base main --head music-madness-page \
  --title "Add the Music Madness working paper" \
  --body "$(cat <<'EOF'
Adds `work/music-madness/index.html`, files it in the register, and corrects the entry's blurb.

Follows the house form from ClaudeCleaner and Calendez: inlined house tokens, a numbered plate carrying the app's own dark palette, the `.pipe` assembly stages, and the four-column colophon. The register's `index.html` is untouched — the `page`-field infrastructure it needs already landed on main.

Two deliberate departures, both flagged in the spec:

- **A small copy-button script**, the first JavaScript on a working paper. The page hands over a prompt, so copying it needs to be one click. It degrades cleanly — the `<pre>` stays readable and selectable without JS.
- **Tokens are inlined rather than shared.** The design spec originally called for extracting a shared `paper.css`; that was withdrawn once five working papers went in flight, since it is a portfolio-wide call rather than one to make from this branch. The drift risk is real and worth revisiting.

The blurb was wrong before this change — it described seeding *tracks* and crowning by *vote*. The app seeds artists and the user picks.

`data/projects.json` is regenerated via `node scripts/build-public.mjs`, never hand-edited.

Companion change in `rbfyfe/SpotifyMadness` adds the landing page this paper links to. The prompt text is byte-identical in both repos.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: the PR opens against `main`. Report the URL.

---

# Final verification

Run both suites and confirm the whole flow before calling this done.

**Phase A**

```bash
cd /Users/russellfyfe/SpotifyMadness/.claude/worktrees/spotify-landing-page-a08967
npm test && npm run build
```
Expected: all tests PASS including the unmodified `bracketStore.test.ts`; build exits 0.

**Phase B**

```bash
cd /Users/russellfyfe/rippedpages/.claude/worktrees/music-madness
node scripts/build-public.mjs
git diff main...HEAD --stat
git status --porcelain
```
Expected: script exits 0; diff touches exactly three files; working tree clean.

**Cross-repo**

Re-run the byte-identity check from Task 5 Step 4. Expected: `IDENTICAL`.
