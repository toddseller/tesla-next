# Tasks

## 1. Home's figures from the first day of data

- [x] 1.1 Change the tests that pin Home's start to October 22 (`app/page.test.tsx` readers' calls, `components/home/pick-a-day.test.tsx` span and count, `components/home/year.test.tsx` and `lib/home/solar-hours` tests, `app/api/solar-hours` route tests) to October 10, 2021; see them fail.
- [x] 1.2 Switch `app/page.tsx`, `components/home/pick-a-day.tsx`, `components/home/year.tsx`, `lib/home/solar-hours.ts` and `app/api/solar-hours/route.ts` from `PTO` to `FIRST_DAY`; 1.1 passes.

## 2. The words

- [x] 2.1 Change the tests for Home's heading, the Since chart's description, Records' empty outage line and the Payback card's timeline to the spec's wording; see them fail.
- [x] 2.2 Name the start from `FIRST_DAY` (or, for outages and payback, `PTO` as the day the system was approved to run) in `app/page.tsx`, `components/home/since.tsx`, `components/home/records.tsx` and `components/true-up/payback-card.tsx`; 2.1 passes.

## 3. Verify

- [x] 3.1 `yarn test` and `yarn build` (its type check) pass, and a search finds no "October 22, 2021" on a page outside outages and payback.
- [x] 3.2 On an onyx branch container against live data: Home's heading, Since 2021 totals (matching Impact's All time), Pick a day's count, the year chapter's 2021, Records and True-Up's Payback card; then the server's address for the OK before pushing.

## Workflow follow-up

- Mark scorecard checks 12 and 13 (released in v2026.11.23.11) in this change's code commit.
- Fresh ponytail review of the diff, then the code commit, then `Archive one-start-date` with specs synced, then the PR. After release, mark check 10.
