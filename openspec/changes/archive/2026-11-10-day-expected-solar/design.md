# Design

## Context

See proposal.md for why and the delta specs for the behavior. What shapes the approach:

- `lib/forecast.ts` works out "Today by hour": one query sums each hour of the day's made Wh and forecast W/m² over the 30 days before today (joined on the hour's start instant, so clock-change nights need nothing), another reads today's forecast hours, and `byHour` multiplies, with no result under `FEWEST_DAYS` (7) scale days.
- `solar_forecast_hour` holds every hour from 2021-10-10, after the 2026-11-10 backfill; `energy_interval` every 5-minute interval.
- The Solar page is `/`, its day view `/?day=YYYY-MM-DD`, rendered on the server from `dayIntervals(day)` (`app/page.tsx`) and reloaded from `/api/intervals`. The Distribution page reads `/api/intervals` too.
- `components/solar/day-view.tsx` draws each view as a recharts `ComposedChart` over `minute` (0 to 1440): stacked `Area`s, a `Line` per flow's top edge, `DayDetails` as the tooltip. `viewChart` (`lib/solar/day-views.ts`) builds the rows and the value axis from the flows' stack extent.
- Mockups: https://claude.ai/artifact/MaxAvQSCGxK9tu9F27gtzE, drawn from production's April 3, 10 and 16, 2026. The owner chose option B: a smooth curve, the expected total beside Total Generated, and the Expected row in the details. The mockup's day navigation was approximate; the live day view's stays as it is.

## Goals / Non-Goals

**Goals:**
- One calculation of an hour's expected kWh for any day, shared by the forecast card and the day view.

**Non-Goals:**
- Expected lines on the Home, Vehicle, Powerwall or Grid views, the range chart, or the Patterns page.
- Day-ahead forecasts (anton's `ahead_*` columns): the line shows what the stored forecast for the day said, the short-range one.
- A link field in the Pushover alert; the URL in the message text is tried first (Risks).

## Decisions

### `expectedHours(day)` beside the card's queries

`lib/forecast.ts` gains `expectedHours(day)`: the card's hourly scale query with `day` in place of today, and that day's forecast hours (`solar_forecast_hour` from the day's local midnight to the next), multiplied as `byHour` does, returning `{ start, kwh }[]`, empty under `FEWEST_DAYS` scale days or with no forecast hour. The scale query's text becomes one constant both use, so the card and the day view can't drift apart; the card keeps its own today query, which also joins what each hour made.

Alternative: make the card call `expectedHours(today)` and join made separately. Less SQL, but it reshapes `ForecastData` and its tests for no change in behavior.

### The response carries the hours

`dayIntervals(day)` runs `expectedHours(day)` beside its other queries and returns them as `expected` (`start` as an ISO instant, `kwh`). The day view gets them with the rest of the day, server-rendered and on every reload, with no second request. The Distribution page ignores the field.

### Drawing the curve

For the Solar view only, the rows gain an `expected` value at each lit hour's middle (minute `h * 60 + 30`, in the site's wall time) and 0 at the first lit hour's start and the last one's end, adding a row where a minute has none; a `Line` with `type="monotone"` and `connectNulls` draws through them. Monotone cubic interpolation never overshoots between points, so a jagged hour-to-hour forecast (April 10, 2026) doesn't grow peaks or dips that aren't in it, which the mockup's curve did. The line is `var(--color-foreground)` at 0.9 opacity, 1.75 px, solid: it isn't a flow, so the flows' rule about dashes doesn't come into it. The Solar view's value axis takes the larger of the flows' extent and the expected peak, so a fault day's expected line isn't cut off.

Every row also carries `expected_hour`, its hour's expected kW, which `DayDetails` reads from the hovered row to add the Expected row after the flows; `expected` and `expected_hour` are kept out of the flows it lists.

The key, a 16 px line and "Expected from the forecast", sits under the chart, where the Solar view has nothing else.

### The headline figure

`DayView` takes `today`, from `DayPanel`, which already has it. The Solar view's Total Generated adds, in the muted mono beside its kWh, `of N kWh expected` and, before today, `(P%)`, `text-destructive` under 60%, the alert's threshold.

### The link in the check

`lib/checks.ts` keeps the site's address as one constant, and `peakCheck`'s failing lines for a day end with ` https://teslasolar.report/?day=<day>`. The route, `deploy/checks` and `deploy/pushover` pass the line through unchanged.

## Risks / Trade-offs

- [Pushover may not turn a URL into a link in a monospace message] → The rollout sends one test alert through `deploy/pushover` with a failing line; if the URL isn't tappable, a follow-up passes Pushover's `url` field instead.
- [Past hours hold the forecast as last fetched, close to a nowcast] → The line says what the sun should have given that day, which is what telling a fault from weather needs; it isn't a measure of forecast skill.
- [One more query batch per day view load] → The card's hourly queries answered in 13 to 17 ms on production; the branch run times the day view (task 4.2).
- [A clock-change day has 23 or 25 hours] → Hours are matched by their start instant and placed by their wall-clock minute; on the fall-back night the repeated 1 AM hour expects nothing, so no point is placed twice.

## Migration Plan

Release as usual (ask first). The deploy needs nothing else: no table, no timer. Rollback is the previous release.

## Results

A throwaway branch container on onyx against production, read-only, 2026-11-10:

- **The response:** `/api/intervals?date=2026-04-16` listed 24 expected hours adding up to 64.4 kWh, 11 AM at 7.84 kWh, as the spike found; `?date=2021-10-12` listed none.
- **Timing:** the day view of April 16, 2026, fetched with `Accept-Encoding: gzip` inside each container, took 0.13 s on the branch and 0.13 s on the live release; `/api/intervals` for the day answered in 0.05 s.
- **The page:** its server-rendered HTML read "of 64 kWh expected" with "(40%)" in `text-destructive`.

The screenshots (task 5.3) were taken from that container, a production build under the production CSP with production's April data, through an SSH tunnel and headless Chrome, instead of a local preview database loaded with the same data:

- **1280 pixels:** April 16 and April 10 match mockup B: the smooth expected curve over the flows (to about 8.6 kW over flows capped near 4.2 kW on the 16th), "25.7 kWh of 64 kWh expected (40%)" and "36.4 kWh of 43 kWh expected (84%)", the key under the chart, and pointing at 11:45 AM listing the flows then Expected 7.8 kW (6.5 kW on the 10th).
- **375 pixels:** the first run showed the figure wrapping inside the 4xl number's line, leaving "expected (84%)" on a line of its own at that height. The figure now takes a line of its own under the kWh at its own size on phones (`max-sm:block`, test first), as mockup B's phone board did; the rerun matched it.
- At both widths nothing scrolled sideways, and the console showed no error or CSP violation.

## Rollout

Released as v2026.11.10.9 on 2026-11-10. Its Deploy run passed, connected throughout; onyx kept the result 0 and runs the merge commit, and teslasolar.report answered 200.

- **The live site:** `/api/intervals?date=2026-04-16` listed 24 expected hours adding up to 64.4 kWh, and the April 16, 2026 day view served "of 64 kWh expected" with "(40%)" in `text-destructive`, and the "Expected from the forecast" key.
- **The alert's link:** one test alert went through `deploy/pushover` on onyx, titled "Test: daily checks failed: tesla-next", its message a failing solar peak line ending with `https://teslasolar.report/?day=2026-04-16`; Pushover answered 200. On the owner's phone the URL was a link in the monospace message, and tapping it opened April 16's day view. No follow-up with Pushover's `url` field is needed.
