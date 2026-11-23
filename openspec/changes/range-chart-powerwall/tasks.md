# Tasks

## 1. The Powerwall figure

- [x] 1.1 Write failing tests in `lib/range.db.test.ts` (the throwaway PostgreSQL): a daily item and a period item each carry `powerwall` as house minus solar minus grid to one decimal place, positive for a day that drew down the Powerwalls and negative for one that stored more, and null when house, solar or grid is null. See them fail for the missing field.
- [x] 1.2 Add `powerwall` to `RangeItem` and both item builders in `lib/range.ts`; 1.1 passes, and `/api/range`'s route tests still pass.

## 2. The chart

- [x] 2.1 Write failing tests in `lib/solar/bars.test.ts` for `stackEnds` with a Powerwall: on top above zero, at the bottom below zero, and neither when it is zero. See them fail.
- [x] 2.2 Add `powerwall` to `SERIES` and `stackEnds` in `lib/solar/bars.ts`; 2.1 passes.
- [x] 2.3 Write failing tests in `components/solar/range-chart.test.tsx`: a Powerwall section in the Powerwall color, the legend naming Solar, Grid, Powerwall and House in order, the details showing "Powerwall -2.1 kWh" for October 14, 2026, the new note, and the value axis reaching the lowest grid plus Powerwall. See them fail.
- [x] 2.4 Draw the Powerwall in `components/solar/range-chart.tsx`; 2.3 passes.

## 3. Verify

- [x] 3.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 3.2 On an onyx branch container against live data: October 2026 at 1440 and 390 matches the mockups, every daily bar's stack meets its house mark, and a true-up year's monthly bars still read; then the server's address for the OK before pushing.

## Workflow follow-up

- Mark scorecard checks 1, 2, 5, 6 and 7 as passing in `.impeccable/scorecard.md` (released in v2026.11.23.7 and v2026.11.23.8), in this change's code commit.
- Fresh ponytail review of the diff, then the code commit, then `Archive range-chart-powerwall` with specs synced, then the PR.
