# Tasks

Code tasks are test-first: write or port the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Ported modules keep anton's logic and test values unchanged except where the specs drop estimate markings, and their comments are swept under the comment rule in the same task. Tasks marked **(owner)** are done by you; I check each where I can.

## 1. Range totals and `/api/range`

- [x] 1.1 Regenerate `test/schema.sql` on onyx with `data` and `meter_day` added (`pg_dump --schema-only`, header comment updated); the existing database tests stay green
- [x] 1.2 Port the period cutting (`get_time_range_list`'s loop and `next_month`) as a pure function in `lib/range.ts`, test-first with anton's cases and the spec's scenarios (calendar months, 15th-to-14th, ranges ending on the 28th to 31st, a 31- and a 32-day range)
- [x] 1.3 `rangeTotals(start, end)` against the throwaway database, test-first: daily items (`date`, `day`, unrounded solar, grid and house rounded half to even), periods summed in one query, days without totals left out, meter-corrected days before `METER_FIX_DATE`, VPP days, an empty range
- [x] 1.4 `app/api/range/route.ts` test-first: 200 with `{"data": [...]}`, 400 with a message for a missing or malformed date and for dates outside 2021-10-01 to 732 days after today (naming the bound), no query on a 400
- [x] 1.5 `scripts/compare-range.mjs` reusing `firstDifference`, with a test of its sweep's ranges and of a mismatch report; run it on onyx against both apps directly and get zero mismatches before the page work builds on `rangeTotals`

## 2. Shared pieces

- [x] 2.1 Move the `EventSource` open and reopen logic from `use-site-data.ts` into `components/use-live-stream.ts` (status, totals and reopen handlers), test-first for the hook; Distribution's existing tests pass unchanged
- [x] 2.2 Add shadcn's `chart` component and Recharts under Node 24, pinned exactly with a frozen lockfile; README's versions updated; a smoke test renders a `ChartContainer` in jsdom
- [x] 2.3 Flow tokens in `app/globals.css` (solar, home, Powerwall, grid to anton's day-view colors; `--color-vehicle` added; `--color-grid-fill` removed), checked by a test that reads the stylesheet's values

## 3. Range view

- [x] 3.1 Port `ranges.js`'s helpers this page needs to `lib/solar/ranges.ts` with anton's tests; the address parsing and fallback (missing, malformed, out of window, start after end) and the presets (This month, This year, True-up year) in the site's time zone, test-first with the spec's scenarios including New York at 1 AM
- [x] 3.2 `stackEnds` (which section of a bar rounds which corners), test-first for a positive-only bar, a bar with grid below zero, and a bar with one section
- [x] 3.3 The range chart component (stacked bars, rounded ends, labels, legend, note, kWh axis, details on point and tap, a click on a daily bar opening its day, monthly bars inert), test-first with Testing Library against the October 2026 and true-up year data from the mockups
- [x] 3.4 The range controls (presets with the selected one marked, the date-range picker limited to 2021-10-10 through two years from today), test-first: each pushes the right address
- [x] 3.5 `app/page.tsx` renders the range from the address on the server, replacing the placeholder; test-first that the served HTML has the bars' values for a given range and falls back to the current month
- [x] 3.6 Reloads on `totals` events in the range and on a reopened stream that covers today, through `/api/range`, with only the latest request applied and a failed one keeping the bars, test-first

## 4. Day view

- [x] 4.1 Port `dayViews.js` to `lib/solar/day-views.ts`: `VIEWS`, sections, `breakdown`, `viewSummary`, `symmetricLimit`, `hasBatteryHistory` with anton's tests unchanged; the Chart.js builders rewritten as Recharts data and axis builders with tests for the same stacking and axis ranges; the estimate pieces dropped
- [x] 4.2 `outlines` (each flow's stack-top line, hidden where the flow is zero on both sides, gaps kept), test-first with the Solar view overnight and a gap
- [x] 4.3 The day view component (selector opening on Solar, headlines, area charts, charge level with its no-history note, breakdowns with dashes under 0.05 kWh, the Grid view's net line, the Vehicle view's no-data note, the wide-screen two columns), porting `DayView.test.jsx` minus its estimate cases, plus the details on point (time and each flow's kW)
- [x] 4.4 Day navigation test-first: previous and next controls with their bounds, the calendar, arrow keys (ignored with modifiers, in form fields and in the calendar), stepping across the range's edges in the same view, `replace` for steps and the strip, `push` for opening a day and for the back control, which is labeled with the range
- [x] 4.5 The days strip: its span (the range's days, or the day's month up to today) as a pure function, test-first with the spec's scenarios; the strip component with the shown day marked and each day opening it
- [x] 4.6 `app/page.tsx` renders the open day on the server (day data and strip bars) and ignores a `day` outside 2021-10-10 to today, test-first; reloads on `totals` for the shown day or a strip day through `/api/intervals` and `/api/range`; "Last updated at" only for today, from the live stream

## 5. Docs and checks

- [x] 5.1 README: `/api/range`, its parity script and how to run it on onyx, and the Solar page's address; CLAUDE.md: keep `/api/range` answering like Flask's `/api/v2/formatted` until change 7
- [x] 5.2 Check under `yarn build && yarn start` locally: no CSP violation on the range and day views; the layouts at 375, 844, 1280 and 1440 pixels match the mockups; the arrow keys and back button behave as the specs say

## 6. Release and checks (after merging)

- [ ] 6.1 **(owner)** Publish a release; I hold a Distribution page open through the deploy (live-distribution's task 6.2, the reconnect after a redeploy) and watch the Deploy run
- [ ] 6.2 On next.teslasolar.report: run `scripts/compare-range.mjs` on onyx with zero mismatches; a `totals` event at a :xx:30 refresh updates the current month's bars and today's day view in place; side by side with teslasolar.report for October 2026, the 2025 to 2026 true-up year and October 14, 2026's five views; record the results in the design

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On branch `solar-date-range`: commit the code, then archive this change with spec sync as a second commit, `Archive solar-date-range`, then open the pull request. Group 6 happens after the merge; its outcomes, and live-distribution's tasks 1.4 and 6.2, are recorded in a follow-up pull request.
