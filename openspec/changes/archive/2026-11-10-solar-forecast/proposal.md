# Proposal

## Why

The site looks back at what the panels made, but never ahead. A spike on 2026-11-10 compared a year of Open-Meteo's archived sunlight forecasts at the site with the panels' daily output: scaled by the last 30 days' output, the forecast lands within a median 12% (about 4 kWh) of the day's solar, and within 25% on three days in four. That is good enough to show what the next few days look like, and how today is going against what was expected. Coastal fog is its weak spot (27 of 73 poor days missed), so the page says so rather than hiding it.

## What Changes

- A **Solar forecast** card at the top of the Solar page's range view, above "Solar by date range", from mockup A at https://claude.ai/artifact/J2GadDStFVkHMXHZtbY6Vx (boards "A. Forecast strip on the Solar page" and "A on a phone"):
  - **Today:** the kWh expected, a bar of the kWh so far against it, the kWh so far and the day's sky.
  - **The next three days:** each day's expected kWh, a bar against a good day (the best of the last 30), and its sky as a label and an icon (Sunny, Partly cloudy, Cloudy, Fog likely, Rain, Thunderstorms, Snow).
  - A footnote saying how the figures are made and how far off they usually are.
- Expected kWh is the day's forecast sunlight times the panels' own kWh per unit of forecast sunlight over the last 30 days, so it follows the season, dirt and aging by itself.
- No timestamp normally; a "Forecast from <time>" note when the newest forecast is over 6 hours old, and "No forecast right now" in place of the days when there is none from the last day. Today's kWh so far shows either way.
- Today's figures update with the page's existing totals events; a new `GET /api/forecast` answers the card's data.
- The day's own view and the rest of the Solar page are unchanged.

Out of scope: a forecast curve on today's day view, more than three days ahead, an alert on a poor day, and showing how past forecasts did.

## Capabilities

### New Capabilities
- `solar-forecast`: the Solar page's forecast card, how expected kWh is worked out from the stored forecast, its freshness rules and the data route.

### Modified Capabilities
None. The card sits above the range view's existing content without changing any of its requirements.

## Impact

- **Depends on anton:** a companion change in anton-tesla-api-ws, `store-solar-forecast`, fetches Open-Meteo's daily forecast (sunlight total and weather code, today and three days ahead) every hour into a new `solar_forecast` table, and backfills the last 60 days from Open-Meteo's archived forecasts so the 30-day scaling works from the start. It deploys first.
- New in tesla-next: `lib/forecast.ts` (reads `solar_forecast` and `data`, works out the card), `app/api/forecast/route.ts`, `components/solar/forecast.tsx`, their tests, and the table in `test/schema.sql`.
- Changed: `app/page.tsx` and `components/solar/solar-page.tsx` (render and reload the card).
- No new dependency (the icons come from the installed `lucide-react`), env var or version pin.
