# Tasks

## 1. Naming and comparing a range under way

- [x] 1.1 Write failing tests in `lib/solar/ranges.test.ts`: `comparedDays` gives no comparison for a lone today, and still gives a lone past day its whole date; `rangeNames` names a lone today "today so far", and a range reaching today that no preset names "since" its first day (All time: "since Oct 10, 2021"). See them fail.
- [x] 1.2 Change `comparedDays` and `rangeNames` in `lib/solar/ranges.ts`; 1.1 passes, and the existing naming tests still pass or change only where the spec changed them.

## 2. Impact's lead without a comparison

- [x] 2.1 Write failing tests for `impactLead` (in `lib/lead.ts`'s tests): with no year-earlier share it gives the share alone ("24% self-powered today so far.", "41% self-powered since Oct 10, 2021."), and a lone past day keeps "; this day last year was". See them fail.
- [x] 2.2 Change `impactLead` to give the share alone; 2.1 passes, and the Impact and Solar page tests that assert lead sentences are updated to the spec's wording and pass.

## 2b. Solar's verb

- [x] 2.3 Change the `solarLead` tests in `lib/lead.test.ts` and the Solar page tests that assert its sentence to "Solar generated" for a finished range and "Solar has generated" for one that includes today; see them fail.
- [x] 2.4 Change `solarLead` to pick its verb with `rangeIncludes`; 2.3 passes.

## 2c. "Generated" across the site

- [x] 2.5 Change the tests for Home's Today and Since 2021 (`components/home/`), the forecast card (`components/solar/forecast.test.tsx`) and Distribution's today-so-far panel (`components/scene/`) to the spec's "generated" wording; see them fail.
- [x] 2.6 Change the wording in `components/home/today.tsx`, `components/home/since.tsx`, `components/solar/forecast.tsx` and `components/scene/today-so-far.tsx`; 2.5 passes.

## 3. Verify

- [x] 3.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 3.2 On an onyx branch container against live data: Impact's Today, This week, All time and a custom range reaching today, and Solar's This month and All time, each open with the spec's sentence, and Home, the forecast card and Distribution's phone panel say "generated"; then the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive honest-partial-periods` with specs synced, then the PR.
- After release, mark scorecard checks 8 and 11 against it on the next change branch (11 also names Patterns, which has no range; note what that leaves).
