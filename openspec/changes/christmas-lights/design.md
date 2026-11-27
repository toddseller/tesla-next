# Design

## Context

See proposal.md for why and the delta spec for the behavior. What shapes the approach:

- The window lights are one layer, `nightLights`, shown at `opacity: dusk < 0.5 ? 0.75 : 0` with `.scene-lights` easing it over 0.15 s (`components/scene/live-scene.tsx`, `scene.css`). Its switch is the one the bulbs must share.
- The May flag (`may` in `lib/scene/live-scene.ts`) is the precedent for a date-bound scene: worked out from the shown time by the site's date, so replay and live agree.
- The scene's lines and the Powerwall bar are SVG layers on the stage (`viewBox 0 0 1600 930`, `STAGE`), written in stage units so they stay on the same spot at every size (`components/scene/layout.ts`).
- Stars twinkle by the page's clock, hold still in a paused replay and stop under reduced motion (scene-weather, "Twinkling").
- Mockups: "Christmas lights mockups" canvas, board B (`project/Bulbs-twinkle.dc.html`). Its places are in a 1280-pixel-wide desktop screenshot of the scene element, whose padding is 48 px across and 16 px down and whose stage scale is 0.74 (1184 / 1600), with the sky's 256 units above the stage.

## Goals / Non-Goals

**Goals:**
- Board B's 64 bulbs on the same spots of the house at every size, lit exactly when the windows are, on the season's nights.

**Non-Goals:**
- A new image asset: the bulbs are SVG, so their colors and twinkle stay in code.
- A setting to turn them off, or other holidays.

## Decisions

### One SVG layer of bulbs, on the windows' switch

A new stage SVG layer draws the bulbs: a `<symbol>` (socket `#3A4049`, tapered glass) placed by `<use>` at each point, filled red `#F0303A` or green `#18B04F` in turn, plus a blurred copy behind for the halo. The layer takes the same opacity expression and the `.scene-lights` class as the window lights, so the two switch together; it isn't under the house's shade or the clouds, so neither dims it.

Alternative: a rendered image like `night-lights.webp`. It would fix the colors and rule out the twinkle.

### The places, in stage units, from board B

Board B's points convert to stage units as `x = (sx - 48) / 0.74` and `y = (sy - 16) / 0.74 - 256`, and live in `layout.ts` as `CHRISTMAS_LIGHTS`, one list per run (garage front, garage east side, recess slope, recess eave, bay front, Powerwall side), each point the socket's top. A render check confirms the conversion: the vane's foot, `VANE.foot`, lands where the screenshot shows it, and each run hangs under its gutter as on the board.

### The season by the evening's date

`christmas(now)`: take the site's date of `now`, or of the day before when the site's time is before noon, so a night belongs to the evening it starts; it is in season when that date is from the Friday after the fourth Thursday of November through December 31, or is January 1. `sceneState` sets `christmas` beside `may`.

### Twinkle like the stars

Three CSS animation groups (2.6 s, offset by about a third of a cycle) dim each bulb to 30% and back. The animations pause with the scene's existing paused state and are off under `prefers-reduced-motion`, as the stars' twinkle is.

### A minimum size on a phone

The bulb symbol is about 15 stage units tall, 3 px at a 390 px phone's scale. Below the width where that falls under 6 px, the symbol scales up around its socket, as the vane keeps a minimum width (vane-min-width), so the bulbs still read as bulbs; their places stay on the gutters.

## Risks / Trade-offs

- [The conversion from the board's screenshot is off by a few units] → The render check compares each run with its gutter at 1440 and 390 px before the work is called done.
- [Bulbs over the scene's labels] → None sits under a label on the board; the check looks at phone width too, where labels sit closer.

## Migration Plan

Release as usual (ask first). On the first night after release, check teslasolar.report live after sunset, and replay last year's December 20 at 9 PM.
