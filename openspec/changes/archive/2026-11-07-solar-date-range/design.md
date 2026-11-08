# Design

## Context

See proposal.md, Why. What anton-tesla-api-ws does today (at `9a61314`):

- **The page** is `tesla-api-frontend/client/src/pages/SolarChart.jsx`, with `components/RangePicker.jsx` (MUI), `ChartsHeader.jsx` and `DayView.jsx`, and `utils/rangeChart.js`, `dayViews.js` (283 lines), `chartStyle.js` and `ranges.js`. Their tests are about 860 lines; `dayViews.test.js` alone is 405. The range and the open day live in `contexts/ContextProvider.jsx`, which fetches `/api/v2/formatted` and `/api/v2/intervals` and refetches on `totals_updated`.
- **`/api/v2/formatted`** (`resources/data.py`, `DataFormattedList`) returns one item per saved day (`solar_json`) when the end is at most 31 days after the start, and otherwise `get_time_range_list`'s periods, with 4 queries per period. Its values come from the `data` table through hybrid properties: `grid_in`, `grid_out` and `house` switch to PG&E's meter readings (`meter_day`) on days before `METER_FIX_DATE` that have them, and `grid_out` adds the Powerwall's exports on VPP days (`effective_to_grid`).
- **tesla-next:**
  - `/api/intervals` and `dayIntervals(day)` already serve the day view's data, matching Flask.
  - `/api/live` sends `event: totals` with `{"date": ...}`, and `useSiteData` holds the only `EventSource`, with its reopen logic.
  - `lib/scene/replay.ts` has `FIRST_DAY`, `TIME_ZONE`, `siteToday` and `shiftDay`.
  - The replay bar uses the shadcn `Calendar` and `Popover`.
  - The flow color tokens in `app/globals.css` are used nowhere yet.
- **Mockups:** https://claude.ai/artifact/24hPuozeo6cFUjoKdo7dSe (range: month, true-up year, phone; day: desktop and phone, with the days strip).

## Goals / Non-Goals

**Goals:**
- The page does everything anton's does, except where the proposal changes it, with the look of the mockups.
- `/api/range` matches Flask's `/api/v2/formatted` for every range checked against it.

**Non-Goals:**
- Impact, True-Up and Top Ten pages, and true-up years from PG&E's meter reads (change 5 brings those). The True-up year preset is the calendar true-up year.
- Changing `/api/intervals` or anything Flask serves.

## Decisions

### The address drives the page; reloads go through the APIs

`app/page.tsx` reads `start`, `end` and `day`, validates them (falling back as the specs say), and renders on the server:
- the range's bars (`rangeTotals`);
- when a day is open, the day's data (`dayIntervals`) and the days strip's bars (`rangeTotals` over the strip's days).

A client component takes these as initial state. Navigation then goes through Next's router:
- a preset, the picker and the back control push a new range address;
- opening a day pushes;
- stepping days and the strip replace.

The server renders each navigation, and the router discards a navigation that a newer one overtakes.

A `totals` event (and a reopened stream) reloads data through the APIs instead: `/api/range` for the bars and the strip, `/api/intervals` for the open day. Each reload is guarded so only the latest request applies, as the replay fetch does, and a failed one leaves the state as it was.

`router.refresh()` was the alternative. It would re-render the whole page, and a database error during that render would replace the page with an error. That would break "failed reloads keep the shown data".

### `rangeTotals`: one query, Flask's periods

`lib/range.ts` ports `get_time_range_list`'s period cutting (with `next_month`) as a pure function, tested with anton's cases and the spec's scenarios. It also ports the hybrid properties as SQL expressions over `data` joined to `meter_day`. One `GROUP BY` over the periods replaces Flask's 4 queries per period.

It applies the same rounding as Flask:
- `round(…, 1)` is Python's round half to even, so it goes through `pyRound`;
- daily solar is the stored value, not rounded;
- labels are `%b %-d` for days and `%b-%y` for periods.

The page formats the labels it shows ("Oct 2025") from each item's period.

`app/api/range/route.ts` validates `start_date` and `end_date` like `/api/intervals` validates its date, with the window 2021-10-01 to `shiftDay(siteToday(), 732)`, and returns `{"data": rangeTotals(...)}`.

### Parity check: a sweep against the live API on onyx

`scripts/compare-range.mjs` reuses `firstDifference` from `compare-intervals.mjs`. It compares `date`, `day`, `solar`, `grid` and `house` from both APIs for:
- every calendar month since October 2021;
- every true-up year and calendar year;
- 31- and 32-day ranges;
- 15th-to-14th spans;
- ranges ending on the 28th to 31st;
- ranges before the first saved day.

It runs on onyx against both apps directly, to stay clear of Cloudflare's rate limit.

`test/schema.sql` gains `data` and `meter_day` (regenerated with `pg_dump --schema-only` on onyx), so `rangeTotals` is tested against the throwaway database with corrected, VPP and plain days.

### Charts: shadcn's chart component over Recharts

The charts use `components/ui/chart.tsx` (shadcn `ChartContainer` and `ChartTooltip`) and Recharts 3, pinned exactly. Colors come from the CSS tokens through `ChartConfig`.

**Range chart:**
- `BarChart` with `stackOffset="sign"`, so negative grid stacks below zero.
- A custom bar `shape` rounds only the outermost section at each end of a stack. A pure `stackEnds(bar)` decides which section gets which rounded corners, and it is tested.

**Day charts:**
- `AreaChart` with `stackOffset="sign"`, with no outline on the areas.
- Outlines are separate `Line` series of each flow's stack top. A pure `outlines(points)` sets a step to `null` where the flow is zero on both sides, which hides the line along zero, and it is tested.
- Gaps stay gaps (`connectNulls` off).

Found while checking the built page, and kept:
- **Stacking order:** Recharts 3 stacks areas in the order they were first registered, not the order they're written, so the day chart is remounted whenever its set of flows changes (the view, or vehicle data on or off).
- **Idle outlines:** a flow under 0.05 kW, the breakdowns' noise threshold, counts as idle and gets no outline, so a few watts of grid export don't draw gray over the band beneath.
- **Axes:** both charts widen their axis to whole steps of 1, 2 or 5 as Chart.js did. Recharts' own ticks landed on steps like 850, and a domain taken straight from the data showed "7.01 kW".
- **Recharts quirks:** a `Line` inside an `AreaChart` is ignored, so the day chart is a `ComposedChart`; the outline lines appear in the details popup whatever their `tooltipType`, so the popup leaves them out.
- **Labels:** Intl's `formatRange` spaces the dash differently in Node and Chrome, which broke hydration, so range labels are built by hand.

Chart.js was the alternative: it would let `dayViews.js` port unchanged. The user chose shadcn charts. Dropping the estimate markings removed the one per-segment style Recharts lacks.

### Porting `dayViews.js` and `ranges.js`

These move to `lib/solar/` in TypeScript.

Ported with anton's tests unchanged:
- `VIEWS`, the sections, `breakdown`, `viewSummary`, `symmetricLimit` and `hasBatteryHistory`;
- `ranges.js`'s helpers this page needs.

Rewritten, with new tests that check the same axis and stacking behavior:
- the Chart.js builders (`viewDatasets`, `viewOptions`, `chargeLevel*`) become Recharts data and props builders;
- the estimate pieces (`dashEstimated`, `ESTIMATED_DASH`, the `estimated` point flag, the two notes) are dropped.

The presets compute in the site's time zone from `siteToday()`. Ported comments follow the comment rule in the same pass.

### One live stream hook

The `EventSource` open and reopen logic (`REOPEN_MS`) moves out of `use-site-data.ts` into `components/use-live-stream.ts`, taking handlers for status, totals and reopen. Distribution's tests stay green unchanged, which shows the move kept its behavior. The Solar page uses the hook for `totals`, for the reopen, and for the "Last updated" time.

### Days strip and arrow keys

The strip's span is chosen by a pure function of the range and the day (the range when it is daily and contains the day, otherwise the day's month up to today), and it is tested.

The arrow keys are one `keydown` listener while the day view is open. It ignores events with modifier keys, from form fields, and from inside the calendar's popover.

### Colors

`app/globals.css`:
- `--color-solar`, `--color-home`, `--color-powerwall` and `--color-grid` take anton's day-view values;
- `--color-vehicle` is added;
- `--color-grid-fill` is removed, since filled areas use each flow's color translucently.

Nothing uses these tokens yet, so nothing else changes.

## Risks / Trade-offs

- [The hybrid properties hold rules the port could miss: meter corrections before `METER_FIX_DATE`, and VPP exports] → Port them from the model's SQL expressions, test each case against the throwaway database, and run the parity sweep before release.
- [Recharts measures its container in the browser, so charts render after hydration] → `ChartContainer` sizes from CSS. The server sends the data in the first response, and the chart draws on mount. Check `yarn build && yarn start` under the production CSP.
- [The arrow keys could clash with other keyboard use] → The listener ignores modified keys, form fields and the calendar, as the spec's scenario requires.
- [`/api/range` is a second read of Flask's numbers to keep in step] → It shares `rangeTotals` with the page, and it retires at cutover.

## Migration Plan

1. Merge, then publish a release when you choose. The deploy replaces the placeholder at next.teslasolar.report.
2. Run `scripts/compare-range.mjs` on onyx: zero mismatches before the release is called done.
3. Rollback: `tesla-next-next:previous`, as for any release.

teslasolar.report is untouched.

## Rollout (2026-11-07)

- **Before merging:** besides the chart findings above, the review found the car's band stacking out of place when stepping onto a day with vehicle data, and the charge level's details reading "kW". Both were fixed test-first. Locally under `yarn build && yarn start`, on a throwaway database seeded from the public pages' figures (copying production rows to the Mac was refused), there were no CSP violations or console errors, no sideways scroll at 375 (the page pinned to 375 inside a 500 pixel window, the narrowest it allows), 500, 844, 1280 and 1440 pixels, the arrow keys stepped days, and back returned to the range in one press. The strip now opens centered on the shown day on narrow screens.
- **Release `v2026.11.07.3`** passed the gate, rebuilt on onyx with its tests passing, and answered 200 at 03:18:53 UTC on 2026-11-08; the new container started at 03:18:49.
- **Parity:** `scripts/compare-range.mjs` found no mismatch over its 94 ranges against the deployed app, run on onyx against the apps directly, as it had against a build of the branch before merging.
- **Staying current:** with the current month open, `/api/range` reloaded at 03:20:30, 03:25:30 and 03:30:30, each 200, with no page reload. With today's day view open, its intervals and its strip reloaded at 03:35:30 and "Last updated at" moved from 7:31 to 7:36 PM.
- **Side by side with Flask:** October 14, 2026's five views on next.teslasolar.report showed the same headlines and breakdowns as Flask's totals for that day (Solar 44.4 kWh: Home 12.6, Vehicle 2.9, Powerwall 20.4, Grid 8.4; Home 31.0; Vehicle 3.1; Powerwall 18.5 discharged, 20.4 charged; Grid 0.1 imported, 8.5 exported, 8.4 net exported), with the car's band between Home and Powerwall. The range bars' figures are covered by the parity sweep.
