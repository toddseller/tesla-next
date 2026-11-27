# Tasks

## 1. The frames

- [x] 1.1 Move the session's Blender script into `scripts/santa/build-frames.py` as design.md sets: it takes the GLB and an output directory, renders eight gallop frames of each view (side-on and three-quarter toward) and prints Rudolph's nose place per view; its header gives the ffmpeg and cwebp commands for the sheets
- [x] 1.2 Build `public/scene/santa-side.webp` (8 frames of 960 x 274) and `public/scene/santa-toward.webp` (8 frames of 800 x 410) with it; check each sheet's frames by eye against the In motion board and that each file stays under about 400 KB
- [x] 1.3 README's Credits: the CC BY 4.0 credit for ["Santa´s sleigh (WIP)"](https://sketchfab.com/3d-models/83d87df1b937482ba57792bac8830d9c) by [UlissesVinicios](https://sketchfab.com/UlissesVinicios), naming the two sheets and the modifications (Santa seated in the sleigh, the reindeer duplicated to eight plus Rudolph with a glowing nose, each reindeer rigged and posed through a gallop, the team tilted into a climb, its own lighting and camera), and how to rebuild them with the script

## 2. Christmas Eve

- [x] 2.1 Test first (`lib/scene/live-scene.test.ts`): `sceneState(...).christmasEve` is true at 9 PM on 2026-12-24, 3 AM on 2026-12-25 and 9 PM on 2025-12-24; false at 9 PM on 2026-12-23, 9 PM on 2026-12-25 and 11:59 AM on 2026-12-24 (still the 23rd's night; daylight is the pass's own check). See them fail, then split the evening's date out of `christmasAt` and set `christmasEve` beside `christmas`; the whole suite passes

## 3. The pass

- [x] 3.1 Move the Star Destroyer's scheduling into `usePasses(flying, pick)` in `components/scene/live-scene.tsx`, each pass carrying its `seconds`; the ship's tests pass unchanged
- [x] 3.2 Add `SANTA` to `components/scene/layout.ts` (near and far width, crossing, haze, the three-quarter cut-off, the sky band, each view's frame aspect and nose place)
- [x] 3.3 Test first (`components/scene/live-scene.test.tsx`, with timers and `Math.random` faked as for the ship): on Christmas Eve night the first pass comes within 5 s and the next 3 to 5 minutes after it ends; at `d` = 0 it is the three-quarter view at 0.33 of the width over 35 s, at `d` = 1 the side view at 0.10 over 80 s with the far haze; a low random draw flies it left; none at 9 PM on December 23 or 25, with the sun 3 degrees down, or under reduced motion; a pass finishes when the replay pauses or the night ends, none follows, and the next night's first comes within seconds; it is in front of the moon, the house and the rain and behind the vane and the labels; a pass at the band's top climbs no higher than it; under full cover the team's opacity is 0.5 and the glow's 1. See them fail, then add `SantaSleigh`; the whole suite passes
- [x] 3.4 Add the crossing, the gallop steps, the stride's rise and fall, the left flip and the glow to `components/scene/scene.css`, with the sheets' URLs in its classes

## 4. Verify

- [x] 4.1 The whole suite passes, `yarn build` passes, and `openspec validate santa-flyover --strict` passes
- [x] 4.2 In an onyx branch container reading production, under `yarn build && yarn start`'s CSP, with Playwright: replay 2025-12-24 at 9 PM at 1440 x 900 and 390 x 844 with the random draw pinned to the nearest pass at its lowest and to the farthest; confirm the team stays clear of the roof, the house and every label, Rudolph's glow sits on his nose, the gallop steps and nothing scrolls sideways; and a night under full cloud for the half-strength team and the full glow; give the URL for the manual check before any push
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first

## Workflow follow-up

- Record the `christmas-lights` and `christmas-lights-smaller` rollouts (their first live night, checked after sunset) on this branch as `Record the christmas-lights rollout`, and mention it in the PR.
- Commit the code, then archive the change (syncing the `scene-weather` delta) as `Archive santa-flyover`, then open the PR; release only when asked, before December 24, and check Christmas Eve night live as design.md's Migration Plan says.
