# Design

## Context

Car layers are 2400 x 1166 crops of the house's 4800 x 3584 frame (halved, from y = 622). Each car's cable is `plugged([x, y])` in `components/scene/layout.ts`, with the plug at the top of the car's left taillight, in render units (webp px / 1.5). The archived `true-scale-cars` change put R2D2 and the Star Destroyer through one Blender pipeline. Its scripts are in `Tesla App Assets/model3-render/` and `modely-render/`. This change adds `Tesla App Assets/tie-render/`, adapted from the Model Y scripts.

## Goals / Non-Goals

**Goals:**
- T.I.E. Fighter at true scale, parked like the other two: rear-right ground corner at house (789, 2741), clipped to the door opening.
- Its real configuration: Midnight Silver Metallic, 18" Aero covers, black trim and handles, black interior.

**Non-Goals:**
- Changing which cars have their own image, or the replay fallback rule.
- Credit anywhere on the site.

## Decisions

- **The mesh:** "Tesla 2018 Model 3" by Ameer Studio on Sketchfab, CC BY 4.0. It was the most detailed free original-body Model 3 found. The same mesh is also uploaded under other accounts, so its provenance is uncertain. The owner chose it anyway; the credit follows the licence file that ships with the download.
- **Fixes to the mesh, in the render script:**
  - Width scaled to 1.849 m; the mesh is about 5% wide. Length is exact; height is 1.409 m against 1.443 m.
  - Its one chrome material (window trim, handles, badges) is made satin black, and the two T emblems keep chrome.
  - All materials are capped at satin roughness, since the mesh ships them fully matte.
  - Every light the glTF marks emissive (taillights, reflectors, headlights, screen) is switched off, as on a parked car.
  - The taillight lens is clear glass over the textured lamps.
  - The licence plate is removed, since the other cars have none.
- **Aero covers** are cut from Tesla's configurator render of this exact spec (`$PMNG,$W38B,$IN3PB`), which is already dark grey, so it needs no tint.
- **Keep the file name `model-3.webp`.** Renaming it would touch `images.ts` and its test for no behaviour change.

## Risks / Trade-offs

- [The mesh's CC BY may not be the uploader's to give] → The owner accepted this. If it's ever challenged, the wintrez "Tesla M3 model" (CC BY, made in Blender) is the fallback mesh.
- [Paint colour is set by eye, not solved against Tesla's render] → The owner reviews it on the page.
- [The cable curve was tuned for plugs near `[150, 600]`] → Check it on the page, as for the other two.
