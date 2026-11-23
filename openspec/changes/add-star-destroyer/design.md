# Design

## Context

Cars are matched to images by display name in `CARS` (`components/scene/images.ts`); each image carries a cable from `CAR_CABLES` (`components/scene/layout.ts`), built by `plugged([x, y])` from the plug point at the top of the car's left taillight, in render units. The image comes from the render work in `Tesla App Assets/model3-render/`: the car layer on the house's 4800 x 3584 frame, halved and cropped from y = 622 to the scene's 2400 x 1166 frame, like the other layers.

## Goals / Non-Goals

**Goals:**
- Tesla Star Destroyer shows in the open garage with its own image and cable, live and in replay.

**Non-Goals:**
- Removing Tesla T.I.E. Fighter or `model-3.webp`; changing the replay fallback for unnamed cars.
- Vehicle colors or any backend change.

## Decisions

- **A new image, not a replacement.** The new car is a different render (Highland body, different stance), so the old Model 3 image stays for T.I.E. Fighter's history and the fallback.
- **Same size and place as the old Model 3, not true scale.** At true scale for the house drawing (240 px/m) the car came out about 15 to 20% smaller than the old Model 3 and parked deep in the garage. The render is at 1.35x that (324 px/m), fitted to the old image's silhouette (96% overlap), with its rear standing out of the door like the old car's; only its shadow stops at the floor's edge.
- **Plug point `[152.3, 619.9]`.** The top of the left taillight on the render, mapped from the house frame (`(x, y - 622) / 2 / 1.5`); close to the old Model 3's `[153, 612]`. The cable keeps the shared Wall Connector start, so `plugged()` needs no change.
- **Key by display name** "Tesla Star Destroyer", as the vehicle table and live status report it.

## Risks / Trade-offs

- [Renaming the car in the Tesla app drops its image] → Same as the other cars; the entry is renamed with it.
