# Design

## Context

See proposal.md for why and the delta spec for the behavior. What shapes the approach:

- The May Star Destroyer is the precedent (`StarDestroyer` in `components/scene/live-scene.tsx`, `.scene-ship` in `scene.css`): an `<img>` that exists only while a pass is crossing, scheduled on the page's clock (first pass after 2 to 5 s, the next 180 to 300 s after each ends, 90 s a pass), flying while `state.may && state.dusk === 0 && !paused && !still`, and finishing a pass already under way when it stops flying. Its tests fake timers and `Math.random`.
- The Christmas season flag (`christmasAt` in `lib/scene/live-scene.ts`) already counts a night by the site's date of the evening it starts (12 hours back).
- Layers in the scene element, back to front: day sky, stars, twilight, gray overcast sky, cloud canvas, ship, then the stage (moon, house, lights, rain, vane, labels). The sky above the roof's peak is about the top 28% of the scene element at desktop width; the car's label and Solar's label sit just below that line.
- Mockups and frames: the "Santa sleigh mockups" canvas (https://claude.ai/artifact/CCY5cd38X8N7NCF413Gvpx), boards Near, Far, Overcast, In motion and Phone. The approved frames come from the session's Blender script: model 6 imported from its GLB, Santa moved into the seat, a fourth pair and Rudolph duplicated from the front pair, each reindeer rigged and posed by a gallop table, the team tilted 8 degrees into a climb, EEVEE with a moon key light, a rim light and a transparent background.

## Goals / Non-Goals

**Goals:**
- The approved team, galloping, crossing the Christmas Eve sky at varied distances, never over the house or a label, with Rudolph's nose visible in any weather.
- The Star Destroyer's scheduling shared, not copied, and its behavior and tests unchanged.
- Frames that can be rebuilt from the model with one script.

**Non-Goals:**
- Real-time 3D in the browser: the frames are pre-rendered.
- Curved or swooping paths: each pass is a straight, slightly climbing line.
- Committing the model itself: the script takes the downloaded GLB's path.

## Decisions

### A Christmas Eve flag beside `christmas`

`christmasAt` already works out the evening's date; it is split so the evening date is computed once (`eveningAt(now)` returning `[year, month, day]`), and `sceneState` sets `christmasEve: month === 12 && day === 24` beside `christmas`. The pass flies while `state.christmasEve && state.dusk === 0 && !paused && !still`, the ship's condition with the flag swapped.

### One pass scheduler for both

The Star Destroyer's two effects and its count (first pass soon, the next after a wait, a pass always finishing, a fresh first pass after a grounded spell) move into a `usePasses(flying, pick)` hook that returns the current pass or null; `pick()` makes a pass, including its duration, so the hook ends each pass after `pass.seconds`. `StarDestroyer` keeps its own `pick` (`{ left, top, seconds: 90 }`) and markup, so its tests pass unchanged. `SantaSleigh` uses the same waits.

Alternative: a second copy of the scheduler. Two copies of the same timing rules would drift.

### Each pass's distance picks everything else

`pick()` draws a depth `d` from 0 (nearest) to 1 (farthest) and a direction, then:

| | near (d = 0) | far (d = 1) |
|---|---|---|
| width, share of the stage's | 0.33 | 0.10 |
| crossing | 35 s | 80 s |
| view | three-quarter while d < 0.4 | side-on from 0.4 |
| haze | none | `brightness(0.7) saturate(0.6)` |

Width, crossing and haze run linearly between. The top is drawn at random inside the sky band so the team's bottom stays above the band's lower edge: `SANTA.sky` in `layout.ts`, in stage units from the scene's top (`-HEADROOM`) down to 50, above the roof's peak (about 82). The pass climbs by `SANTA.climb` (10%) of its height as it crosses, so its top starts that far below the band's top; a far pass keeps to the band's upper part (its room shrinks by `0.6 * d`). The view's height follows from its frame's aspect. The values live in `layout.ts` as `SANTA`, beside `SHIP`.

### In front of the moon, faded by cloud rather than under it

The sleigh is a stage layer after the rain and before the vane and the labels: in front of the moon (the classic silhouette), the clouds and the rain, behind the roof's vane (which on a phone, kept at its minimum size, reaches up into the band) and the labels, and placed in stage units like the moon, so the band holds at every width. Since it isn't under the cloud canvas, cloud can't cover it; instead the team's image takes `opacity: 1 - 0.5 * cover`, about half under full cover, and Rudolph's glow, a separate element in the same moving box, keeps full opacity. Rain doesn't dim it further. The band keeps it off the house and labels.

Alternative: between the clouds and the stage like the ship. Then the moon would hide the team, and cloud could hide it entirely.

### The gallop as a sprite sheet

Each view is one WebP sprite sheet, eight frames stacked top to bottom: `public/scene/santa-side.webp` (frames 960 x 274) and `public/scene/santa-toward.webp` (frames 800 x 410), sized for the nearest pass at 2x on a 1440 desktop. The team is a `div` whose background is the sheet (the URLs in `scene.css` classes, so nothing new enters the CSP), stepped through by `animation: scene-gallop 0.68s steps(8) infinite` on `background-position`, inside a box that rises and falls by 2% of the team's height with the same period. Both run on the page's clock, so the stride keeps its pace in any replay. Each reindeer's offset in the stride and the right legs' lag are baked into the frames.

The crossing is like the ship's: a keyframe from 10% of the stage past one edge to 10% past the other, clear of the scene's side padding and Rudolph's glow, climbing by `SANTA.climb` of its height, its duration, start and climb set inline (the climb passed as `--santa-climb`, so the band's guarantee and the CSS can't drift apart); a pass to the left runs it in reverse with `scale: -1 1`, which mirrors the three-quarter view too, so the team still faces the viewer.

### Rudolph's glow

A radial gradient (`rgba(255, 90, 74, 0.95)` at the center to transparent), centered on Rudolph's nose: the nose's place in each view, as a share of the frame, from the script's render log, averaged over the stride: through it the nose moves by about 4% of the frame's height, a few pixels at the nearest pass, well inside the glow. Its diameter is 7% of the team's width. It is drawn only while a pass crosses, like the team.

### The Blender script

`scripts/santa/build-frames.py` is the session's script cleaned up: `blender -b --factory-startup --python scripts/santa/build-frames.py -- <model.glb> <out dir>` renders both views' eight frames and prints Rudolph's nose place; its header gives the ffmpeg and cwebp commands that crop, stack and encode the sheets. It isn't run in the build or tests (Blender isn't in the image), and nothing imports it. The gallop table lives in it as joint angles at eight points of the stride.

### Tests

`components/scene/images.test.ts` also checks each sheet is eight frames of its view's `aspect`, so a rebuilt sheet with a different crop can't throw the gallop's steps off their frames.


`lib/scene/live-scene.test.ts`: `christmasEve` true at 9 PM on 2026-12-24 and 3 AM on 2026-12-25, false at 9 PM on the 23rd and 25th, true at 9 PM on 2025-12-24. `components/scene/live-scene.test.tsx`, with faked timers and `Math.random` as for the ship: the first pass within 5 s and the next after the wait (with about a second's slack, as the ship's tests allow); sizes, durations and views at `d` = 0 and 1; the left flip; none on other nights, at dusk, or under reduced motion; finishing when paused or when the night ends; its place among the stage's layers; the team's opacity under full cover and the glow's at 1. The ship's tests stay as they are.

## Risks / Trade-offs

- [The sky band's lower edge is off on a phone, where labels sit closer] → `SANTA.sky` is checked by rendering the nearest pass at its lowest at 1440 and 390 px under `yarn build && yarn start`, and lowered if it touches the roof or a label.
- [Sheet sizes add download] → The sheets load only while a pass is crossing on Christmas Eve night; each stays under about 400 KB.
- [A mirrored three-quarter view puts Santa on the other side of the sleigh] → Acceptable for a mirror at that size; the alternative, a second render from the other side, doubles the assets.
- [Rudolph's glow drifts from his nose on a far pass] → Placed by share of the frame, so it scales with the team; checked on the near and far renders.

## Migration Plan

Release as usual (ask first). Before Christmas Eve, check by replaying 2025-12-24 at 9 PM, clear and under cloud. On the night, check teslasolar.report live after dusk.
