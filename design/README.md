# Figma design references

> **For future Claude sessions:** this is the source of truth for the Figma
> reference designs behind the Spotify mock. When you need to match a screen,
> pull it from Figma using the node IDs below — **don't invent UI** (see the
> project memory note "match real Spotify UI").

## The file

- **Name:** Spotify – Mobile UI Kit (Community)
- **File key:** `fWqUXqWj7KcjJhuVsqbiGX`
- **URL pattern:**
  `https://www.figma.com/design/fWqUXqWj7KcjJhuVsqbiGX/Spotify---Mobile-UI-Kit--Community-?node-id=<NODE>`
  where `<NODE>` uses a **hyphen** (e.g. `12-1946`).
- All screens are mobile frames, **428 × 926** (a couple are taller, noted below).

## How to pull a screen (Figma MCP)

The Figma MCP server is connected in this workspace. To bring a design into code:

1. **`get_screenshot`** — `fileKey` + `nodeId` → a PNG to match visually.
2. **`get_design_context`** — structured layout (hierarchy, auto-layout, sizes) +
   a screenshot. The main design-to-code tool.
3. **`get_variable_defs`** — exact design tokens (colors, type, radii, spacing).
   Map these into `src/styles/tokens.css` rather than hardcoding hex.

> **nodeId format:** the MCP tools take a **colon** id (`12:1946`); the browser
> URL uses a **hyphen** (`12-1946`). Both forms are listed in the table.
>
> ⚠️ **Rate limit:** this is on Figma's **Starter** plan — MCP tool calls are
> capped and run out fast. **Pull one screen at a time**, only when you're about
> to build it. Don't batch screenshots of many frames "to look around."

## Screens

`✅ verified` = visually confirmed in-session. `⚠️ inferred` = labeled from the
Figma layer name only; confirm with a screenshot before relying on it.

### Core — the mock surfaces (build/match these)

| Screen | Figma layer | nodeId (MCP) | url node-id | Status | Use in this project |
| --- | --- | --- | --- | --- | --- |
| **Home** | Home | `1:346` | `1-346` | ⚠️ inferred | `MobileApp` home tab |
| **Your Library** | Library | `107:3451` | `107-3451` | ⚠️ inferred | Library tab; the ＋ → Create-sheet entry point |
| **Now Playing (player)** | Track View | `12:1946` | `12-1946` | ⚠️ inferred | Build Mode `playing` transport UI |
| **Now Playing (variant)** | Track View | `202:1667` | `202-1667` | ✅ verified | Alt player: art, scrubber, shuffle/prev/play/next/repeat, Lyrics bar |
| **Track ⋯ menu** | Track | `49:1513` | `49-1513` | ✅ verified | Overflow menu (Add to playlist, Add to queue, Share…). **Where "Enter Build Mode" belongs.** Tall frame (428×1080) |
| **Search / Browse** | Search | `42:1795` | `42-1795` | ✅ verified | Search tab: search bar + genre/category tiles + bottom nav |
| **Playlist detail** | Playlist Search | `15:1273` | `15-1273` | ✅ verified | Playlist detail w/ cover, song list, "Find in playlist" + Sort, green play |

### Recommended next (likely useful, confirm with a screenshot)

| Screen | Figma layer | nodeId (MCP) | url node-id | Status | Why it might help |
| --- | --- | --- | --- | --- | --- |
| **Album / Playlist view** | Album View | `5:1634` | `5-1634` | ⚠️ inferred | Probable album/playlist detail — cross-check vs. `15:1273` for the detail layout |
| **Album + context menu** | Album Control | `156:1847` | `156-1847` | ⚠️ inferred | Album with overflow/context menu — the ⋯ → Enter Build Mode entry on a playlist |
| **Share sheet** | Song Share | `27:1356` | `27-1356` | ⚠️ inferred | Share bottom sheet (post-add pattern reference for `AddSheet`) |
| **Connect to device** | Listening on | `27:1596` | `27-1596` | ⚠️ inferred | "Listening on …" device picker — for the hands-free/driving story |
| **Album Radio** | Album Radio | `1:254` | `1-254` | ⚠️ inferred | Radio/recommendation surface |
| **Library (alt)** | User Library | `41:1557` | `41-1557` | ⚠️ inferred | Possible library variant; compare with `107:3451` |
| **Search (alt)** | Search | `1:223` | `1-223` | ⚠️ inferred | Second Search frame; compare with `42:1795` |
| **Settings** | Settings | `20:1292` | `20-1292` | ⚠️ inferred | Settings screen |

### Onboarding (probably not needed for the pitch demo)

Sign-up / first-run flow — only relevant if the pitch ever shows onboarding.

| Screen | nodeId (MCP) | url node-id |
| --- | --- | --- |
| Start (splash/login) | `1:180` | `1-180` |
| Signup 1–4 | `1:200`, `1:212`, `1:305`, `1:317` | `1-200`, `1-212`, `1-305`, `1-317` |
| Choose Artists | `1:329` | `1-329` |
| Choose Podcasts | `1:339` | `1-339` |
| Scanning for Spotify codes | `46:1604` | `46-1604` |

## Adding a new reference

When you discover/confirm another useful frame:
1. Add a row to the right table with its layer name, both nodeId forms, and status.
2. Flip a row from ⚠️ inferred → ✅ verified once you've screenshotted it and the
   label is correct.
3. Keep the **file key** and URL pattern at the top authoritative.
