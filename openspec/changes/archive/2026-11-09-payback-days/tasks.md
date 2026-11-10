# Tasks

## 1. Branch

- [x] 1.1 Start the change's branch `payback-days` from `backup-days-rollout`, so the "Record the backup-days rollout" commit rides in this change's PR, and verify `git log` shows it under the new branch

## 2. duration() beside the Backup helpers

- [x] 2.1 Move the `duration()` test from `components/impact/backup-section.test.tsx` to `lib/backup-figures.test.ts`, importing `duration` from `./backup-figures`; run it and verify it fails because `backup-figures` has no `duration`
- [x] 2.2 Move `duration()` to `lib/backup-figures.ts` unchanged and import it in `components/impact/backup-section.tsx`; verify the moved test and all of `backup-section.test.tsx` pass

## 3. The outage record in seconds

- [x] 3.1 In `lib/true-up/payback.db.test.ts`, expect the empty record as `{ count: 0, seconds: 0, longest_seconds: null }`; in `payback-card.test.tsx` and `true-up-page.test.tsx`, give the fixture `{ count: 35, seconds: 564_840, longest_seconds: 188_172 }` (156.9 h and 52 h 16 m 12 s) and expect the card's link to read "What they did instead: 35 outages, 6 d 12 h off the grid, the longest 2 d 4 h"; run them and verify they fail on the old fields and text
- [x] 3.2 Have `payback()` return the backup summary's whole seconds as `seconds` and `longest_seconds` (dropping `pyRound` if nothing else uses it) and the card read them through `duration()`; verify the tests from 3.1 pass

## 4. Checks

- [x] 4.1 Run the whole suite and verify every test passes, and `npx tsc --noEmit` is clean
- [x] 4.2 Under a production build against a local throwaway database with a costs file whose Powerwalls won't pay back, open the True-Up page at 375px and desktop width and verify the outage record reads days and hours and links to the Backup section with All time

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff, report the findings and wait for the owner to pick fixes.
- Commit the code, then archive the change with its delta synced into `openspec/specs/system-payback/spec.md` as `Archive payback-days`, then open the PR, mentioning the backup-days rollout record it carries.
- Ask before releasing; after the release, check the live True-Up page and record the rollout on the next change's branch.
