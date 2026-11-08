# Design

## Context

See proposal.md for why. `/api/range` answers Flask's `/api/v2/formatted` shape: a daily item carries its ISO `day`, but a period item is only `{date: "Oct-25", solar, grid, house}`, so a period bar doesn't know which days it covers. `lib/range.ts` cuts the periods with `periods(start, end)`, a pure function, and answers one item per period in order, including periods with no saved days (all values null, so no bar is drawn). `lib/range.ts` imports the database pool, so a client component can't import it. `lib/solar/ranges.ts` already holds the Solar page's client-safe range helpers (`address`, `monthOf`, `isDaily`).

## Goals / Non-Goals

**Goals:**
- A period bar opens exactly the days Flask summed into it.

**Non-Goals:**
- Changing `/api/range` or its parity with Flask.
- A way back up other than the browser's history and the presets (decided while exploring: no link to the year, no new address parameter).

## Decisions

**The client cuts the periods itself.** `periods()` moves to `lib/solar/ranges.ts`, with its tests, and `lib/range.ts` imports it from there. The chart pairs the range's periods with its items by position, since `rangeTotals` answers one item per period in order. The alternative, adding `start` and `end` to each period item, would also pass `compare-range.mjs` (it compares only the page's fields), but it changes what the route answers to save a function call the client can make from the range it already has.

**The chart takes the range and reports what was clicked.** `RangeChart` gets the shown range alongside its items, and a period bar's click calls back with that period's range, as a daily bar's calls back with its day. `SolarPage` pushes `address(period)` with the router, as the presets do, so the browser's back button returns to the year (a push, unlike the day strip's `replace`).

**Bars and range stay in step.** The items come from `useReload` keyed by the range's address, so the bars the chart pairs with the range's periods are always that range's: a reload for an old range is dropped.

## Risks / Trade-offs

- [The client's periods drift from Flask's cut, so a bar opens the wrong span] → the server's sums use the same function, so a drift would show in the bars themselves and in `compare-range.mjs`; the moved tests keep Flask's cases (calendar months, 15th-to-14th periods, a partial first month, short months).
- [A period with no saved days shows no bar] → nothing to click, as today; its days are reachable from the presets or the picker.

## Migration Plan

Merging deploys nothing. After the release (published by you), the change is checked on next.teslasolar.report: from This year and True-up year a month opens its days, a day opens its 5-minute view, and back returns to the year. Rollback is the existing `tesla-next-next:previous` image.

## Results

- **Before the pull request (November 8, 2026):** locally under `yarn build && yarn start`, on a throwaway database seeded with every day from October 2025 to November 8, 2026 and one day of 5-minute intervals, the production CSP was in force (no `'unsafe-eval'`) with no console message. In Playwright's headless Chromium, True-up year showed 12 monthly bars with the subtitle "Monthly · select a month for its days" and October's details read "Click to see its days"; clicking October opened `/?start=2026-10-01&end=2026-10-31` with 31 daily bars, October 14 opened its day view, and back twice returned to the true-up year. From 2026-01-15 to 2026-06-14, the second bar opened 2026-02-15 to 2026-03-14 with its 28 days. The review's one finding, a future month with no figures offering a click that did nothing, was fixed test-first: a period without figures has nothing to open.
- **Release `v2026.11.08.5`** passed the gate and its Deploy run finished at 19:06 UTC.
- **On next.teslasolar.report (11:08 a.m. site time),** in headless Chromium: from This year, June 2026 read "Click to see its days" and opened `/?start=2026-06-01&end=2026-06-30` with its 30 daily bars, June 21 opened its day view, and back twice returned to `/?start=2026-01-01&end=2026-12-31`. From True-up year, October 2026 opened its 31 days, October 14 its day view, and back twice returned to the true-up year. December 2026, with no figures yet, showed no click hint and clicking it left the address as it was. No console message.
