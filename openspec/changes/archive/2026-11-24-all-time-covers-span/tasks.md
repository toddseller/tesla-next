# Tasks

Each task goes test-first: write the test, see it fail for the right reason, make it pass, then run the whole suite (`yarn test`).

## 1. The match

- [x] 1.1 In `lib/solar/ranges.test.ts`, test `holds`: True-Up's All time holds 2021-10-10 to its end and 2021-10-01 to its end; Solar's All time holds 2021-01-01 to 2026-12-31 but not 2021-10-10 to the day before today nor 2021-10-11 to today; This month holds only its own dates; and `isTrueUpAllTime` agrees for the True-Up cases; make it pass by moving `holds` from `components/solar/range-controls.tsx` into `lib/solar/ranges.ts` with the covering rule and building `isTrueUpAllTime` on it

## 2. The controls and True-Up

- [x] 2.1 In `components/solar/range-controls.test.tsx`, test that a covering range marks All time (pressed button, checked menu item) and not the dates button, and that 2021-10-10 to yesterday marks the dates button; make it pass by importing `holds` from `ranges.ts`
- [x] 2.2 In the True-Up page or metadata tests, test the "Typed from the first day of service" scenario: title "True-Up · All time" and heading "All time by billing cycle"; make it pass

## 3. Checks

- [x] 3.1 Run `yarn test`, `npx tsc --noEmit` and the production build (branch container on onyx), and open `/true-up?start=2021-10-10&end=2027-09-30` and `/solar?start=2021-01-01&end=2026-12-31` at 375px and 1440px; looked over and approved before pushing

## Workflow follow-up

- Run the ponytail review on the uncommitted diff in a fresh subagent and wait for the pick of fixes.
- Commit the code, then archive the change with spec sync as `Archive all-time-covers-span`, then open the PR.
