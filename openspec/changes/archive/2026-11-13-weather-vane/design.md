# Design

## Context

See proposal.md for why. The relevant parts as they are today:

- **Live weather** comes from anton's scheduler inside the live status, as the `Sky` fields in `lib/scene/weather.ts`. `components/scene/use-site-data.ts` maps them, and `useWalkedWeather` in `distribution.tsx` eases every field linearly over about 5 minutes. Wind arrives only as across-scene components (`wind`, `windLow`, `windMid`, `windHigh`).
- **Replay weather** comes from `GET /api/intervals` (`lib/intervals/intervals.ts`), which runs `SELECT *` over `weather_sample` and builds the same fields. `distribution.tsx` blends each field linearly between readings.
- **The scene's frame:** the rain and the clouds put east at the scene's right, the house's east side (`windAcross`). The star sky has its own mirrored mapping (south in the middle), which the vane does not use.
- **Motion helpers:** `reducedMotion()` in `components/scene/live-scene.tsx`. The scene's coordinates are the 2400 x 1166 frame in `components/scene/layout.ts`.
- **Anton's change** (in anton-tesla-api-ws, released on its own) adds `windSpeed`, `windGusts` and `windDirection` (km/h, km/h, degrees from) to the live weather, the `wind_gusts smallint` column to `weather_sample`, and gusts to its backfill.

## Goals / Non-Goals

**Goals:**
- A vane whose pose reads the compass direction unambiguously, including toward and away from the viewer.
- Strength shown by motion alone; numbers only on request.
- Works with or without anton's fields and column, so the two releases can go in either order.

**Non-Goals:**
- Changing the rain's slant or the clouds' drift; they keep using the across-scene winds.
- Gusts in the Backup page's weather labels.
- A vane on the Solar day view or anywhere but the Distribution scene.

## Decisions

### The raw wind rides the existing weather fields
`Sky` gains `windSpeed`, `windGusts` and `windDirection`, and `use-site-data.ts` and the replay readings carry them like the other fields. Missing fields already read as null throughout, which gives "No wind reading" before anton's release with no special case. *Alternative:* reading `weather_sample` here for the live view. Rejected in exploration: a second weather path with its own staleness rules.

### The vane turns along the house art's ground axes, in SVG
East is the scene's right, as for the rain, so north is away from the viewer and south toward them. The vane is SVG in the scene's stage units: a post, a ball finial, fixed N, E, S, W arms (as real vanes have) and an arrow with a tail fin. A compass direction maps to a screen direction along the art's own ground axes, measured from the house: east along the ridge, `(0.97, 0.24)`, and north up the right block's side, `(0.73, -0.68)`, foreshortened to 0.7. North tips up and right into the picture and south comes down toward the viewer, so the two never look alike. The arrow is drawn in its own vertical plane and posed with one affine `matrix(dx dy 0 1 x y)`, where `(dx, dy)` is that screen direction. An arrow pointing toward or away from the viewer collapses to a short sliver, as a real one seen end-on would. *Alternatives:* CSS `rotateX`/`rotateY` under `preserve-3d`, the plan before the mockups, which needs a tilt tuned by eye to approximate what the measured axes give directly; or sprite frames, which need an asset per angle.

Settled in the mockups (https://claude.ai/artifact/FmHStqr3VV8t3DKbyHzpg4, approved 2026-11-13): the foot on the main roof's hip apex, at stage `(1146.7, 141.3)` (the art's pixel 1720, 92 of 2400 x 1166), against open sky and clear of SOLAR and the car label; a 70-unit post, arms at 40, the arrow at 60; dark iron `#2a2d32` with a faint `#8b939d` rim; dimmed to 72% at night. After the branch check, the compass arms gained the same rim, and the letters, at 13 units, kept the iron `#2a2d32` with a light outline (`rgb(170 177 186 / 0.85)`, bolder than the rim), so they match the vane: plain iron vanished against the night sky, and plain light gray against a rainy overcast one.

### Motion runs in one animation frame loop, outside React state
A spring drives the direction: on a new target it moves along the shorter arc (the difference normalized to -180..180), damped so it overshoots once and settles within about 3 seconds. Around it a shake adds two incommensurate sines, so the wobble doesn't visibly repeat. Starting values, to tune by eye:

- amplitude `min(25, 0.5 * (gusts - speed) + 0.1 * speed)` degrees, 0 below 5 km/h;
- gusts default to `1.5 * speed` when missing;
- frequency about `0.3 + speed / 40` Hz.

That gives about 4 degrees for 30 km/h with 32 km/h gusts, and 18 degrees with 60 km/h gusts. The loop writes `transform` through a ref each frame, so React doesn't re-render 60 times a second; it is the only writer, so turning reduced motion on mid-shake can't leave the arrow off its direction. Under `reducedMotion()` it sets the pose straight to the target, with no shake. The shake's amplitude and pace ease toward each reading's with the clouds' `easeDrift`, and its phase accumulates frame by frame, so a new reading changes the shake without a jump. The amounts and the spring live as named constants in one place, as the clouds' paces do. Below 2 mph (3.2 km/h) the target isn't updated, which keeps the last direction.

### The vane's wind is not walked, and its direction is not blended linearly
Live, `useWalkedWeather` passes the vane's speed, gusts and direction straight through: the readout gives the latest reading rather than a figure partway between two, the spring and the eased shake already smooth the motion, and a linear walk from 350 to 10 would sweep the long way. In replay, the per-field blend uses a shorter-arc blend for `windDirection`, and keeps one side's gusts or direction when the other has none, since blended as numbers a missing gust reads as 0. That's one small helper, `turn(from, to, t)`, shared with the spring's normalization and unit tested across north.

### The readout uses the house Popover
The vane is a `button` (hit area at least 44 by 44 px) with an `aria-label` holding the readout text. It opens `components/ui/popover.tsx`, which already gives Escape, outside-click closing and focus return. The text comes from one pure function, `windText(speed, gusts, direction)`, which handles km/h to whole mph, the 8-point compass and the Calm and "No wind reading" cases, and is tested on the spec's figures. The popover follows the latest reading live, and the replayed time's blend in replay, so it updates while open.

### Replay readings read the stored values
`intervals.ts` adds `windSpeed: r.wind_speed`, `windGusts: r.wind_gusts ?? null` and `windDirection: r.wind_direction`. `SELECT *` means a database without the column yields `undefined`, which becomes null, so this app needs no migration. `test/schema.sql` gains the column, mirroring anton's migration, so the tests cover both a stored and a null gust.

## Risks / Trade-offs

- [A flat SVG vane looks pasted onto the rendered house] → mockups compare fill, outline and shading against the house art before code; the night dimming uses the same treatment as the house.
- [The vane crowds the solar label or the lines on the roof] → its spot is chosen in the mockups at desktop and phone widths, and the spec requires it to stay clear of labels and lines.
- [The tilt reads wrong, and north looks like south] → the fixed compass arms give the frame; mockups show all eight points.
- [Open-Meteo's gusts are modeled peaks, not measurements] → the readout says "gusts" with no claim of a station; the shake is the main signal.
- [A per-frame loop costs battery on phones] → one transform on a small element; no loop under reduced motion, and none while still (below 5 km/h, once the spring has settled).

## Migration Plan

1. This change can ship before anton's: the vane stands still and reads "No wind reading" until the fields arrive.
2. Anton's release adds the column and the live fields; its backfill fills gusts for past days. Nothing to run here.
3. Rollback: revert this change. Anton's added fields and column are ignored by the earlier code.

## Open Questions

- The vane's exact roof point, size and tilt angle: settled in the mockups, and none of them change the specs or the tasks.

## Results

Checked 2026-11-13 on a throwaway branch container on onyx reading production read-only, through an SSH tunnel, in headless Chromium at 1440 x 900 and 390 x 844 (3x screenshots). The production build drops the development weather overrides, so the directions were checked on replayed readings instead:

- **Live:** "29 mph, gusts 40 mph, from S"; anton's fields arrive.
- **North**, 2024-03-13 11 PM (20 km/h from 14°): the arrow tips up and right into the picture.
- **West**, 2026-11-01 1 AM (23 km/h from 265°): the arrow points left, side-on.
- **South**, the 2024-02-04 storm at 3 PM (45 km/h, gusts 104, from 177°): the arrow comes down toward the viewer and shakes hard; the readout says "28 mph, gusts 65 mph, from S".
- **Readout:** opens on a tap and on Enter with the vane focused; closes on Escape (after its 150 ms fade) and on a tap elsewhere; at 390 px it sits left of the vane, fully on screen, and the vane's tap target is 44 x 53 px.
- **Reduced motion:** the arrow holds one pose.
- **Night:** dimmed with the house; the compass letters are faint against the night sky.
- **Console:** no errors and no CSP violation, there and under `yarn build && yarn start` locally.

The Chrome used for the local check runs Dark Reader on localhost, which recolors the vane's dark iron to a light gray; headless Chromium shows the real colors.
