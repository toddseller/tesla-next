# Tasks

## 1. The running-net line breaks at each true-up start

- [x] 1.1 In `components/true-up/cycle-chart.test.tsx`, extend "the running net starts again at each true-up year's first cycle": rendering those four cycles (August and September '26 of '25 - '26, October and November of '26 - '27) draws two running-net line paths, the first through two points and the second through two, and a single true-up year still draws one. See it fail.
- [x] 1.2 Give `chartRows`' rows their `trueUp` and draw one running-net `<Line>` per true-up year in `components/true-up/cycle-chart.tsx`, the legend and tooltip unchanged; 1.1 and the rest of the chart tests pass.

## 2. The cycle list names its true-up years

- [x] 2.1 In `components/true-up/cycle-list.test.tsx`, test that cycles spanning '25 - '26 and '26 - '27 list under level-3 headings "'25 - '26" and "'26 - '27", each followed by its own cycles in order, with the footnote once; and that one true-up year (`YEAR_25_26`, `CURRENT`) has no level-3 heading. See them fail.
- [x] 2.2 Group the started cycles by `true_up` in `components/true-up/cycle-list.tsx`, with a subhead per group only when there is more than one; 2.1 and the existing list tests pass.

## 3. One row grid

- [x] 3.1 In `components/true-up/cycle-list.test.tsx`, test that every row carries the same fixed five-track template from `sm` (the class), whether or not it has charges. See it fail.
- [x] 3.2 Set the rows' `sm:` five-track template in `components/true-up/cycle-list.tsx`, keeping the `auto-fit` wrap below `sm`; 3.1 passes.

## 4. Verify

- [x] 4.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 4.2 On an onyx branch container against live data: True-Up's All time lists its cycles under a subhead per true-up year, a row without charges lines its figures up with a row that has them at 640, 768 and 1440 pixels, a 390-pixel phone wraps the rows with no sideways scroll, the running net breaks at each true-up start, and '25 - '26 alone is unchanged; then the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive true-up-cycles-by-year` with specs synced, then the PR.
- Update the `critique-round-4` memory with the PR number.
