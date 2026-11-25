# Tasks

## 1. Images and mockups (before any scene code)

- [x] 1.1 Download both models from Sketchfab (owner, signed in) into `Tesla App Assets/death-star-render/source/` and `Tesla App Assets/star-destroyer-render/source/`; confirm each opens in Blender 5.3 headless and note its licence file.
- [x] 1.2 Write `Tesla App Assets/death-star-render/bake_map.py`: the Death Star's unlit base color (plus ambient occlusion if its detail is geometry only) baked onto an equirectangular UV sphere at 1024 x 512, dish near 30N facing Earth, mean brightness matched to `public/scene/moon-map.webp`. Verify the output opens at 1024 x 512 and the dish and trench sit where intended.
- [x] 1.3 Write `Tesla App Assets/star-destroyer-render/render_sprite.py`: seen from below and to the side, dim cool key light, blue-white engine emission, transparent background, about 4 times its shown width. Render two or three angle and light variants.
- [x] 1.4 Mockups at real size: the Death Star drawn through `projectMoon` and the phase mask as a crescent, a half and full, on the night sky at 48 px and 96 px; each ship variant over a night-sky crop with stars and the Death Star. Show them to the owner (`open -a Preview`) and get the picks: dish longitude, ship variant. (Picked: dish at -30 with its bowl darkened, tone 1 at 75% level and 60% contrast, the dark side's window lights, 80% sphere shading, ship a at full brightness and about 100 px long; spec and design updated to match.)
- [x] 1.5 Export the picks as `public/scene/death-star-map.webp`, `public/scene/death-star-map-lights.webp` (both 1024 x 512) and `public/scene/star-destroyer-sky.webp` (400 px wide, transparent); verify their sizes.

## 2. The Death Star in May

- [x] 2.1 Test first, `lib/scene/live-scene.test.ts`: `may` is false at 11:59 PM PDT April 30, true at midnight May 1 and at 11:59 PM May 31, false at midnight June 1 (site time). Run it and see it fail on the missing field.
- [x] 2.2 Add `may` to `sceneState` from `siteDate`. The test passes.
- [x] 2.3 Test first, `components/scene/moon-face.test.ts`: `useMoonFace` loads `death-star-map.webp` when asked for May and `moon-map.webp` otherwise, each map loaded once across switches. Run it and see it fail.
- [x] 2.4 Pass the month into `useMoonFace` from `<Moon>`, pick the map, and key the pixel cache by file. The test passes; existing moon-face tests still pass.
- [x] 2.5 Test first, `components/scene/moon-face.test.ts`: `sphereShade(phase, size)` is clear at the sunlit point and darkest (alpha 0.8) at and past the terminator; at full phase the center is clearer than the edge; at a half phase (0.25 and 0.75) the shading is the same, lit from the same side. Then `components/scene/live-scene.test.tsx`: in May `<Moon>` draws the lights image in the night group and the shading inside the lit group; outside May neither. Run them and see them fail.
- [x] 2.6 Add `sphereShade` and its memoized hook to `moon-face.ts`, and draw the lights and the shading in `<Moon>` in May. The tests pass.
- [x] 2.7 Credit the Death Star model in the README's Credits: title, author, Sketchfab link, CC BY-NC-SA 4.0, what was done to it (baked to a flat map), and that `death-star-map.webp` and `death-star-map-lights.webp` are shared under CC BY-NC-SA 4.0.

## 3. The Star Destroyer's passes

- [x] 3.1 Test first, `components/scene/live-scene.test.tsx` with fake timers: on a clear May night (sun 10 degrees down) a ship element appears within 5 seconds, after its pass ends another appears 3 to 5 minutes later; none on a June night, none with the sun 3 degrees down, none starts while a replay is paused or after the night ends, while one already crossing finishes, and the next night's first comes within seconds; none under reduced motion; it sits right after the cloud canvas and before the stage. Run it and see it fail.
- [x] 3.2 Add `SHIP` size to `layout.ts`, the `StarDestroyer` component in `live-scene.tsx` placed after the cloud canvas, and its 90-second pass animation in `scene.css` (direction and height from the component). The tests pass.
- [x] 3.3 Credit the Star Destroyer model in the README's Credits: title, author, Sketchfab link, Sketchfab Free Standard licence, and that it was rendered.

## 4. Verify

- [x] 4.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 4.2 `yarn build && yarn start` and replay a May night (2027-05-20 around 1 AM, and a crescent night): the Death Star shows with its phase, sphere shading and lights on its dark side, a ship crosses within seconds, also at 10 min/s, over the clouds and behind the Death Star, crescents are bright at their sunlit edge, and the production CSP shows no errors in the console. Replay an April night: the moon and no ship. Give the URL for the owner's hand check before pushing.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive death-star-in-may`, then open the PR.
