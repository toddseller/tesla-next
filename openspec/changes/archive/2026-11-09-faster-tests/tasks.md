# Tasks

## 1. Baseline

- [x] 1.1 Start the change's branch from `weekly-checks-rollout`, so the "Record the weekly-checks rollout" commit rides in this change's PR, and verify `git log` shows it under the new branch
- [x] 1.2 Record the baseline: run `yarn vitest run --reporter=json` and note the total time, the test count (1,370) and the per-file times of `test/deploy.test.ts` and `lib/live.test.ts`

## 2. Reconnect tests on a fake clock

- [x] 2.1 Move "reconnects after its connection is killed and keeps delivering" onto a fake clock as design.md describes, and verify it passes and its own time drops from about 5s to under 1s
- [x] 2.2 Do the same for "after a reconnect the open stretch is read again and sent on", and verify the same
- [x] 2.3 Temporarily stop `lib/live.ts` from retrying, verify both tests fail on a missing reconnect (not a timeout of the test itself), then restore `lib/live.ts` and verify `git diff lib/live.ts` is empty
- [x] 2.4 Run `lib/live.test.ts` 5 times in a row and verify it passes every time, in under 4s per run (below `distribution.test.tsx`, the design's goal; measured 3.2s)

## 3. Deploy tests in separate files

- [x] 3.1 Move the shared helpers and hooks to `test/deploy.ts` and split the tests into `test/deploy-refusals.test.ts`, `test/deploy-guards.test.ts` and `test/deploy.test.ts` by their describe groups, without changing a test body; verify the three files hold the same 22 test names as before
- [x] 3.2 Verify each of the three files passes on its own and takes under 6s
- [x] 3.3 Move the last five tests of "a deploy" to `test/deploy-outcomes.test.ts` under the same describe name, without changing a test body; verify `vitest list test/deploy` shows the same 22 names as before the split and each of the two files takes under 4s on its own

## 4. vmThreads pool

- [x] 4.1 Set `pool: "vmThreads"` in `vitest.config.ts`; verify all 1,370 tests pass and user CPU (`/usr/bin/time -p`) drops from about 52s to about 31s
- [x] 4.2 Run the whole suite 3 times in a row and verify every run passes

## 5. Whole suite

- [x] 5.1 Run `yarn vitest run` 3 times and verify all 1,370 tests pass each time, with each total under 8s (against 16.5s at 1.2), and record the times in design.md
- [x] 5.2 Build the Docker `test` stage with `DOCKER_DEFAULT_PLATFORM=linux/amd64` and verify the tests pass there

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff, report the findings and wait for the owner to pick fixes.
- Commit the code, then archive the change (no specs to sync) as `Archive faster-tests`, then open the PR, mentioning the weekly-checks rollout record it carries.
