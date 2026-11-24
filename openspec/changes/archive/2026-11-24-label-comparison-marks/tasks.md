# Tasks

Each task goes test-first: write the test, see it fail for the right reason, make it pass, then run the whole suite (`yarn test`).

## 1. Habits

- [x] 1.1 In `components/home/habits.test.tsx`, test that last year's line is drawn darker than earlier years and that a key under the chart names this year, last year and "earlier years" (the last only when earlier years exist); make it pass in `components/home/habits.tsx`
- [x] 1.2 Test that the difference figure reads the signed watt gap ("+221 W") with "about +5 kWh a day more than a year ago", and "-420 W" with "about -10 kWh a day less than a year ago"; make it pass

## 2. Today

- [x] 2.1 In `components/home/today.test.tsx`, test that the chart's dimmed hours carry "still to come" while hours remain; make it pass in `components/home/today.tsx`
- [x] 2.2 Test that the chart's time axis reads 12 AM, 6 AM, 12 PM, 6 PM, 12 AM; make it pass in `components/home/today.tsx` only (the Solar day view keeps its ported axis)

## 3. Top Ten

- [x] 3.1 In `components/top-ten/timeline.test.tsx`, test that dots #2 to #10 carry their rank at one size, #1 stays ringed and unnumbered, and the shaded band reads "this year"; make it pass in `components/top-ten/timeline.tsx`

## 4. Checks

- [x] 4.1 Run `yarn test`, `npx tsc --noEmit` and the production build (branch container on onyx), and check `/` (Today, Habits) and `/top` at phone and desktop widths in light and dark; owner OK before pushing

## Workflow follow-up

- Run the ponytail review on the uncommitted diff in a fresh subagent and wait for the owner's pick of fixes.
- Commit the code, then archive the change with spec sync as `Archive label-comparison-marks`, then open the PR.
