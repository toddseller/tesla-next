# Tasks

## 1. Branch

- [x] 1.1 Verify the `warm-caches` branch starts from `payback-days-rollout`, so `git log` shows "Record the payback-days rollout" under it and it rides in this change's PR

## 2. Warm-ups at boot, test-first

- [x] 2.1 Write `instrumentation.test.ts` as design.md describes (listener started, `carCharging(FIRST_DAY, today, today)` and `payback(today)` called, `register()` resolving while they're pending); run it and show it failing because neither warm-up is called
- [x] 2.2 Start both warm-ups from `register()` without awaiting them, and verify 2.1's tests pass
- [x] 2.3 Add the tests that a rejecting warm-up is logged as `cache warm-up failed:`, the other still runs and `register()` doesn't throw, and that `caches warmed in` is logged once both settle; show them failing, then add the `.catch`es and the log line and verify they pass
- [x] 2.4 Run the whole suite and verify every test passes

## 3. Real server

- [x] 3.1 Run `yarn build && yarn start` against the scratchpad preview PostgreSQL and verify the log shows `caches warmed in` (or a `cache warm-up failed:` line for missing data, not a crash), and that the Impact page with All time and the True-Up page still render

## 4. Review

- [x] 4.1 Run `ponytail:ponytail-review` on the uncommitted diff, report its findings and wait for the owner to pick which to fix

## Workflow follow-up

- Commit the code, then `/opsx:archive warm-caches` and commit `Archive warm-caches`; open the PR, noting that it carries the payback-days rollout record (2d388ef).
- Ask before publishing the release. After the deploy, wait for `caches warmed in` in `docker logs`, time the Impact page with All time and the True-Up page, and record the times on a local `warm-caches-rollout` branch (not pushed).
