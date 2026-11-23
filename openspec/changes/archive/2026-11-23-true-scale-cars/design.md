# Design

## Context

Car layers are 2400 x 1166 crops of the house's 4800 x 3584 frame (halved, from y = 622). Each car's cable is `plugged([x, y])` in `components/scene/layout.ts`, the plug at the top of the car's left taillight in render units (webp px / 1.5). The renders are made outside the repo, in `Tesla App Assets/model3-render/` and `Tesla App Assets/modely-render/`: Blender with an orthographic camera at the house's angles, then a composite into the garage.

## Goals / Non-Goals

**Goals:**
- Both current cars at the house drawing's true scale (240 px/m), parked the same way, rear-right ground corner at house (789, 2741), clipped to the door opening.
- R2D2 in its real configuration: Stealth Grey, 19" Gemini aero covers in the Model 3's dark grey, black interior.

**Non-Goals:**
- Re-rendering Tesla T.I.E. Fighter's `model-3.webp`.
- Credit anywhere on the site.

## Decisions

- **True scale over matching the old images.** The archived `add-star-destroyer` fitted the Star Destroyer to the old Model 3 (1.35x); seen in the app it reads too big. True scale keeps the two current cars consistent with each other and the house; the old Model 3 is the odd one out, only in replay.
- **One pipeline for both cars.** The Model Y uses the Model 3's camera, angle check, lighting, paint (solved to Tesla's Stealth Grey), shadow and composite, so the two read as one set. Its own parts: a CC BY 4.0 mesh ("2021 Tesla Model Y" by tonielpro520 on Sketchfab) whose matte materials are replaced; Gemini covers cut from Tesla's Model Y render and darkened channel by channel to the Model 3 cover's grey; its near-black tyre map stretched into a bump.
- **Plug points measured on the renders:** Star Destroyer `[178.3, 590.7]` (the first render's), R2D2 `[178.5, 580.7]` (higher, for the taller tail). The cable keeps the shared Wall Connector start.
- **Credit in the README,** which the CC BY licence accepts as a reasonable place, saying the mesh was modified.

## Risks / Trade-offs

- [The old Model 3 image is now larger than the current cars] → Seen only in replay of T.I.E. Fighter's days and for unnamed cars; acceptable.
- [The cable's curve was tuned for plugs near `[150, 600]`; both plugs are about 28 units right] → Check it on the page; the Star Destroyer's was checked at this point in `add-star-destroyer`'s first render.
