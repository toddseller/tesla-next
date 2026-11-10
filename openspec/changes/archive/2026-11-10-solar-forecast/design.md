# Design

## Context

See proposal.md for why and specs/solar-forecast/spec.md for the card. What shapes the approach:

- anton-tesla-api-ws is the writer. It already reads Open-Meteo every 15 minutes for the live scene's weather (`services/weather.py`, at `HOME_LOCATION` rounded to 2 decimals, else the public 37.5, -122.4), on an APScheduler job in `app.py`, and creates its tables from its SQLAlchemy models. tesla-next reads Postgres only, read-only (`lib/db.ts`).
- The spike behind this change (2026-11-10, read-only): Open-Meteo's archived daily `shortwave_radiation_sum` at the site against the panels' daily output from November 2025 to November 2026. With a scale of the previous 30 days' kWh over their forecast MJ/m², the median miss was 12% (4.2 kWh), 75% of days within 25%; fitting a factor per month instead did no better. Poor days (under half the month's 90th-percentile day): 46 caught, 27 missed, 29 false alarms, mostly fog.
- The Solar page (`app/page.tsx`) renders `SolarPage`, a client component that keeps the range's bars current with `useReload` and `useLiveStream`'s `totals` events. The day's own view is `DayPanel`.
- `data` holds one row per day whose `solar_generated` anton keeps current through the day; the range chart's daily solar comes from it.
- Mockups: "A. Forecast strip on the Solar page" and "A on a phone" at https://claude.ai/artifact/J2GadDStFVkHMXHZtbY6Vx.

## Goals / Non-Goals

**Goals:**
- The card as the spec describes, from a forecast anton stores, rendered with the page and kept current with today's totals.

**Non-Goals:**
- Fetching Open-Meteo from tesla-next. anton writes; tesla-next reads.
- Hourly forecasts or a curve on the day view; more than three days ahead.
- Scoring past forecasts. The stored same-day forecasts make that possible later; nothing shows it now.

## Decisions

### The table anton writes (contract with `store-solar-forecast`)

```
solar_forecast
  day          date         primary key   -- site date the forecast is for
  radiation_mj real         not null      -- Open-Meteo daily shortwave_radiation_sum, MJ/m²
  weather_code smallint     not null      -- Open-Meteo daily weather_code (WMO)
  fetched_at   timestamptz  not null      -- when anton fetched this row
```

anton fetches `daily=shortwave_radiation_sum,weather_code&forecast_days=4&timezone=America/Los_Angeles` every hour and upserts the four rows, so each day keeps its newest forecast. Once a day has passed, its row holds the last forecast made for it, which is what the scale needs. Its backfill fills the last 60 days from the historical-forecast API, with `fetched_at` at the end of each day. A failed fetch leaves the rows as they were.

One row per day rather than one per fetch keeps the table at about 365 rows a year and the reads trivial. Keeping every fetch would allow scoring forecasts by lead time, which nothing here needs.

### Expected kWh in one query

`forecast(today)` in `lib/forecast.ts` runs two queries together:

1. The scale and the good day: over `data` joined to `solar_forecast` on the day, for the 30 days before today with a `solar_generated` and a forecast, `sum(solar_generated) / sum(radiation_mj)`, `max(solar_generated)` and `count(*)`.
2. Today's and the next three days' rows from `solar_forecast`, and today's `data.solar_generated`.

The rest is pure: `forecastCard(rows, today, now)` turns them into today's tile, the three days, the good day and the freshness state, tested on the spec's scenarios without a database. The good day is the max over the same 30 days, so the bars and the scale come from the same days.

Alternative: the scale per calendar month, from a year of history. The spike found no gain, and it would need a year of stored forecasts first.

### Freshness

`forecastCard` takes `now` and the rows' newest `fetched_at`:

- More than 6 hours old: `staleSince` is that time, shown as "Forecast from 4:15 AM" in site time.
- No row for the days ahead fetched in the last 24 hours, or fewer than 7 days behind the scale: `days` is null, so the card shows "No forecast right now" and today shows only the kWh so far.

6 hours is several missed hourly fetches; 24 hours means anton has been down for a day, past which a forecast is no better than a guess.

### Labels and icons

`skyOf(code)` maps the WMO code to a label and a `lucide-react` icon (`Sun`, `CloudSun`, `Cloud`, `CloudFog`, `CloudRain`, `CloudSnow`, `CloudLightning`), defaulting to Cloudy. The icon is `aria-hidden`, since the label says the same. Open-Meteo's daily code is the most severe weather it expects, so a foggy morning reads Fog likely, which is the warning the owner wants.

### Rendering and reloads

`app/page.tsx` fetches `forecast(today)` alongside the range totals on the range view only, and passes it to `SolarPage`, which renders `components/solar/forecast.tsx` above the title row. `SolarPage` keeps it with its own `useReload` keyed on today, reloaded from `/api/forecast` in `reloadFor` when the date is today and on `onReopen`, as the bars are. The day's view doesn't fetch or render it.

The bars are plain elements in the solar color (`bg-solar`) on the card's track, as the Patterns page's bars are; no chart library.

## Risks / Trade-offs

- [anton's backfill hasn't run, or its fetch stops] → The card says "No forecast right now" and today shows its kWh so far; nothing errors. The table itself must exist, or the forecast query fails the Solar page's render: this change needs anton's `store-solar-forecast` deployed first, as it was (2026-11-10).
- [Fog: the forecast misses about a third of poor days] → The footnote says so, and the label is "Fog likely", not a promise.
- [The scale lags a sudden change, like a failed inverter or cleaned panels] → It catches up over 30 days; the weekly output check alerts on the first case.
- [A day with a metering gap pulls the scale down] → A day missing from `data` drops out of the sum; a partial day is one in 30.

## Results

- No-forecast state (found in the local build, folded into the spec): with no forecast for the days ahead, the card shows no "Forecast from" time, since a fetch over a day old would read as today's, and no footnote sentence about bars that aren't there.
- A throwaway build of the branch on onyx (2026-11-10; its image's 1,429 tests passed), reading production read-only, removed afterwards: `/api/forecast` gave today 34 kWh expected with 2.7 kWh so far at 8:47 AM, tomorrow 32, Thursday 24 and Friday 13, a good day of 45 kWh and no stale time, the same as working the spec's method by hand from production (scale 2.63 kWh per MJ/m² over 30 days). `/` served in 0.23s, then 0.03s.

## Migration Plan

anton's `store-solar-forecast` deploys first and its backfill runs; check `solar_forecast` holds 60 past days and the next four. Then release this change and check the card on teslasolar.report at 1280 and 375 pixels against the mockups, with today's kWh so far matching the range chart's bar for today; record it in this design. Rollback is the previous release; the table stays and is harmless.
