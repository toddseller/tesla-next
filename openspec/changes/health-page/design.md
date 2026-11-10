# Design

## Context

See proposal.md for why and specs/health-page/spec.md for what the page shows. What shapes the approach:

- `energy_interval` holds every 5-minute interval since 2021-10-10 (534,684 rows on 2026-11-10, all 5 minutes apart), with a `day` column in site time and indexes on `start_at` and `day`. Its house columns are `house_from_grid_wh`, `house_from_solar_wh` and `house_from_battery_wh`; the Powerwalls' are `battery_exported_wh` and `battery_imported_from_grid_wh` / `battery_imported_from_solar_wh`.
- The spike's two queries, run against production on 2026-11-10, took about 250 ms (always-on load by month) and 85 ms (Powerwall totals by year).
- Every page is rendered per request (the CSP nonce). Pages that update while open use a client component, `useReload` and `useLiveStream`; Top Ten is the nearest model, a server page that reads `lib/` directly.
- Database tests get a database of their own from `ownDatabase` in `test/true-up.ts` and seed `energy_interval` directly, as `lib/car-charging.db.test.ts` does.
- The mockups are boards "C. Same month each year, over the last 12 months" and "C on a phone" at https://claude.ai/artifact/LsqArUL5EjVFEeUu3wz5Y8.

## Goals / Non-Goals

**Goals:**
- The two sections as the spec describes, served in the first response, readable at 375 px, and no harder to read as years go by.

**Non-Goals:**
- Live updates. Both figures change at most once a day, after 5 AM; a reload shows the new night.
- A cache or warm-up. About a third of a second per visit doesn't justify one; `warm-caches` stays for the pages that needed it.
- An API route. Nothing on the client asks for these figures.
- Powerwall capacity, panel health and an alert (proposal, out of scope).

## Decisions

### Two queries in `lib/health.ts`, grouped in the database

`health()` runs two queries with `Promise.all`:

1. **Months.** Per `day`, the lowest `(house_from_grid_wh + house_from_solar_wh + house_from_battery_wh) * 12` and the count of intervals whose site-time hour is 1 to 4, kept with `HAVING count(*) >= 40`; then per month the median by `percentile_disc(0.5)`, which takes the lower middle on an even count, as the spec says. It returns `{ month: "YYYY-MM", watts }` for every month with a counted night.
2. **Years.** Per calendar year of `day`: `sum(battery_exported_wh)`, `sum(battery_imported_from_grid_wh + battery_imported_from_solar_wh)` and `min(day)`.

These are the spike's queries. Grouping in Postgres sends about 60 rows instead of half a million, and keeps the arithmetic that sets the figures in one readable place.

Alternative: fetch the night intervals and work out medians in TypeScript, as `lib/range.ts` does for its per-period scans. That copies 230,000 rows per visit for the same answer.

### Shaping is pure and tested apart from the database

`lib/health.ts` also exports pure functions that turn those rows into what the page shows, given today's site date:

- `latestFigures(months, today)`: the latest month, its label ("<Month> so far" or "<Month> <year>"), the same month a year earlier if it has one, and `Math.round((now - before) * 24 / 1000)` kWh a day.
- `sameMonth(months)`: the rows for the latest month's calendar month, oldest first.
- `lastTwelve(months)`: the latest month and 11 before it, each with its watts or none, and the year-earlier watts or none.
- `powerwallYears(years)`: kWh out, cycles `Math.round(kWh / 40.5)`, round trip `Math.round(100 * out / in)` or none when nothing went in, the first year's start day when it isn't January 1, plus totals since the first year (cycles of the total, not a sum of rounded cycles).

These take the spec's scenarios as unit tests without a database. The database tests only need to show the two queries produce the right months and years: the 40-interval rule, the 1 to 5 AM window in site time, the lower-middle median and the per-year sums.

### Server components only

`app/health/page.tsx` awaits `health()` and renders `components/health/health-page.tsx` and its two sections. Nothing on the page is interactive, so none of it is a client component and no chart library loads.

### The charts are plain elements, not Recharts

The bars in both always-on charts and the Powerwall rows are `div`s whose width or height is a percentage, styled with the design system's tokens (`bg-home`, `bg-powerwall`, `bg-muted`, `text-muted-foreground`), as the car-charging section's car bars already are. The year-earlier mark is an absolutely placed 3 px line inside each month's column.

Recharts would give the 12 bars an axis and tooltips, but it's a client component and needs `ChartContainer` to measure the page width. These charts have no interaction to justify that, and at 12 bars and a handful of rows they're simpler as markup.

### Scales

- The same-month rows share a scale from 0 to the larger of 1 kW and the largest row, so the bars are comparable and one very high month can't overflow.
- The 12-month bars and their marks share a scale from 0 to the larger of 1 kW and the largest bar or mark, labelled at 0, the middle and the top ("1 kW" at 1,000 W).
- The Powerwall bars are scaled to the largest year's kWh out.

### Assistive technology

The same-month rows and the Powerwall rows are tables (`role="table"` with row headers), as in the mockup. Each month column of the 12-month chart is a list item with a visually hidden label, "September 2026: 840 W, a year earlier 264 W", so a screen reader gets each figure without having to read the chart.

### Months and labels

Month arithmetic stays on `"YYYY-MM"` strings and `Date.UTC`, as `lib/top-ten.ts` and `lib/solar` do, so the server's time zone never shifts a month. Today comes from `siteToday()`. Desktop month labels are three letters ("Sep"); below the `sm` breakpoint they are one letter, as in the phone mockup.

### Navigation

`components/top-bar.tsx`'s `pages` list gains `{ name: "Health", href: "/health" }` last. The spec's "one line at 1512 px" scenario is checked in the browser after the change, since six links are about 90 px wider than five.

## Risks / Trade-offs

- [Two scans of `energy_interval` per visit, about a third of a second, growing by about 105,000 rows a year] → Acceptable for a page visited rarely. If it slows, the always-on months before this one can be kept on `globalThis` like the car-charging days; no spec change needed.
- [A night of metering zeros or an outage pulls a night's lowest to 0 W] → The month's median ignores a few such nights; the spike's data has a handful of 0 W lows and no month's median moved.
- [The fall-back night has 60 intervals and the spring-forward night 36] → The first counts (its lowest is still a real 5 minutes) and the second is dropped by the 40-interval rule.
- [The 40.5 kWh nameplate overstates usable capacity (backup-insights measured about 36 kWh)] → The spec defines a cycle against the rated size and the page says so; the cycle count is a warranty-style figure, not a measured one.
- [The always-on load includes anything that really runs all night, like a fridge's compressor or a pool pump] → That's the point of the figure; the footnote says what it measures.

## Results

A throwaway build of the branch on onyx (2026-11-10; its image's 1,395 tests passed), reading production read-only, removed afterwards:

- `/health` served in 0.42s, 0.40s and 0.38s over three loads.
- Always-on load: November so far 864 W, November 2025 276 W, +14 kWh a day; Novembers 2021 to 2026 at 132, 384, 264, 300, 276 and 864 W; the last 12 months as the spike found them, September to November 2026 at 840 to 864 W against 264 to 288 W a year earlier.
- Powerwall use: 2025 at 3,030 kWh, 75 cycles and 83%; 2026 so far at 4,416 kWh, 109 cycles and 86%; 20,716 kWh and 512 cycles since 2021. The mockup's 20,715 kWh and 511 cycles summed each year's rounded kWh; the page works from the total in Wh, 20,716 kWh, which is 511.5 cycles, so 512.

## Migration Plan

A normal release. After the deploy, open `/health` on teslasolar.report and compare the figures with the spike's (November 2026 864 W, November 2025 276 W, 2025's 3,030 kWh, 75 cycles, 83%), check it at 375 px and the top bar at 1512 px, and record the result in this design. Rollback is the previous release; nothing is stored.
