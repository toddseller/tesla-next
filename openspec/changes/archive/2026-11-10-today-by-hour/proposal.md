# Proposal

## Why

The forecast card says how much today should make, and how much it has, but not when it fell behind or got ahead. On 2026-11-08 the morning fog cost about 3 kWh between 7 and 10 AM, and noon made it back. Only an hour-by-hour view shows that. anton now stores the forecast's sunlight for every hour (`solar_forecast_hour`), so tesla-next can expect each hour's kWh the way it expects each day's.

## What Changes

- **Today by hour.** The forecast card gains a full-width panel under the four day tiles: one column per daylight hour of today. A faded bar shows the hour's expected kWh and a solid bar what it made, so a shortfall shows as the faded part above the solid one. The current hour fills toward its estimate as it goes. Where an hour beat its forecast, a tick marks the expected value. Hours still ahead show only their faded bar. This is mockup B on the forecast canvas, with the faded bar behind every hour.
- **Each hour's expected kWh** is its forecast sunlight times what that hour of the day made per unit of sunlight over the last 30 days. Scaling each hour on its own captures the panels' orientation and the shade at each time of day.
- **A line over the chart** compares what has been made against what was expected by the same time ("23.9 kWh made by 1:40 PM, against 26.5 expected by now").
- Pointing at or touching an hour shows its made and expected kWh.
- The panel reloads with the card and is left out when today has no hourly forecast or fewer than 7 days scale it.

Out of scope: hourly views for days other than today, and hourly forecasts for the days ahead.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `solar-forecast`: the card gains today's hourly panel and its data.

## Impact

- **Depends on anton:** `fix-forecast-hour-offset` (stored hours for PDT days are one hour early, because Open-Meteo answers with one fixed UTC offset) deploys and re-backfills first. Otherwise the hourly scale is off until the last PDT day leaves the 30 days on 2026-12-01.
- tesla-next: `lib/forecast.ts` (the hourly scale and today's hours), `components/solar/forecast.tsx` (the panel), their tests, and `solar_forecast_hour` in `test/schema.sql`.
- Mockups: "Today by hour" frames on the forecast canvas (https://claude.ai/artifact/J2GadDStFVkHMXHZtbY6Vx), B chosen.
- No new dependency, env var or version pin.
