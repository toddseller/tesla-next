# Proposal

## Why

The Distribution scene shows wind only through the rain's slant and the clouds' drift, so a dry windy day looks calm. Both effects also show only the east-west part of the wind, so a strong north or south wind reads as no wind at all. A weather vane on the roof can turn to any direction, and its motion can show how strong and how gusty the wind is.

## What Changes

- **A weather vane on the roof**, always there, pointing into the wind from the latest reading. It turns to point toward or away from the viewer as well as left and right.
- **The vane shows the wind's strength:** it swings to each new direction and settles. In calm wind it holds nearly still; the stronger and gustier the wind, the more it shakes. Under reduced motion it turns to each new direction without swinging or shaking.
- **Tapping the vane shows the reading**, for example "18 mph, gusts 35 mph, from SW", in mph. Tapping elsewhere or pressing Escape closes it.
- **In replay the vane follows the replayed wind**, and the tap readout shows the replayed reading. Past days include gusts, which anton backfills.
- **The day's replay readings carry the wind's speed, gusts and direction** at 10 m, next to the across-scene winds they already carry.
- **Depends on anton-tesla-api-ws:** a change there adds `windSpeed`, `windGusts` and `windDirection` to the live status's weather, adds a `wind_gusts` column to `weather_sample`, and backfills gusts for past days. Until that change is released the vane stands still and its readout says there's no wind reading, so this change can ship before or after it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-weather`: adds the wind reading on the live data, the weather vane, how it moves, and its tap readout, live and in replay.
- `day-intervals`: each weather history reading also carries the wind's speed, gusts and direction at 10 m.

## Impact

- **Code:** the vane and its readout in `components/scene/` (the scene, `distribution.tsx` for the live and replay weather), the wind fields in `lib/scene/weather.ts` and `components/scene/use-site-data.ts`, the replay readings in `lib/intervals/intervals.ts`, and `test/schema.sql` for the new `wind_gusts` column.
- **Mockups:** the vane on the roof by day and night, calm and in strong wind, and the open readout at desktop and phone widths, before any code.
- **Data:** read-only as always. Before anton's release, `weather_sample` has no `wind_gusts` column and the live weather has no raw wind; both read as missing.
- **Dependencies:** none added.
