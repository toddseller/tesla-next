# Proposal

## Why

The cars are named for Star Wars ships, and May is Star Wars month (May the Fourth). For the whole of May the Distribution page's sky can play along: the moon becomes the Death Star, and now and then a Star Destroyer crosses the night sky. The rest of the year the sky stays real.

## What Changes

- Throughout May, by the date the scene shows (Pacific time, live and in replay), the moon's face is the Death Star. It is baked in Blender from a 3D model onto a flat map shaped like the moon's, so the moon's position, phase, soft terminator, earthshine, monthly rocking and turn in the sky all carry over unchanged. Unlike the moon, it is shaded as a sphere, and at night its dark side shows its window lights.
- On May nights a Star Destroyer, rendered in Blender from a 3D model, crosses the upper sky every few minutes the page is open. It flies over the clouds, so it shows whatever the weather, and behind the Death Star. A paused replay and reduced motion show no ship.
- Three new images in `public/scene/`: `death-star-map.webp`, `death-star-map-lights.webp` and `star-destroyer-sky.webp`. The models stay outside the repository.
- The README's Credits name both models, their authors and licences. The Death Star maps are adaptations of a CC BY-NC-SA 4.0 model, so those two images are shared under the same licence.
- The "Moon's face" scenario that replays the May 2027 full moon moves to the April 2027 full moon, which rocks the same way, since in May the face is the Death Star.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-weather`: "Moon's face" holds outside May and its May scenario moves to April; new requirements give the moon the Death Star's face, a sphere's shading and its lights in May; a new requirement adds the Star Destroyer's passes on May nights.

## Impact

- `components/scene/moon-face.ts`: picks the map by the shown date; the map cache keys by file; draws the sphere shading.
- `lib/scene/live-scene.ts`: the scene state says whether the shown date is in May.
- `components/scene/live-scene.tsx` and `scene.css`: the Death Star's lights and shading in `<Moon>`; the ship's layer, just above the stars canvas, and its pass.
- `components/scene/layout.ts`: the ship's size.
- `public/scene/`: the three images. `README.md`: Credits.
- Blender scripts in `Tesla App Assets/` (outside the repository), next to the car renders' scripts.
- No API, database or dependency changes.
