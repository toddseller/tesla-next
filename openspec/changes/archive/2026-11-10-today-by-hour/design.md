# Design

## Context

See proposal.md for why and specs/solar-forecast/spec.md for the behavior. What shapes the approach:

- `lib/forecast.ts`: `forecast(today)` reads the stored forecast, today's solar and the newest weather reading, and `forecastCard()` turns them into the card. `/api/forecast` and the page both serve `forecastCard`, and the card reloads on today's totals events (about every 5 minutes) and a reopened stream.
- anton's `solar_forecast_hour` holds one row per hour (`start_at` timestamptz PK, `radiation_wm2` real, `fetched_at`): the hour's mean forecast sunlight. Today's and the next three days' hours are refreshed hourly; past days were backfilled to 2026-09-11.
- `energy_interval` holds 5-minute intervals (`start_at`, `day`, `solar_generated_wh`). On 2026-11-10 at 19:29 UTC the newest started at 19:15, and today's intervals totalled 15.89 kWh against the daily 15.90.
- The range and day charts draw with recharts through `components/ui/chart.tsx` (`ChartContainer`, `ChartTooltip`), with `niceAxis` and `unitOnTopTick` for the kWh axis.

## Goals / Non-Goals

**Goals:**
- More queries in `forecast()`'s one batch, worked out in SQL, so the card's reload path stays as it is.

**Non-Goals:**
- Storing the hourly scale. It is a few hundred rows a request.
- Fixing up hours anton stores out of line. anton's `fix-forecast-hour-offset` did that at the source.

## Decisions

### The hourly scale and today's hours in SQL

`forecast(today)` adds three queries to its `Promise.all`, returned as `hourly`:

1. **The scale.** Each hour's made Wh (`energy_interval` summed by `date_trunc('hour', start_at)`) joined to `solar_forecast_hour` on `start_at`, for the 30 site days before today. Grouped by the hour of the day in the site's zone, it gives `wh / radiation_wm2` per hour of the day, and the count of distinct days with any joined hour.
2. **Today.** Today's forecast hours (site day), each with its made Wh so far (left join).
3. **The newest interval's end** today, the time the made kWh run to.

`forecastCard` then multiplies. An hour of the day absent from the scale, or with no sunlight in it, expects 0.

Joining on the hour's start keeps the two sources matched by instant, so hours on the night the clocks change need no handling. Alternative: one query per day, summed in JS. More rows over the wire for the same answer.

### The card's shape

`ForecastCard` gains `byHour: { hours: { start; expected; made }[]; byNow: { made; expected; at; over } | null } | null`, kWh throughout:
- `made` is null for hours with no interval yet.
- `byNow` is null before the first shown hour starts. `at` is the newest interval's end, and `over` is true after the last shown hour once the sun has set (`skyAt`): the forecast can end its sunlight an hour before the panels stop, as on 2026-11-10, when 4 PM had no forecast sunlight.
- `byHour` is null under the spec's conditions: no forecast hour today, or fewer than 7 scale days (the daily scale's `FEWEST_DAYS`).
- The shown hours are cut to the first and last with expected > 0 or made ≥ 0.05 kWh in `forecastCard`, so the component only draws.

### One bar with a drawn shape

A recharts `BarChart` with one `Bar` whose `dataKey` is the larger of expected and made, so the axis fits both. Its `shape` draws the faded rect (`fill-solar` at 25% opacity) to the expected height, the solid rect to the made height, and the tick (`fill-foreground`) where made > expected. The same `ChartTooltip` and axis helpers as the range chart give the hover and touch details and the kWh axis.

Alternative: two overlaid `Bar` series through a second, hidden x-axis. It needs a third series for the tick and fights recharts' bar spacing.

### The made-against-expected line

`byNow.made` is the sum of today's interval Wh, all hours included, and `byNow.expected` adds the expected kWh of the hours that ended by `at`, plus `(at - hour start) / 1 h` of the current hour's. The time shown is `byNow.at` in site time, so the line describes the same moment as the bars. After the last shown hour, the line reads "made today, against … expected".

## Risks / Trade-offs

- [The intervals lag 10 to 15 minutes] → The line names the interval's end, not the clock, and the current hour's bar is "so far". The today tile, from the daily total, can differ by a few hundredths.
- [Forecast hours misaligned by a future Open-Meteo change] → The design's alignment check (task 4.2) correlates sunlight against output at hour offsets; record it so a later shift is visible against it.
- [More SQL work per card load] → The scale and today's queries scan 31 days of 5-minute intervals (about 9,000 rows) using `energy_interval`'s `start_at` key, measured in task 4.2.

## Migration Plan

anton's `fix-forecast-hour-offset` deploys and re-backfills first. Then release this change and check the panel on teslasolar.report against the day's intervals. Rollback is the previous release.

anton's fix was deployed and re-backfilled on 2026-11-10. Checked read-only on production: sunlight and output correlate best with no offset on both PDT days (r 0.938, against 0.897 an hour early and 0.863 an hour late) and PST days (0.958), and `solar_forecast_hour` still holds 1,536 hours over 64 days.

## Results

A throwaway branch container on onyx against production, 2026-11-10 at 19:42 UTC (11:42 AM), a clear day:
- `byHour` showed 7 AM to 3 PM. 4 PM has no forecast sunlight today and has made nothing yet, so it is left out until it makes 0.05 kWh.
- The hours' expected kWh added up to 33.9, against the today tile's daily 34. Each scale comes from its own hour of the day, but the two agree.
- Recomputed by hand from production: 10 AM made 5,440 Wh over its 12 intervals (the card's 5.44), and its expected 5.32 kWh matches the card. 11 AM, under way, had 7 intervals and 3.34 kWh.
- `byNow` read 17.3 kWh made by 11:35 AM (the newest interval's end), against 15.9 expected. The morning ran ahead of the forecast, 7 to 10 AM each above their bars.
- Timing with `Accept-Encoding: gzip`: `/api/forecast` answered in 13 to 17 ms with the new queries, and the page in 0.22 s.
- Alignment: sunlight and output correlate best at no offset since anton's fix (Migration Plan).

`yarn build && yarn start` against the local preview database, loaded with production's forecast hours and 30 days of intervals (it gave the same hours and figures as onyx): screenshots of the card at 1280 and 375 pixels wide matched mockup B, with nothing scrolling sideways at either width. At 375 the legend wraps, the made-against-expected line takes two lines, and the hour labels thin to every other hour.

## Rollout

Released as v2026.11.10.6 on 2026-11-10. Its Deploy run passed, connected throughout; teslasolar.report answered 200, and onyx kept the result 0. At 11:58 AM the live page served Today by hour, and `/api/forecast` showed 7 AM to 3 PM:
- **Made, against production's intervals:** each started hour matched, 0.672, 3.32, 4.544, 5.44 and 4.776 kWh, with 11 AM under way. 6 AM's 8 Wh stayed below the 0.05 kWh line.
- **The line:** 18.8 kWh made by 11:50 AM (the newest interval's end), against 17.4 expected by now. The tile's daily total read 18.8 too.
