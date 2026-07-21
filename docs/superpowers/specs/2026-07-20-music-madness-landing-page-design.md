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

## Files

```
/Users/russellfyfe/rippedpages/
├── music-madness/index.html   NEW — case study; Vercel serves it at /music-madness
├── assets/paper.css           NEW — shared tokens + paper/grid/crop frame
├── index.html                 EDIT — link paper.css; fix same-origin link target
├── inventory.full.json        EDIT — correct blurb, retarget url
└── data/projects.json         REGENERATED — never edited by hand
```

A directory with `index.html` gives the clean `/music-madness` URL under Vercel's static
serving with zero configuration, preserving the site's no-build-step property.

## Shared stylesheet extraction

Move into `assets/paper.css`: the `:root` token block, the `*` reset, `html`/`body` with the
paper-and-grid background, `.rp` container, and the `.crop` / `.reg` frame marks. Both pages
link it. Page-specific styles stay inline in their own file.

This is a mechanical move, not a rewrite. `index.html` must render identically before and
after — verify visually and confirm no token is left behind. Rationale: with two pages,
duplicated tokens guarantee eventual visual drift, which is the specific failure that would
most undermine a site whose appeal is reading as one coherent set of papers.

## Page content

Working Papers register throughout. No Spotify neon, no dark background — the page belongs
to RippedPages, and links out to the app for the real thing.

- **Header** — torn `.cover` block, kicker `RP-NN · Working paper`, title "Music Madness",
  tagline. Stamp variant consistent with the homepage.

  `NN` must match the number the register renders for this row, which `index.html` derives
  from array position (`pad(i + 1)`). Music Madness is currently third in
  `inventory.full.json`, so the kicker reads `RP-03`. This is a hardcoded value in a static
  file that cannot see the register's ordering — if projects are ever reordered, this number
  must be updated by hand. Note it in a comment beside the markup.
- **The brief** — Spotify top 32 seeded into a March Madness bracket, 30-second previews on
  every matchup, you pick, a champion is crowned, result shareable as a card and link.
- **The specimen** — a small bracket diagram drawn in oxblood ink on the grid (CSS/SVG, no
  image assets), plus `▶ Play the live demo` linking to `https://music-madness-ashen.vercel.app`.
- **The catch** — Spotify caps Developer Mode apps at 25 users; that is why this one cannot
  be public.
- **The prescription** — the prompt from Part 1, styled as a typed slip, with a copy button.
- **Assembly** — the three setup steps.
- **Colophon** — repo link, `← back to the register` to `/`.

Section headers reuse the existing `.reg-label` treatment (mono uppercase, 2px ink rule).

## Inventory edits

The current entry is factually wrong: it says "seed *tracks* into a bracket and let *votes*
crown a champion." The app seeds **artists**, and the user picks — there is no voting.

In `inventory.full.json`, for `slug: "music-madness"`:

```json
"blurb": "March Madness for your Spotify top artists — 32 seeded, previewed head-to-head, one champion. Clone it and run your own.",
"url": "https://rippedpages.com/music-madness"
```

Then run `node scripts/build-public.mjs` to regenerate `data/projects.json`. The row now
opens the case study, which hands off to the live demo.

## Same-origin link fix

`index.html:196` sets `target="_blank"` and `rel="noopener noreferrer"` on every row with a
`url`. Once a row points at a same-site page this produces a stray new tab. Set the new-tab
attributes only for external URLs; same-origin links navigate in place.

## Known duplication

The prompt text exists in both `src/components/landing/PromptCard.tsx` and
`music-madness/index.html`, in two separate repositories. They must stay identical. Each
file carries a comment naming the other as its counterpart. This is accepted rather than
solved: the alternative is a shared build step across repos, which is disproportionate for
one block of text.

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
- Serve locally (`npx serve .`): the register renders, the Music Madness row shows the
  corrected blurb and navigates in place to `/music-madness`, the case study renders in the
  paper aesthetic, the copy button copies the prompt, and the homepage is visually identical
  to before the stylesheet extraction.

# Open items

None. Both decisions raised during design are settled: the mini-bracket uses 8 artists
(seven picks), and RippedPages extracts a shared `paper.css` rather than duplicating styles.
