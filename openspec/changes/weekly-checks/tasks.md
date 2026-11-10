## 1. The checks

- [x] 1.1 Test first (`lib/checks.db.test.ts`, own database): the meter check passes the spec's healthy week (Powerwall exports counted), fails the fault week at 48%, skips a direction under 10 kWh, and judges the newest 7 meter days; see it fail, then write the meter check in `lib/checks.ts`
- [x] 1.2 Test first: the stale check fails with PG&E's newest day more than 5 days old and passes at 2; then add it
- [x] 1.3 Test first: the output check fails the spec's April (64.0 against 69.5, 69.4, 69.2) and passes the foggy month; a past year with under 25 days in the window is left out; then add it

## 2. Route and weekly run

- [x] 2.1 Test first: `/api/checks` answers 200 plain text, one `ok`/`FAIL` line per check, no costs; then write the route
- [x] 2.2 Test first (`test/deploy.test.ts` style, with a fake `docker` and `deploy/pushover` on PATH): the weekly run sends the failing lines when a check fails, an alert when the site can't be reached, and nothing when all pass; then add the step to `deploy/weekly-audit` and the README's Weekly audit section

## 3. Verify

- [x] 3.1 The whole suite passes, `tsc` is clean, `openspec validate weekly-checks --strict` passes
- [x] 3.2 With the owner's go-ahead, a throwaway branch container on onyx reading production read-only: `/api/checks` passes all three for this week, and the meter check, pointed at a week of 2025, fails at about half; record in design.md under Results
- [x] 3.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 4. Rollout

- [ ] 4.1 With the owner's go-ahead, release; the deploy's health check passes
- [ ] 4.2 On onyx: `systemctl --user start tesla-next-weekly-audit` runs the checks, all pass and nothing is sent; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive weekly-checks`, before opening the PR, which also carries the impact-all-time rollout record (47d0535).
