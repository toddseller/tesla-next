# Proposal

## Why

On 2026-11-10 the Solar forecast card read "Fog likely" for today while the sky had been clear since before sunrise and the panels were on track for the 34 kWh expected. Every 15-minute weather reading that morning was code 0, but the stored forecast's code was 45. That code is Open-Meteo's daily `weather_code`, the most severe weather of all 24 hours, so fog expected overnight labels a sunny day, today and on each day ahead. The expected kWh is unaffected (it comes from forecast sunlight); only the label misleads.

## What Changes

- **Today shows the sky now.** Today's tile reads the latest of anton's 15-minute weather readings when one is less than 3 hours old, as "Sunny now", "Cloudy now", "Fog now" and so on, and "Clear now" or "Partly cloudy now" after dark, with a moon icon. Without a recent reading it falls back to the forecast.
- **The forecast's label covers daylight only.** Each day's forecast label comes from the most severe weather between sunrise and sunset, which anton stores beside the daily code. A day without it (stored before the change) keeps the daily code.
- The days ahead keep the forecast wording ("Fog likely"); only today's current sky says "now".

Out of scope: an hour-by-hour sky on today's tile, and labels for days already past.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `solar-forecast`: today's tile shows the current sky, and a day's label follows its daylight weather.

## Impact

- **Depends on anton:** a companion change in anton-tesla-api-ws, `store-daylight-weather`, adds `daylight_code` to `solar_forecast`: the highest hourly WMO code between the day's sunrise and sunset, from the same hourly Open-Meteo request. It deploys first.
- tesla-next: `lib/forecast.ts` (the daylight code with the daily as fallback, and the latest weather reading), `components/solar/sky.ts` (the "now" and night wording), `components/solar/forecast.tsx`, their tests, and `daylight_code` in `test/schema.sql`.
- No new dependency (the moon icons are in the installed `lucide-react`), env var or version pin.
