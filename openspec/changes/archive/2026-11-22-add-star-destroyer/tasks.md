# Tasks

## 1. Image and registration

- [x] 1.1 Copy `Tesla App Assets/model3-render/star-destroyer.webp` to `public/scene/star-destroyer.webp`
- [x] 1.2 Write failing tests: `images.test.ts` expects 16 scene images on the 2400 x 1166 frame, and "Tesla Star Destroyer" to get `star-destroyer` and its own cable and plug; `live-scene.test.tsx` adds Tesla Star Destroyer to the "shows its own image" cases and to the cable test (starts at the Wall Connector, ends at its own plug, plug differs from the others)
- [x] 1.3 Add `CAR_CABLES.starDestroyer = plugged([152.3, 619.9])` in `layout.ts` and the `CARS` entry in `images.ts`, updating its comment to name the car; run the whole suite

## 2. Check

- [x] 2.1 Look at the scene in the browser with Tesla Star Destroyer plugged in: the car sits in the garage and the cable reaches the taillight without crossing the car body
- [x] 2.2 Run the ponytail review on the diff in a fresh subagent and report its findings
