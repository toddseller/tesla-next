# Design

## Context

See proposal.md for why and specs/solar-forecast/spec.md for the behavior. What shapes the approach:

- `lib/forecast.ts` reads `solar_forecast` (one row per day: `radiation_mj`, `weather_code`, `fetched_at`) and today's solar, and `forecastCard()` turns them into the card; `components/solar/sky.ts`'s `skyOf(code)` gives a label and a `lucide-react` icon.
- anton writes a `weather_sample` row every 15 minutes from Open-Meteo's current weather, with its WMO `weather_code`; tesla-next already reads the table for the scene's replay and the backup history. The scene treats a reading over 3 hours old as no reading.
- `lib/scene/sun.ts`'s `skyAt(now)` says whether it is day or night at the site.
- On 2026-11-10 the readings from 3:45 to 9:30 AM were all code 0 while today's stored daily code was 45.

## Goals / Non-Goals

**Goals:**
- Today's label matches the sky; the forecast labels describe the hours the panels work.

**Non-Goals:**
- Using the airport's cloud or the cloud layers for the label, as the scene does for its sky. The label follows the reading's own code; the scene keeps its own rules.
- Changing expected kWh.

## Decisions

### The daylight code, with the daily code as fallback, in SQL

anton's `store-daylight-weather` adds `daylight_code smallint` (nullable) to `solar_forecast`. The forecast rows' query selects `coalesce(daylight_code, weather_code) AS weather_code`, so `ForecastRow`, `forecastCard` and the card don't change for it, and rows stored before anton's change keep their daily code.

Alternative: carry both codes to the card and choose there. Nothing else needs the daily code once a daylight code exists.

### The sky now

`forecast(today)` runs a third small query, the newest `weather_sample` row (`ORDER BY sampled_at DESC LIMIT 1`), and returns it as `reading: { code, sampled_at } | null` (not `now`, which `forecastCard` already takes as the time). `forecastCard(data, today, now)` puts it on today's tile when it is under 3 hours old: `today.code` becomes the reading's code and `today.sky` becomes `"now"` or `"night"` (from `skyAt`), or stays `"forecast"` without a recent reading. The 3 hours match the scene's rule, so the card and the scene agree on when a reading still stands for the sky.

### Wording

`skyOf(code, when = "forecast")`: `"forecast"` is today's mapping; `"now"` adds " now" and says Fog for 45 and 48; `"night"` is `"now"` with Clear (`Moon`) for 0 and Partly cloudy (`CloudMoon`) for 1 and 2. The days ahead always pass `"forecast"`.

### Staying current

The reading comes with the card's existing reloads (today's totals events, about every 5 minutes, and a reopened stream), which is often enough for a reading anton takes every 15 minutes. No new event.

## Risks / Trade-offs

- [Open-Meteo's "current" code is a model's, not an observation] → It was right on 2026-11-10 when the daily forecast was not; it is what the scene already shows.
- [Shipping before anton adds the column] → The rows' query names `daylight_code`, so the Solar page would fail to render. anton's change deploys first, as `store-solar-forecast` did.

## Migration Plan

anton's `store-daylight-weather` deploys first; check `solar_forecast` has `daylight_code` filled for today and the next three days. Then release this change and check the card on teslasolar.report: today reading "<sky> now", the days ahead from their daylight codes; record it here. Rollback is the previous release.

anton's `store-daylight-weather` was deployed and backfilled on 2026-11-10. Checked read-only on production at 18:55 UTC: `solar_forecast` has the nullable `daylight_code`, filled for 2026-11-10 to 11-13 (today 0 against a daily 45, then 3, 3 and 81) and empty for the days before; `solar_forecast_hour` holds 1,536 hours, 24 for each of the 64 days from 2026-09-11, the last four days fetched with the deploy. The newest `weather_sample` reading was code 0 at 18:45 UTC.

## Results

A throwaway branch container on onyx against production, 2026-11-10 at 19:04 UTC (11:04 AM): `/api/forecast` gave today code 0 with `sky` "now", and the page's today tile read "Sunny now", while today's daily code was 45. Tomorrow and Thursday read Cloudy from their daylight code 3 (Thursday's daily code 51 would have read Rain), and Friday Rain from 81. The first run mounted the password file at the wrong path, so its queries failed; the run above mounted it at `/run/secrets/pgpass`, as `docker-compose.yml` does.

At the archive, strict validation found "The sky" over 500 characters with the sky now in it, so its "now" wording became a requirement of its own, "The sky now", added beside it in the delta and the main spec.
