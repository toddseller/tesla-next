# Design

## Context

The moon's face is drawn by `projectMoon` (`components/scene/moon-face.ts`): it wraps `public/scene/moon-map.webp`, a 1024 x 512 flat map of surface brightness (longitude -180 to 180 across, north up, longitude 0 facing Earth), onto a sphere centered on the libration point. `<Moon>` in `live-scene.tsx` then masks it to the phase, adds earthshine and turns it by the moon's axis, mirrored like the sky. The map is loaded once into a single cached promise.

The sky's layers, bottom up: day sky, the stars canvas, twilight, the overcast gray, the cloud canvas, then the stage (moon, sun glow, house). Anything placed right after the cloud canvas shows over the overcast and the clouds, and sits under the moon.

The scene state (`lib/scene/live-scene.ts`) is computed from the shown time, and already formats the site's date for the cloud seed (`siteDate`). `dusk` is 0 once the sun is 6 degrees below the horizon. The frame loop and CSS animations run on wall-clock time; replay speed only changes the shown time.

The car renders were made in Blender from Sketchfab models, with their scripts in `Tesla App Assets/<name>-render/` outside the repository, credited in the README.

## Goals / Non-Goals

**Goals:**
- The Death Star goes through the moon's existing drawing path; `<Moon>` gains only its lights and its shading, both in May only.
- The ship costs nothing outside May nights: no timers, no element.

**Non-Goals:**
- Other ships (TIE fighters, X-wings), sounds, the superlaser firing.
- The Death Star or ships anywhere but the Distribution scene (the Solar page's night icon stays the moon).
- Changing the moon's light on the clouds in May.

## Decisions

- **The Death Star is a flat map, baked, not a rendered picture.** In Blender: the model ("Death Star - Star Wars" by Quiznos323, CC BY-NC-SA 4.0), its unlit base color times ambient occlusion, baked onto a UV sphere with equirectangular UVs at 2048 x 1024 and halved to 1024 x 512, the same layout as `moon-map.webp`. The station is only spun about its own axis, so the trench stays on the equator and the dish keeps its modeled latitude (20.5N); the mockups put it at longitude -30, which the scene's mirror shows upper right, as in the films. Its bowl is darkened toward its center (by half), since nothing lights it as a hollow. Its level is 75% of the moon map's mean and its panel contrast 60%, so it reads as gray steel rather than white (the owner's pick of two tones). Alternatives: the owner's icon used as the face directly (its baked shading fights the phase mask, it loses libration, its source is unknown), or a rendered sphere (same shading problem).
- **Its lights are a second map**, `death-star-map-lights.webp`: the model's own emission texture (window lights, a line along the trench), baked the same way at 4096 x 2048 and shrunk by the brightest of each 4 x 4, so single windows stay points instead of averaging away. `<Moon>` draws it, projected like the face, in the night group over the earthshine at full strength; the lit face covers it where the sun is, so it needs no mask of its own, and the night group's opacity fades it through twilight.
- **The sphere shading is drawn live, not baked**, because it follows the phase: a black layer inside the lit (masked) group, turned with the mask, its alpha `strength * (1 - min(1, 1.15 * lambert))`, where lambert is the cosine between each point's normal and the sun, the sun at `pi * |1 - 2 * phase|` from the viewer. Behind a crescent the sun lights no visible point head-on, so matte light left crescents nearly dark (the owner found them too dark); the shading's strength is scaled by the lit share of the disc, `0.8 * min(1, 1 - cos(2 * pi * phase))`, so thin crescents are shaded lightly and from half to full it is the picked 80%. Alternative tried: spreading the light over the crescent's own span, which still left a thin crescent mostly dim. A pure function in `moon-face.ts` draws it to a canvas, memoized by phase in steps of 0.005, so it redraws a few times a day. Alternative: an SVG radial gradient, which is exact only at full phase.
- **May is one flag in the scene state:** `may`, from `siteDate.format(now)`, so it follows the shown date in the site's zone like the cloud seed. `<Moon>` passes it to `useMoonFace`, which picks the map; the pixel cache becomes a map keyed by file, so switching months reloads nothing twice. Alternative: a separate date check in the component, which would read the viewer's zone instead of the site's.
- **The Star Destroyer is a rendered sprite.** In Blender: the model ("Star Wars; Imperial-Class Star Destroyer" by Heataker, Free Standard; its Tantive IV removed), seen 15 degrees from below and turned 20 degrees toward its stern, bow to the right, lit by a cool sun of strength 5 from below and ahead, engines as blue-white emission, on a transparent background, cropped, exported 400 px wide (twice its 2x width). Its lighting is baked in because nothing in the scene lights it. CSS flips it for passes to the left. The owner picked this angle and full brightness from three angles and two light levels.
- **Passes run on wall-clock time, not shown time.** A small `StarDestroyer` component in `live-scene.tsx` is active while `may`, `dusk === 0`, the replay isn't paused and motion isn't reduced. While active it waits a random 2 to 5 seconds, then starts a pass: one element with a 90-second CSS animation across the scene, a random direction and height in the upper sky, a slight slope. A timer of the pass's length ends it (jsdom can't fire `animationend`, and one constant sets both), then it waits a random 3 to 5 minutes and passes again. Going inactive starts no new pass but lets one under way finish, and the next night starts over with a quick first pass. The quick first pass and the finished crossing are for replay: a day's replay stops at midnight, and at 10 minutes a second a May evening lasts about 20 seconds, so a first wait of up to a minute, or a ship dropped on pause, meant the owner never saw one. Alternative: passes seeded by the shown hour, which in fast replay would flash past in a second and which a live visitor would rarely see.
- **Its place is right after the cloud canvas**, so it shows over the clouds and the moon covers it, as the spec asks, with no code for either. May nights here are mostly overcast (24 of 31 in May 2026), so under the clouds it was rarely seen; the owner chose to fly it over them, while the Death Star still dims under cloud like the moon.
- **Its size is a share of the scene's width** in `layout.ts`, next to `MOON`: 0.09, about 100 px on a desktop scene (the owner's pick; 0.04 was too small to see).
- **Credits:** both models in the README's Credits, as the cars are; the Death Star map's entry says it is shared under CC BY-NC-SA 4.0. The models and their exports stay in `Tesla App Assets/death-star-render/` and `star-destroyer-render/`.

## Risks / Trade-offs

- [CC BY-NC-SA: the site must stay non-commercial, and the map's licence differs from the rest of the repository] → Noted in the credit; the site has no ads or sales. If that changes, the map is replaced.
- [The Star Destroyer model is tagged `noai`] → The owner chose to go ahead; only a rendered image is committed, never the model.
- [The shading adds a second drawn layer to the moon] → Only in May, memoized by phase, a 128 px canvas.
- [Tests run in May would see the Death Star] → Scene tests pin their times; none use the real clock for the moon.
