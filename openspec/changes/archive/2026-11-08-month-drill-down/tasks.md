# Tasks

Code tasks are test-first: write the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Tasks marked **(owner)** are done by you; I check each where I can.

## 1. Period bars open their days

- [x] 1.1 `periods()` moves from `lib/range.ts` to `lib/solar/ranges.ts` with its tests (from `lib/range.test.ts` to `lib/solar/ranges.test.ts`), and `lib/range.ts` imports it from there; the moved tests, `lib/range.db.test.ts` and `scripts/compare-range.test.mjs` stay green
- [x] 1.2 `RangeChart` test-first: given the true-up year 2026-10-01 to 2027-09-30, clicking the October 2026 bar calls back with `{start: "2026-10-01", end: "2026-10-31"}`; given 2026-01-15 to 2026-06-14, the second bar calls back with 2026-02-15 to 2026-03-14, and given 2026-01-15 to 2026-06-30, the first with 2026-01-15 to 2026-01-31; a period bar's details say clicking shows its days; daily bars still open their day (replacing the test where clicking a monthly bar does nothing)
- [x] 1.3 `SolarPage` test-first: clicking a period bar pushes `/?start=2026-10-01&end=2026-10-31` (a push, so back returns to the year), and a long range's subtitle says a month can be selected

## 2. Checks before the pull request

- [x] 2.1 Under `yarn build && yarn start` locally on a throwaway database seeded with a true-up year of days: from True-up year, clicking October opens October's daily bars at `/?start=2026-10-01&end=2026-10-31`, clicking a day opens its 5-minute view, and back twice returns to the true-up year; a custom range 2026-01-15 to 2026-06-14 opens 2026-02-15 to 2026-03-14 from its second bar; no CSP violation on `/`

## 3. Release and checks (after merging)

- [x] 3.1 **(owner)** Publish a release; I watch the Deploy run
- [x] 3.2 On next.teslasolar.report: from This year and True-up year a month opens its days, a day its 5-minute view, and back returns to the year; record the results in the design, committed on the next change's branch rather than a pull request of their own

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On a branch `month-drill-down`, started from `cutover` so the commit "Record the top-ten-page rollout" rides along: commit the code, then archive this change with spec sync as a second commit, `Archive month-drill-down`, then open the pull request, mentioning the rollout record. Group 3 happens after the merge.
