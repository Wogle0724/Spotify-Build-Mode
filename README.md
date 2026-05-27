Adding Figma Files:
claude --resume 0e29be53-93d3-4ed2-8a2c-ec76d9c3fb45

Main UI Creation:
claude --resume 6357377a-0b64-4d10-b876-5a7b0b958368

Making Demo Videos:
claude --resume c88d5bd6-806c-41bf-af3f-4785c35b5cb9

# Spotify · Build Mode — Product Pitch Site

> **For future Claude sessions:** this README is the source of truth for project
> context, decisions, and conventions. Read it fully before making changes.

## What this is

An interactive **product-management pitch website** for **Build Mode**, a
*concept* Spotify feature (not a real Spotify product) that makes building
playlists dramatically faster. The site is the owner's PM proposal artifact — it
explains the idea and lets a reviewer actually *play* with a working demo
embedded in a faithful mock of the Spotify app.

The product is pitched for **both** Spotify clients:

- **Mobile** — add a song to a playlist with a single tap (or by voice). Designed
  to be usable hands-free, e.g. while driving.
- **Desktop** — multi-select songs across the catalog, then **submit** to add
  them all at once. *(Not built yet — see "Status".)*

## Status (read this first)

| Area | State |
| --- | --- |
| Project skeleton (palette, device frames, dummy apps, dummy data, landing page) | ✅ Done |
| **Mobile** Build Mode feature | ✅ Done |
| **Desktop** Build Mode feature (multi-select + submit) | ⛔ Not started — `DesktopApp` is still just the dummy app shell with a `children` slot waiting for it |
| Real audio playback | ❌ Intentionally omitted (see Constraints) |

## Tech stack

- **React 18 + TypeScript + Vite 6**.
- **No backend.** A dummy "database" of songs/playlists lives in `src/data/` and
  the whole thing deploys as static files (`base: './'` in `vite.config.ts`, so
  it works on GitHub Pages / Netlify / Vercel / any subpath).
- **No image assets.** All album/playlist art is a branded CSS gradient derived
  from a `color` field (see `Artwork`).
- **Styling = plain CSS files + CSS custom properties.** One `.css` file per
  component, all colors/radii/shadows defined as tokens in
  `src/styles/tokens.css`. **Not Tailwind** — see "Styling conventions".

## Commands

```bash
npm install
npm run dev      # local dev server (http://localhost:5173)
npm run build    # tsc --noEmit type-check, then vite build into dist/
npm run preview  # preview the production build
```

`npm run build` is the canonical "did I break anything" check — it type-checks
the whole `src` tree. Run it after edits.

## Project structure

```
src/
├── data/                       # dummy "backend" — edit catalog/playlists here
│   ├── songs.ts                # 32 songs, each with a `genre`
│   └── playlists.ts            # 2 starter playlists (genre-pure)
├── lib/
│   ├── buildMode.ts            # recommendation queue logic (the 3 modes)
│   ├── useSpeechCommands.ts    # Web Speech API hook for voice add/skip
│   ├── useMediaQuery.ts        # responsive landing (mobile vs desktop)
│   └── format.ts               # duration + artwork-gradient helpers
├── styles/tokens.css           # Spotify color palette — single source of truth
├── components/
│   ├── devices/                # resizable PhoneFrame + DesktopFrame chrome
│   ├── spotify-app/
│   │   ├── MobileApp.tsx        # dummy mobile app + hosts Build Mode
│   │   ├── DesktopApp.tsx       # dummy desktop app (no Build Mode yet)
│   │   └── build-mode/
│   │       ├── BuildMode.tsx    # the mobile Build Mode flow controller
│   │       └── AddSheet.tsx     # post-Add bottom sheet (5s auto-dismiss)
│   ├── common/Artwork.tsx       # gradient album/playlist art
│   ├── icons/index.tsx          # inline SVG icon set
│   └── DemoOverlay.tsx          # fullscreen interactive demo container
├── App.tsx                      # responsive landing page
└── main.tsx
```

## Core architecture idea: one app, any size

`PhoneFrame` (390×844 logical) and `DesktopFrame` (1200×760 logical) render their
children at a **fixed logical resolution** and CSS-`transform: scale()` the whole
frame to whatever pixel `width` the caller passes. The inner app never has to be
responsive. This is why the *same* `MobileApp` instance is reused at ~260–300px
in the landing previews and at full size in the interactive `DemoOverlay`.

The landing page (`App.tsx`) uses `useIsDesktop()` to switch layouts:
- **Mobile viewport:** one phone preview + a "Try it yourself" button.
- **Desktop viewport:** phone *and* desktop previews side by side, each with its
  own "Try it yourself" button. Each opens `DemoOverlay` for that platform.

## Data model (`src/data/`)

- **`songs.ts`** — `Song = { id, title, artist, album, durationMs, color, genre, explicit? }`.
  `genre` is `'classic-rock' | '2000s-hits' | '2010s-pop'` and is **metadata
  only** (used for labels / demo storytelling, *not* by the recommender).
  32 real-but-fictionally-arranged tracks (`s1`–`s32`):
  - `s1`–`s7` classic rock → seed playlist **p1**
  - `s8`–`s14` 2010s pop → seed playlist **p2**
  - `s15`–`s32` **discovery pool** — intentionally in *no* playlist (2000s hits
    + extra on-genre tracks). This is what "Songs you don't know" draws from.
- **`playlists.ts`** — 2 genre-pure starter playlists: `p1` "Classic Rock
  Essentials", `p2` "2010s Pop Throwbacks". Keeping the catalog split this way
  lets a presenter build a single-genre playlist and show off the accept/skip
  moment (most picks fit, some don't).

Artwork is never an image — it's `artworkGradient(color)`. Pick `color` from the
`--c-*` tokens in `tokens.css`.

## The Build Mode feature (mobile) — full spec as implemented

**Entry points** (both real, matching the pitch):
1. **Library → ＋** (the top-right ＋ in "Your Library", *and* the bottom-nav ＋)
   opens the **Create** sheet. Build Mode is the highlighted "New" row at the
   top, alongside Spotify's real Create options (Playlist, Collaborative
   playlist, Blend, Jam, AI playlist — the latter two marked Premium). Picking
   Build Mode **auto-creates an editable "New Playlist"** as the target.
2. **Open a playlist → ⋯ → Enter Build Mode** targets that existing playlist.

**Mode selection** — 3 cards backed by `buildRecommendationQueue()`:
- **Songs you know** — in your *other* playlists but not the target one.
- **Songs you don't know** — the discovery pool (in no playlist).
- **A mix of both** — the two interleaved.
Songs already in the target are always excluded.

**Building screen** has two sub-phases (same layout, only the controls swap —
deliberately so the transition isn't jarring):
- **`deciding`** — fresh recommendation playing; two **equal-size** big boxes:
  **Skip** (X) and **Add** (＋).
  - **Skip (X)** → discard, advance to the next recommendation (stays in
    deciding). *(Confirmed behavior: X does NOT exit Build Mode.)*
  - **Add (＋)** → adds the song to the target playlist and slides up the
    **AddSheet**.
- **`playing`** — after Add (or after the sheet dismisses), the **same song keeps
  playing** under the **normal Spotify transport UI** (shuffle / prev /
  play-pause / next, plus like + add-to-more). The **next** button advances to a
  new recommendation (back to `deciding`). *(Per owner feedback: Add must NOT
  skip the song; there is no separate "next pick" affordance — the standard next
  button is the skip.)*

**AddSheet** (post-Add bottom sheet): shows the song added to the target ("· new"
tag if freshly created), plus toggle rows for **Liked Songs** and every other
playlist so the user can pile it into more. **Auto-dismisses after 5s** of no
interaction (green countdown bar; any tap resets the timer). On dismiss → back to
`playing`.

**Voice mode** (`useSpeechCommands`): real **Web Speech API** (Chromium only).
Toggle the mic, then say "add"/"skip" (or "Spotify, add/skip"). In `deciding`,
add→Add, skip→Skip; in `playing`, skip→next, add→reopen AddSheet. If the API is
unsupported or the mic is blocked, the panel shows labeled **tap-to-simulate**
buttons so a recorded demo never breaks.

**Persistence:** `MobileApp` owns the mutable `playlists` + `liked` state, so
songs added in Build Mode actually appear in the library afterward. An empty
auto-created "New Playlist" is removed if the user exits without adding anything.

## Key product decisions (already settled — don't re-litigate without the owner)

- Stack: React + Vite + TS. Theme: Spotify **dark** (#121212/#000 + #1DB954).
- Demo = in-app animated/scripted using the real components (no video files).
- Voice: real Web Speech API **with** simulate fallback.
- X = skip to next recommendation (stay in Build Mode).
- Library-entry Build Mode auto-creates an editable "New Playlist".
- Add keeps the song playing and returns to the normal player UI (does not skip).
- Add and Skip buttons are the same size.
- Playlist detail screen matches Spotify mobile: centered cover, then
  **left-aligned** name / owner / stats, with a **download · share · ⋯** action
  row (and shuffle + green play on the right).

## Constraints / gotchas

- **No real audio.** "Playback" is a CSS-animated progress bar keyed to
  `durationMs`; it won't finish during a demo. Don't add audio without asking.
- **Voice needs Chrome/Chromium + mic permission**, and a secure context
  (localhost or HTTPS). It silently falls back to simulate buttons elsewhere.
- **`base: './'`** is required for static-host subpaths — keep it.
- TypeScript uses a single `tsconfig.json` (no project references); build is
  `tsc --noEmit && vite build`.

## Styling conventions

- Every color/radius/shadow/font comes from `src/styles/tokens.css` custom
  properties (`--green`, `--bg-base`, `--c-purple`, `--r-md`, …). Add new tokens
  there rather than hardcoding hex values.
- One plain `.css` file per component, imported at the top of the component.
  Class names are prefixed per area: `mapp-` (mobile app), `dapp-` (desktop app),
  `bm-` (build mode), `addsheet-`, `phone-`, `desktop-`, `demo-`.
- **Not using Tailwind.** The owner offered it; the existing token-driven CSS is
  already consistent and the outstanding work was targeted alignment fixes, so a
  full migration wasn't worth the churn. If you do migrate, do it wholesale and
  map `tokens.css` into the Tailwind theme.

## Likely next tasks

1. **Desktop Build Mode** — multi-select songs (checkbox/click to stage) then a
   "Submit" button that batch-adds. `DesktopApp` already accepts a `children`
   slot and the `DemoOverlay` desktop path is wired; the recommendation logic in
   `buildMode.ts` is platform-agnostic and reusable.
2. Ongoing mobile-mock alignment/styling polish.
