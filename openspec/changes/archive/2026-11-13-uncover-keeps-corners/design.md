# Design

## Context

`motion-uncover` (`app/motion.css`) animates `clip-path` from `inset(0 100% 0 0 round 4px)` to `inset(0 var(--hidden, 0%) 0 0 round 4px)`. Solar offset's fills (`components/impact/sections.tsx`) rest on an inline `clip-path: inset(0 <covered> 0 0 round 8px)`, matching their `rounded-md` (8px) track. When the animation ends, the inline clip takes over and the right end's radius jumps from 4px to 8px. The forecast card's bar (`components/solar/forecast.tsx`) rests on `round 4px` on a `rounded` (4px) bar, so it matches already. The other users of `motion-uncover` set no resting clip, so the animation simply ends with no clip.

## Goals / Non-Goals

**Goals:**
- The uncover's corner comes from the bar it uncovers, so each bar's motion ends at the shape it rests in.

**Non-Goals:**
- The left end, which the fill's own `border-radius` rounds and no clip changes.
- Bars without a resting clip-path: their uncover ends at no clip, with the element's own rounding showing throughout.

## Decisions

- **The keyframes read the radius from `--round`, defaulting to 4px**, as they already read `--hidden`. Solar offset's fills set `--round: 8px` and use `var(--round)` in their resting clip too, so one value sets both and they can't drift apart again. Forecast keeps the 4px default and needs no change.
  - *Resting clip at 4px on Impact:* one edit, but the fill's right end would round less than the 8px track behind it, trading a moment's jump for a lasting mismatch.
  - *Keyframes at 8px:* breaks the forecast bar the other way.
- **Tests pin the link, not pixels:** `app/motion.test.ts` checks both keyframes round by `var(--round, 4px)`; `components/impact/sections.test.tsx` checks each fill sets `--round` and its clip rounds by `var(--round)`. jsdom can't run the animation, so the visual check is in the browser.

## Risks / Trade-offs

- [The 4px default hides a mismatch on a future bar that rests rounder] → the site-motion requirement names the rule, and a new bar copying Impact's pattern sets `--round` beside `--hidden`.

## Results

Checked 2026-11-13 on a throwaway branch container on onyx reading production read-only, through an SSH tunnel, in headless Chromium at 1440 x 900 and 390 x 844 (3x screenshots), on the Impact page's Today (solar 8.0 kWh against 35.3 kWh home use, so the Solar bar fills 22.7% of its track). Each bar's uncover was replayed and paused 1 ms before its end:

- **Solar bar:** the uncover ends at `inset(0px 77.3% 0px 0px round 8px)`, the same as its resting clip; the screenshots 1 ms before the end and at rest are byte-identical at both widths. With `--round` removed, as before this change, the same moment shows the old `round 4px`, its right end visibly tighter than its left.
- **Home bar:** ends at `round 8px` against the track's own corner, as at rest.
- **Solar page's forecast bars:** uncover and rest at `round 4px`, as before.
- **Backup duration bars:** keep `motion-uncover`, whose fill holds the last frame, so they uncover and rest at the default `round 4px` over their 2px `rounded-xs`; no snap, as before.
- **Console:** no errors and no CSP violation.
