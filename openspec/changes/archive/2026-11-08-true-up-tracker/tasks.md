# Tasks

Code tasks are test-first: write or port the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Ported code keeps anton's logic and test values (anton-tesla-api-ws `tests/test_meter_reads.py`, `test_reports_sheet.py`, `test_true_up_cost.py`, `test_true_up_cost_api.py`, `test_vpp_credit.py`, and the frontend's `utils/trueUp.test.js` and `pages/Numbers.test.jsx`), and its comments are swept under the comment rule in the same task. Tasks marked **(owner)** are done by you; I check each where I can.

## 1. Cycles and true-up years

- [x] 1.1 Regenerate `test/schema.sql` on onyx with `meter_read`, `rate_revision`, `nsc_rate`, `true_up_statement`, `true_up_statement_cycle` and `vpp_payout` added to its `pg_dump` command, header updated; the existing database tests stay green
- [x] 1.2 `lib/true-up/reads.ts` against the throwaway database, test-first with `test_meter_reads.py`'s read-side cases and the spec's scenarios: estimated reads (Saturday and Sunday moves), stored reads only when all 12 are stored, billing cycles of a true-up year (October 3, 2025 to October 4, 2026), the true-up year containing October 4, 5 and 10, 2026, and labels
- [x] 1.3 `lib/true-up/grid.ts` test-first with `test_reports_sheet.py`'s cases: a cycle's imported, exported, net, peak and off-peak from 5-minute intervals (89.3, 35.7, 53.6, 11.2, 42.4 kWh), VPP exports counted, PG&E's readings before April 27, 2026 with the uncorrected days (0 and 17), the open cycle's last day with data, null totals for cycles not started, true-up year per cycle
- [x] 1.4 `app/api/true-up-years/route.ts` and `app/api/cycles/route.ts` test-first: Flask's shapes, 400 with a message naming the field for a missing, malformed or out-of-window date, no query on a 400 (the NEM fields come in 2.3)

## 2. True-up cost

- [x] 2.1 `cents` (Python's `Decimal(str(x))` half up) and `lib/true-up/pricing.ts` test-first with `test_true_up_cost.py`'s cases: segments split at October 1 and at a rate revision with their allowances (182 and 30 kWh), the September 3 to 30, 2026 segment's lines as billed (-$30.78, $136.01, -$14.81, -$20.60, $10.38), October 1 to 4 at $18.91, the baseline credit's four cases, minimum delivery runs ($140.28, $12.14), amount due, surplus and Net Surplus Compensation ($58.03, $15.07), `project` ($745, $830) and `projectNet` (1,650 and 2,000 kWh, the band)
- [x] 2.2 Cycle charges and their source against the throwaway database: a statement cycle with its estimate and PG&E net, the open cycle calculated over its days so far, a cycle without rates, a billed cycle without rates (PG&E's figure and net, no estimate)
- [x] 2.3 `lib/true-up/cost.ts` with `trueUpCost` test-first with `test_true_up_cost_api.py`'s and `test_vpp_credit.py`'s cases: a finished year with a statement, a calculated finished year with credit left over, a year without dollars, the current year with comparable years (kWh and dollar projections, band, last year), no rates stored, a range that isn't a true-up year, the VPP season (payout, estimate, unmarked days, before 2024); `/api/cycles` rows gain their NEM fields
- [x] 2.4 `app/api/true-up-cost/route.ts` test-first as 1.4
- [x] 2.5 `scripts/compare-true-up.mjs` reusing `compareAll`, comparing `/api/true-up-years`, then `/api/cycles` and `/api/true-up-cost` for every true-up year, All time and a sweep of custom ranges (a month, a 15th-to-14th span, a range across two true-up years), with a test of its ranges and of a mismatch report; README gains the three routes and the script; run it on onyx against a build of the branch and get zero mismatches before the page work builds on these functions

## 3. Shared pieces

- [x] 3.1 `RangeControls` gains an optional `earlier` menu (a Popover button labeled Earlier, or the picked year's label when it holds the shown range, then marked selected), test-first; the Solar and Impact pages' tests pass unchanged
- [x] 3.2 `lib/true-up/text.ts` ported from anton's `utils/trueUp.js` with its tests, changed where mockup A changed the wording: net labels (0.0 reads Exported), cycle dates with "(so far)", charges with "est." and "credit", the estimate line, the billed line (under, over, exactly), the projection (one year, two, crossing zero), the true-up lines (statement, estimate, nothing due with credit and Net Surplus Compensation, no rate), the VPP wording (paid, estimate, none yet), non-breaking year names

## 4. The True-Up Tracker

- [x] 4.1 The year picker's presets from `trueUpYears` test-first: This year and the two before it, Earlier newest first, All time to the current year's end, in 2026 and in 2036
- [x] 4.2 The tiles test-first with Testing Library on the current year's and '25 - '26's real figures from the mockups: Net (so far, for the year, plain), Charges so far, True-up (statement, estimate, nothing due, no dollars), Projected true-up (with and without dollars), Billed against estimate, VPP (paid, estimate, none yet, none before 2024), and only Net for All time
- [x] 4.3 The cycle chart test-first: bars for started cycles in the grid and solar colors, rounded only at their outer ends, the running net restarting each true-up year, last year's dashed line and the projection band for one true-up year only, the legend naming what is shown
- [x] 4.4 The cycle list and the metering note test-first: dates, figures, charges with "est." and "credit", the estimate line under a billed cycle, nothing in red, the note's day count and none for the current year
- [x] 4.5 `app/true-up/page.tsx` renders the range from the address on the server, replacing the placeholder; test-first that the served HTML has the range's tiles and cycles, and falls back to the current true-up year (October 4 and 5, 2026) for a missing, malformed or out-of-window range
- [x] 4.6 `TrueUpPage` reloads `/api/cycles` and `/api/true-up-cost` on a `totals` event from the first shown cycle's first day to the last's last day (2026-10-02 for '25 - '26) and on a reopened stream covering today, keeping its data on a failed reload, test-first with the fake event source
- [x] 4.7 The placeholder test uses the Top Ten page's name and path, as the modified dashboard-shell scenario does; verified by the test passing

## 5. Checks before the pull request

- [x] 5.1 Under `yarn build && yarn start` locally on a throwaway database seeded with two true-up years: no CSP violation on `/true-up`; at 375 px one column with no sideways scroll and year names whole, at 1024 and 1440 px the tiles side by side, matching mockup A; the presets, Earlier menu and picker change the address

## 6. Release and checks (after merging)

- [x] 6.1 **(owner)** Publish a release; I watch the Deploy run
- [x] 6.2 On next.teslasolar.report: run `scripts/compare-true-up.mjs` on onyx with zero mismatches; a `totals` event updates the current year in place; side by side with teslasolar.report/true-up for the current year, '25 - '26 and '23 - '24; record the results in the design

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On branch `true-up-tracker` (which already carries the impact-page rollout commit): commit the code, then archive this change with spec sync as a second commit, `Archive true-up-tracker`, then open the pull request. Group 6 happens after the merge; its outcomes are recorded in a follow-up pull request.
