# Tasks

## 1. Branch

- [x] 1.1 Start the change's branch `backup-days` from `faster-tests-rollout`, so the "Record the faster-tests rollout" commit rides in this change's PR, and verify `git log` shows it under the new branch

## 2. Days and hours

- [x] 2.1 In `components/impact/backup-section.test.tsx`, add a test of `duration()` at the day boundary and below an hour (23 h 59 m 59 s reads 23 h 59 m, 24 h reads 1 d 0 h, 52 h 16 m 12 s reads 2 d 4 h, 4 m 30 s and 42 s unchanged), and change the existing expectations to the new form: the Off the grid card `53.3 h` to `2 d 5 h` (from the fixture's total seconds, rounded down), the Longest card and the February 4 row `52 h 16 m` to `2 d 4 h`; run it and verify it fails on the old forms
- [x] 2.2 Give `duration()` the days rule and have the Off the grid card call it instead of `kwh(seconds / 3600) h`; verify the tests from 2.1 pass and the rest of `backup-section.test.tsx` and `impact-page.test.tsx` still pass

## 3. Checks

- [x] 3.1 Run the whole suite and verify every test passes, and `npx tsc --noEmit` is clean
- [x] 3.2 Under `yarn build && yarn start`, open the Impact page at phone width (375px) and at desktop width, pick All time, and verify the Off the grid and Longest cards read days and hours on one line each, as do the February 4, 2024 storm day and row

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff, report the findings and wait for the owner to pick fixes.
- Commit the code, then archive the change with its delta synced into `openspec/specs/backup-history/spec.md` as `Archive backup-days`, then open the PR, mentioning the faster-tests rollout record it carries.
- Ask before releasing; after the release, check the live Impact page and record the rollout on the next change's branch.

## Rollout

Released as v2026.11.09.9 on 2026-11-09; the Deploy workflow passed, its image's 1,371 tests with it, and teslasolar.report answered 200. On the live Impact page with All time picked: 35 outages, 6 d 12 h off the grid, the longest 2 d 4 h on Feb 4, 2024, its storm day "3 outages · 2 d 4 h off the grid", and outages under a day still in hours and minutes (15 h 55 m, 2 h 15 m).
