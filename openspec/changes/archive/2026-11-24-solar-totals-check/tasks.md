# Tasks

Each task goes test-first: write the test, see it fail for the right reason, make it pass, then run the whole suite (`yarn test`). Figures in tests are placeholders shaped like the spec's scenarios.

## 1. The check

- [x] 1.1 In `lib/checks.db.test.ts`, add a helper that stores a day's `data.solar_generated` and intervals adding to a given kWh (the existing `beforeEach` already clears both tables), then test the frozen-midday scenario: on 2024-02-05, February 4's total 5.9 kWh against intervals adding to 15.7 gives `FAIL solar totals: February 4, 2024's total is 5.9 kWh, its 5-minute intervals add to 15.70 kWh`; make it pass with `solarTotalsCheck(today)` in `lib/checks.ts`
- [x] 1.2 Test a healthy week (every day within 0.5, the line starts `ok solar totals:` and names the span and 7 days) and two days off (one `FAIL` line naming both, joined by `; `); make them pass
- [x] 1.3 Test the edges: 20.0 against 20.5 passes; a day with a total but no intervals, and one with intervals but no total, are left out (the compared count drops); today's partial day isn't compared; no comparable day passes saying so; make them pass
- [x] 1.4 Add `solarTotalsCheck` to `allChecks`, with a test that `allChecks` now returns four lines, one starting `ok solar totals:`; make it pass

## 2. Docs

- [x] 2.1 In `README.md`, Weekly audit, add "each day's solar total against its 5-minute intervals, over the 7 days to yesterday" to the list of what `/api/checks` compares, and that a failing day is re-saved with anton's `backfill_history`; check the paragraph reads as one list

## 3. Checks

- [x] 3.1 Run `yarn test`, `npx tsc --noEmit` and the production build in a branch container on onyx, and confirm its `/api/checks` against production prints `ok solar totals:` for the last 7 days

## Workflow follow-up

- Run the ponytail review on the uncommitted diff in a fresh subagent and wait for the pick of fixes.
- Commit the code, then archive the change with spec sync as `Archive solar-totals-check`, then open the PR. At archive, add the new check to `openspec/specs/system-checks/spec.md`'s Purpose (a daily solar total that disagrees with its intervals, within a week).
