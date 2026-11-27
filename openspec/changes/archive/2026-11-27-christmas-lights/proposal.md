# Proposal

## Why

The house in the scene never gets Christmas lights, and neither does the real one. The scene already marks the calendar (the Death Star and Star Destroyers in May) and already switches the house's window lights at sunset, so a string of red and green bulbs along the roof, lit with the windows through the holidays, fits what it does.

## What Changes

- **Christmas bulbs along the roof's edges:** 64 classic bulbs (a small socket and a tapered glass bulb hanging straight down), alternating red and green, under six runs of the roof: the garage front, the garage's east side, the entry recess eave and the sloped edge beside it, the bay window front and the Powerwall side. Their places, shape, spacing and colors are the "Christmas lights mockups" canvas's board B (https://claude.ai/artifact/Xio71sYDzmTi371FsiWssp).
- **They twinkle:** each bulb fades gently and back in one of three staggered groups, as stars twinkle: at their own pace whatever the replay speed, still while a replay is paused, and steady for a viewer who prefers reduced motion.
- **Only at night, on the windows' switch:** the bulbs come on and go off with the house's window lights, below the horizon at sunset and above it at sunrise, never partly lit, and never dimmed by the house's darkening, cloud or fog.
- **Only in the season:** a night counts by the date of the evening it starts, from the evening of the Friday after Thanksgiving (the fourth Thursday of November) through the evening of January 1, so the last lit night ends at sunrise on January 2. Live and in replay, by the shown time at the site; Home's Now scene shows them too.

Out of scope: lights anywhere but the scene, any setting to turn them off, and other holidays.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `live-flow-scene`: the house wears Christmas lights on the season's nights.

## Impact

- **Code:** `lib/scene/live-scene.ts` (the season flag beside `may`), `components/scene/layout.ts` (the bulbs' places in stage coordinates), `components/scene/live-scene.tsx` (the bulbs, on the windows' switch), `components/scene/scene.css` (the twinkle and its reduced-motion and paused rules), and their tests.
- **No data, API or asset changes:** the bulbs are drawn in the scene's SVG.
