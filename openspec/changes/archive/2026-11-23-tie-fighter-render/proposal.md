# Proposal

## Why

Tesla T.I.E. Fighter's `model-3.webp` is the old drawn image. Since `true-scale-cars` it is larger than R2D2 and the Star Destroyer and doesn't match their renders. It also isn't the car as it was: wrong wheels, chrome trim. Re-rendering it through the same pipeline makes all three cars one set.

## What Changes

- **New T.I.E. Fighter image:** `public/scene/model-3.webp` is replaced by a render of an original (2017 to 2023) Model 3 in Midnight Silver Metallic, with 18" Aero covers, black window trim and door handles, and a black interior. It uses the same camera, materials, true scale (240 px/m) and garage placement as the other two cars. The file name stays, so the replay fallback for cars without their own image gets the true-scale car too.
- **New plug point:** T.I.E. Fighter's plug moves from `[153, 612]` to the top of the new render's left taillight, measured during apply.
- **Credit:** the README's `## Credits` gains the Model 3 mesh, which is CC BY 4.0.

## Capabilities

### New Capabilities

### Modified Capabilities

None: T.I.E. Fighter still has its own image and cable, and the replay fallback still uses it; only the image and plug point change.

## Impact

- `public/scene/model-3.webp` (replaced)
- `components/scene/layout.ts` (one plug point)
- `components/scene/live-scene.test.tsx` (the plug test gains T.I.E. Fighter)
- `README.md` (credits)
- Render sources outside the repo: `Tesla App Assets/tie-render/` (new)
