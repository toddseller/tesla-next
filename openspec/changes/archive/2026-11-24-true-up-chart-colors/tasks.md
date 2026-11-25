# Tasks

## 1. Exports in the grid's color

- [x] 1.1 In `components/true-up/cycle-chart.test.tsx`, change "imports are grid colored ... exports solar colored ..." to expect exports filled `var(--color-grid)` with a lower `fill-opacity` than imports, and the Exported legend swatch in the grid color; assert nothing in the chart or legend uses `var(--color-solar)`. See it fail.
- [x] 1.2 In `components/true-up/cycle-chart.tsx`, fill the exported bars and swatch with the grid color at Home's 0.55 tint; 1.1 passes.

## 2. A neutral running net with one red mark

- [x] 2.1 In the test, point `runningLines` at `var(--foreground)` (the line-break test keeps its counts), change "only the running-net line is red" so the Running net swatch is neutral, and add: on the Aug, Sep '26 and Oct, Nov '26 chart, no curve is `var(--primary)`, there is exactly one `var(--primary)` dot and it sits at November 2026's x position; on the current year (running net only through November) the dot sits at November too. See them fail.
- [x] 2.2 Draw the running net lines in `var(--foreground)` without dots, add one `ReferenceDot` in `var(--primary)` at the last row with a running net, and make the legend swatch neutral; 2.1 passes.

## 3. Verify

- [x] 3.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 3.2 In an onyx branch container under the production CSP, at 1440 and 390: `/true-up` (current year), '25 - '26 and All time show gray exports lighter than imports, a light running net line and one red dot at the latest point, with last year's dashed line still telling apart from it. Zoom in on the dot and the zero line. Then give the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive true-up-chart-colors` with specs synced, then the PR.
- Update the `critique-round-7` memory with the PR number.
