# Music Madness — Landing Page & RippedPages Case Study

**Date:** 2026-07-20
**Status:** Approved design, pending implementation plan

## Problem

Spotify caps apps in Developer Mode at 25 manually-allowlisted users. Music Madness
therefore cannot work as a public hosted product: a stranger who clicks "Connect with
Spotify" on the live app gets an auth error, not a bracket.

The app is still worth showing. The fix is to change what a visitor is being sold. Instead
of "use my app," the offer becomes "watch what this is, then clone it and run your own in
about ten minutes." That requires two new surfaces:

1. A landing page in front of the app that previews the experience and hands over a
   copy-paste Claude prompt.
2. A case-study page on RippedPages, the personal studio site where Music Madness is
   already listed, so the project has a real home in the register.

## Goals

- A visitor understands what the app does without logging in.
- A visitor can *play* the core mechanic within seconds of landing.
- A visitor leaves with a prompt that gets them a running copy.
- The Spotify limitation is stated plainly rather than hidden.
- RippedPages gains a project page consistent with its existing aesthetic.

## Non-goals

- Removing or rewording the existing login page. Visitors are cloning, not using the
  hosted app, so `LoginPage` stays exactly as it is.
- Lifting the Spotify user cap (quota extension is out of scope).
- Rebuilding the bracket app itself. All existing app behavior is unchanged.

---

# Part 1 — Landing page in the Vite app

## Routing

`src/App.tsx` gains one route and changes its fallback. Nothing else moves.

| Path | Before | After |
|---|---|---|
| `/` | `LoginPage` | `LandingPage` (new) |
| `/login` | — | `LoginPage`, unchanged |
| `/callback` | `CallbackPage` | unchanged |
| `/bracket` | `BracketPage` when authed, else `LoginPage` | `BracketPage` when authed, else `LandingPage` |
| `/shared/:id` | `SharedBracketPage` | unchanged |
| unknown | `LoginPage` | `LandingPage` |

The landing page's demo button replicates `LoginPage.handleDemo` exactly: call
`useAuthStore.setDemo()`, `window.history.pushState({}, '', '/bracket')`, then dispatch a
`popstate` event. Allowlisted users (the owner and up to 24 others) reach the real login by
navigating to `/login` directly.

`/shared/:id` must continue to be matched before the auth check, per the existing ordering
in `App.tsx`.

## Required refactor: extract `applyWinner`

The winner-propagation logic currently lives inside the Zustand `set` callback in
`src/stores/bracketStore.ts` (`selectWinner`, plus module-private `findMatchup` and
`invalidateDownstream`). The mini-bracket cannot reuse it without writing to the singleton
store that the real app depends on.

Extract a pure function into `src/utils/bracketEngine.ts`:

```ts
export function applyWinner(
  bracket: BracketData,
  matchupId: string,
  winner: SeededArtist,
): BracketData
```

It returns a new `BracketData` and performs, in order: deep-clone the bracket; locate the
matchup; if a different winner was already set, invalidate downstream; set the winner;
propagate into the parent matchup via `childMatchupIds`, or set `bracket.champion` if there
is no next round.

`bracketStore.selectWinner` becomes a thin wrapper that keeps its existing guards
(`if (!state.bracket || state.readOnly) return state`) and delegates. `findMatchup` and
`invalidateDownstream` move to `bracketEngine.ts` alongside it.

**Behavior must not change.** The existing `src/test/bracketStore.test.ts` is the regression
guard and must pass untouched.

Rationale: this removes the duplication the mini-bracket would otherwise force, makes the
trickiest logic in the codebase directly unit-testable, and shrinks the store to state
management.

## Playable mini-bracket

An 8-artist bracket — the app's real smallest size (`BracketSize = 8`) — built by the
actual engine rather than a hand-faked stub.

- Source data: the first 8 entries of `src/data/demoArtists.ts` (Taylor Swift 95, Drake 93,
  The Weeknd 92, Bad Bunny 91, Kendrick Lamar 90, Billie Eilish 89, SZA 88, Dua Lipa 87).
- Construction: `seedArtists(artists, 8)` then `buildBracket(seeded, 8)`.
- Shape: one region (`🎸 Amplifier`), rounds `Quarterfinal` (4 matchups) → `Semifinal` (2)
  → `Championship` (1). Seven picks total.
- Real 1v8 / 4v5 / 3v6 / 2v7 seeding, real advancement, real round names.
- State: local `useState<BracketData>` in the component, mutated via `applyWinner`. The
  mini-bracket never touches `useBracketStore`.
- Re-picking an earlier matchup invalidates downstream, same as the real app.

Artist tiles render **initials and genre in CSS** rather than the `placehold.co` image URLs
that `demoArtists` carries. This avoids external image requests on the landing page,
improves first paint, and reads as deliberate design rather than placeholder art.

On champion: a celebration state appears with the handoff copy — *"That's the mechanic. The
real thing seeds your actual Spotify top 32 and plays 30-second previews on every
matchup."* — plus a "Play the full demo" button. A reset control replays the mini-bracket.

## Page sections

1. **Hero** — title, one-line pitch, "Play the demo" primary CTA, "Get the prompt"
   secondary (anchor scroll).
2. **Mini-bracket** — "Try it right here," per above.
3. **What you actually get** — four cards: seeded from your listening history · head-to-head
   track previews · champion celebration · shareable card and link.
4. **Why you need your own key** — plain, non-apologetic explanation of the 25-user
   Developer Mode cap. Roughly ten minutes, free, and you own it.
5. **The prompt** — copy-to-clipboard card (text below).
6. **Three steps** — paste into Claude Code → create a Spotify Developer App → run it.
7. **Footer** — repo link.

## The prompt

Canonical text. Must stay byte-identical to the copy on the RippedPages case study.

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

The final note addresses the single most common setup failure and is not optional.

## New files

```
src/components/landing/
├── LandingPage.tsx       # shell; sections 1, 3, 4, 6, 7
├── MiniBracket.tsx       # playable 8-artist taste
├── MiniMatchupCard.tsx   # one head-to-head tile
└── PromptCard.tsx        # prompt text + copy-to-clipboard button
```

Conventions per `CLAUDE.md`: named exports, Tailwind for styling, `import type` for types.

## Testing

- New unit tests for `applyWinner`: propagation into parent, downstream invalidation on
  re-pick, champion set on final round, no-op on unknown matchup id.
- Existing `src/test/bracketStore.test.ts` passes unchanged (regression guard).
- Component test for `MiniBracket`: play all seven picks, assert a champion is crowned;
  change a Quarterfinal pick, assert the downstream Semifinal and Championship clear.

---

# Part 2 — RippedPages case study

## Context

`/Users/russellfyfe/rippedpages` — remote `github.com/rbfyfe/rippedpages.git`, deployed to
`rippedpages.com` on Vercel. A single static `index.html` with no build step, rendering a
ledger of projects fetched from `data/projects.json`.

Aesthetic is "The Working Papers": cream paper (`--paper:#e7e5db`) with a faint blue grid,
Iowan Old Style serif, mono accents, oxblood (`--ox:#8a2b20`) and blue (`--blue:#345f8c`),
torn-paper clip-path header, crop and registration marks, rubber stamp.

**`data/projects.json` is a generated file.** The private `inventory.full.json` is the
source of truth; `node scripts/build-public.mjs` emits only `category === "public"` projects
with fields whitelisted to `slug, name, type, status, blurb, tech, url, action, writeup`.
`inventory.full.json` and `scripts/` are excluded from deployment via `.vercelignore`.
`data/projects.json` must never be hand-edited.

## Workspace

All RippedPages work happens in the per-session worktree at
`/Users/russellfyfe/rippedpages/.claude/worktrees/music-madness`, branch `music-madness-page`.
Never in `~/rippedpages` directly — that stays clean on `main`.

**Blocked on RippedPages PR #1.** The `page`-field infrastructure this part depends on is not
on `main` — it sits on `claudecleaner-page` as open PR #1. `main` and `music-madness-page`
are both at `16c9764`, which predates it. An earlier revision of this spec recorded that
infrastructure as already merged; `main` was subsequently rewound and the work moved onto a
PR branch.

Until PR #1 merges, `build-public.mjs` strips the `page` field, so the register row would
still open the live app in a new tab and the working paper would be unreachable from the
register. The manager session fast-forwards this branch to `main` after PR #1 lands; do not
merge `main` from this lane.

Delivery is a pull request against `main`, opened but never merged from here — Vercel
auto-deploys `main` to rippedpages.com, so merges are Russ's call via the manager session.
This branch is Music Madness's permanent lane; future updates are new PRs against the same
page.

## Files

```
<worktree>/
├── work/music-madness/index.html   NEW — the working paper; served at /work/music-madness/
├── inventory.full.json             EDIT — correct blurb, add `page`
└── data/projects.json              REGENERATED — never edited by hand
```

`index.html` (the register) is **not touched**. The `page`-field infrastructure it needs
already landed on `main`.

The design spec stays in the SpotifyMadness repo, where it already lives and where it also
covers Part 1. `.vercelignore` is deliberately left alone: the sibling `calendez` branch
already adds a `docs/` exclusion, and duplicating that change here would create a pointless
merge conflict.

## House conventions

Established by `work/claudecleaner/index.html` (merged) and `work/calendez/index.html`
(in flight), both of which this page follows exactly.

**Tokens are inlined per page, not shared.** Each working paper carries its own `<style>`
block opening with the house tokens under the comment
`/* RippedPages house tokens — kept identical to the register. */`, followed by a
`/* Plate tokens — the app's own palette, reproduced from source. */` block.

This supersedes the earlier decision to extract a shared `assets/paper.css`. The reasoning
that motivated extraction — that duplicated tokens will eventually drift — still holds, but
it is now a portfolio-wide concern across five in-flight working papers, not something to
resolve unilaterally from this branch. Raise it with the manager session instead.

The plate convention resolves the paper-versus-neon tension: an app's real palette is
legitimate *inside a numbered plate*, reproduced from source, while the surrounding page
stays in paper and ink. Music Madness's dark background and Spotify green belong in a plate.

**URL convention** is `work/<slug>/index.html`, served at `/work/<slug>/`.

**Register linkage:** `page` takes precedence over `url` in `index.html`, so a row with both
links to the working paper in the same tab (`→ read the file`), and the working paper links
out to the live app. Music Madness keeps its existing `url`.

## Page structure

Following the Calendez form:

- `<title>Music Madness — RippedPages</title>`, meta description, `og:type=article`,
  `theme-color: #e7e5db`, emoji favicon.
- Back link above the cover: `← RP-03 · back to the register`, href `/`.
  `RP-03` must match the number the register renders, which `index.html` derives from array
  position (`pad(i + 1)`). Music Madness is currently third in `inventory.full.json`. A
  static page cannot see that ordering, so if projects are reordered this must be updated by
  hand — note it in a comment beside the markup.
- Torn `.cover` header: kicker `Working paper · Web · 2026`, `<h1 class="wm">` with the name
  split by an `<em>` for the oxblood accent, tagline.
- Sections using `.reg-label` + `<h2 id="s-…">`:
  1. **The idea** — Spotify top 32 seeded into a March Madness bracket, 30-second previews
     on every matchup, you pick, a champion is crowned, result shareable as a card and link.
  2. **Plate I · the bracket** — the app's real dark/green palette reproduced in CSS, showing
     a region advancing. Plus `▶ Play the live demo` → `https://music-madness-ashen.vercel.app`.
  3. **The catch** — Spotify caps Developer Mode apps at 25 users; that is why this one
     cannot be public.
  4. **The prescription** — the prompt from Part 1, styled as a typed slip, with a copy
     button.
  5. **Assembly** — the three setup steps.
- Closing colophon grid with `<h3>` cells: Status · Shape · Platform · Filed, plus the repo
  link.

## Inventory edits

The current entry is factually wrong: it says "seed *tracks* into a bracket and let *votes*
crown a champion." The app seeds **artists**, and the user picks — there is no voting.

In `inventory.full.json`, for `slug: "music-madness"`:

```json
"blurb": "March Madness for your Spotify top artists — 32 seeded, previewed head-to-head, one champion. Clone it and run your own.",
"page": "/work/music-madness/"
```

`url` stays as-is. Then run `node scripts/build-public.mjs` to regenerate
`data/projects.json`.

## Known duplication

The prompt text exists in both `src/components/landing/PromptCard.tsx` and
`work/music-madness/index.html`, in two separate repositories. They must stay identical.
Each file carries a comment naming the other as its counterpart. This is accepted rather
than solved: the alternative is a shared build step across repos, which is disproportionate
for one block of text.

---

# Verification

**Vite app**
- `npm run build` — type check and production build clean.
- `npm test` — all tests pass, including the untouched `bracketStore.test.ts`.
- Manual: `/` renders the landing page; seven picks crown a champion; re-picking a
  Quarterfinal clears downstream; "Play the demo" enters demo mode at `/bracket`; `/login`
  still renders the original login page; `/shared/:id` still resolves.

**RippedPages**
- `node scripts/build-public.mjs` exits 0 with its leak assertion passing; confirm no
  `category`, `rainplan`, `repo`, `notes`, or `visibility` fields reach `data/projects.json`.
- `git diff main...HEAD --stat` touches only `work/music-madness/index.html`,
  `inventory.full.json`, and `data/projects.json`.
- Serve locally (`npx serve .`): the register renders, the Music Madness row shows the
  corrected blurb and navigates **in the same tab** to `/work/music-madness/` with the
  `→ read the file` affordance, the working paper renders in the paper aesthetic, and the
  copy button copies the prompt.
- Side-by-side against `/work/calendez/` and `/work/claudecleaner/`: the three pages read as
  the same publication.

# Open items

None. All decisions are settled:

- Mini-bracket uses 8 artists (seven picks).
- RippedPages tokens are **inlined per page**, matching the house convention set by
  ClaudeCleaner and Calendez. The earlier "extract a shared `paper.css`" decision is
  withdrawn — it became a portfolio-wide question once five working papers went in flight,
  and belongs to the manager session, not this branch.
- The app's own palette appears inside a numbered plate, not across the page.
- Delivery is a pull request.
