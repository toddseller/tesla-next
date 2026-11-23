# Proposal

## Why

The household's new leased Model 3 Highland, "Tesla Star Destroyer" (Stealth Grey, 18" Photon aero covers, RWD), is on the account and streamed, but tesla-next has no image for it. When it plugs in, the scene shows the garage closed, because only R2D2 and Tesla T.I.E. Fighter have their own images.

## What Changes

- Add `public/scene/star-destroyer.webp`: a Blender render of the car on the scene's 2400 x 1166 frame, parked in the open garage.
- Register it in `components/scene/images.ts` under the name "Tesla Star Destroyer", with its own charging cable and plug in `components/scene/layout.ts`, ending at the top of its left taillight.
- Keep Tesla T.I.E. Fighter's entry and `model-3.webp`: that car has left the account, but replay of its charging days still shows it, and the Model 3 stays the replay image for cars without their own.

## Capabilities

### New Capabilities

### Modified Capabilities
- `live-flow-scene`: Tesla Star Destroyer is a registered car with its own image and cable.

## Impact

- `public/scene/star-destroyer.webp` (new, about 19 KB)
- `components/scene/images.ts`, `components/scene/layout.ts`
- `components/scene/images.test.ts` (including the scene image count, 15 to 16), `components/scene/live-scene.test.tsx`
- No API, data or dependency changes; the backend already reports the car by this name.
