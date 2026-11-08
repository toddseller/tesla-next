# Tasks

Code tasks are test-first: write or port the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Ported code keeps anton's logic and test values, and its comments are swept under the comment rule in the same task. Tasks marked **(owner)** are done by you; I check each where I can.

## 1. Impact figures and `/api/impact`

- [x] 1.1 `impactFigures(start, end)` in `lib/impact.ts` against the throwaway database (`lib/impact.db.test.ts`), test-first with anton's cases and values: the meter-corrected day (46.0 kWh home; 30.0, 11.0, 5.0; 65%, 24%, 11%), a range without saved days (all 0), a plain month of saved days, and a share that ties at .5 rounding to even; `house_grid` and `house_solar` SQL added to `lib/range.ts` beside `house`, whose existing database tests stay green
- [x] 1.2 `app/api/impact/route.ts` test-first: 200 with `{"data": {...}}` holding exactly the ten figures, 400 with a message naming the field for a missing or malformed date and for dates outside 2021-10-01 to 732 days after today, no query on a 400
- [x] 1.3 `scripts/compare-impact.mjs` reusing `compare-range.mjs`'s `sweep` (plus the 15th of every month as a single day) and `firstDifference` over the ten fields, with a test of its ranges and of a mismatch report; README gains it beside `compare-range.mjs`; run it on onyx against both apps directly and get zero mismatches before the page work builds on `impactFigures`

## 2. Shared range code

- [x] 2.1 `parseRange` takes its fallback range and `RangeControls` takes a `presets` list; the Solar page passes the current month and `presets(today)`, verified by its range, range-controls and page tests passing with only those call sites changed
- [x] 2.2 `impactPresets(today)` in `lib/solar/ranges.ts` test-first with the spec's scenarios: Today, This week on a Sunday and on a Wednesday (2026-11-08 to 2026-11-14), a week that crosses a month and a year end, then This month, This year and True-up year

## 3. The Impact page

- [x] 3.1 The Self Powered section test-first with Testing Library on October 18, 2026's figures: the title and "Home use met by solar and Powerwall", 100% in the ring, legend lines 48% Solar, 52% Powerwall, 0% Grid, the ring's accessible label naming all three shares, no arc for a zero share
- [x] 3.2 The Solar Offset section test-first: the title and "Solar generated against home use", 77% energy offset, bars labeled 23.8 kWh and 30.8 kWh with Home the longer, 12.3 MWh and 15.2 MWh for a year, 24.0 kWh for a whole number, and both bars empty without breaking for an all-zero range
- [x] 3.3 `app/impact/page.tsx` renders the range from the address on the server, replacing the placeholder; test-first that the served HTML has the figures for a given range and falls back to today in the site's time zone for a missing, malformed or out-of-window range
- [x] 3.4 `ImpactPage` with the range controls pushing `/impact?start=&end=`, Today marked on the default, and reloads through `/api/impact` on a `totals` event in the range and on a reopened stream that covers today, keeping the figures on a failed reload, test-first with the fake event source
- [x] 3.5 `not-moved-yet.test.tsx` uses the True-Up Tracker's name and path, as the modified dashboard-shell scenario does; verified by the test passing

## 4. Checks before the pull request

- [x] 4.1 Under `yarn build && yarn start` locally: no CSP violation on `/impact`; at 375 px one column with no sideways scroll, at 1024 and 1440 px side by side, matching mockup A; the presets and picker change the address

## 5. Release and checks (after merging)

- [ ] 5.1 **(owner)** Publish a release; I watch the Deploy run
- [ ] 5.2 On next.teslasolar.report: run `scripts/compare-impact.mjs` on onyx with zero mismatches; a `totals` event updates today's figures in place; side by side with teslasolar.report/impact for today, October 2026 and the 2025 to 2026 true-up year; record the results in the design

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On branch `impact-page`: commit the code, then archive this change with spec sync as a second commit, `Archive impact-page`, then open the pull request. Group 5 happens after the merge; its outcomes are recorded in a follow-up pull request.
