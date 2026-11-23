# Proposal

## Why

Seen in the app, the Star Destroyer at 1.35x scale (fitted to the old Model 3 image) looks too big; the owner prefers its first render, at the house drawing's true scale, parked inside the garage. R2D2's image is an older, drawn-larger render with the wrong wheels; it gets the same treatment as the Star Destroyer, so both current cars match each other and the house.

## What Changes

- **Tesla Star Destroyer at true scale:** `public/scene/star-destroyer.webp` re-rendered at 240 px/m with its rear-right corner at the first render's place, inside the door; its plug moves back to `[178.3, 590.7]`.
- **New R2D2 image:** `public/scene/model-y.webp` replaced by a render of a 2021 Model Y in Stealth Grey with 19" Gemini aero covers and a black interior, through the same camera, materials, scale and placement as the Star Destroyer; its plug moves to `[178.5, 580.7]`.
- **Credit:** a `## Credits` section in `README.md` for the Model Y mesh, which is CC BY 4.0.
- Tesla T.I.E. Fighter keeps `model-3.webp` unchanged; it is now larger than the two current cars, which shows only in replay of its days and for cars without their own image.

## Capabilities

### New Capabilities

### Modified Capabilities

None: each registered car still has its own image and cable; only the images and plug points change.

## Impact

- `public/scene/star-destroyer.webp`, `public/scene/model-y.webp` (replaced)
- `components/scene/layout.ts` (two plug points)
- `README.md` (credits)
- Render sources outside the repo: `Tesla App Assets/model3-render/` back to true scale, `Tesla App Assets/modely-render/` (new)
