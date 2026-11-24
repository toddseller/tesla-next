# Tasks

## 1. The heading names its year

- [x] 1.1 In `components/impact/backup-section.test.tsx`, test the heading reads "Backup · '26 - '27" on this year, "Backup · '23 - '24" for an earlier year and "Backup · All time" for every year; update `components/impact/impact-page.test.tsx`'s region lookup to the new name. See them fail.
- [x] 1.2 Add the label to the section's `h2` in `components/impact/backup-section.tsx`; 1.1 passes.

## 2. The picker steps true-up years

- [x] 2.1 Change `lib/backup-years.test.ts` to expect presets This year and All time with no `earlier`; in `components/impact/backup-section.test.tsx` and `components/impact/impact-page.test.tsx`, replace the Earlier tests with: the presets read This year and All time, previous steps to '25 - '26 (button and heading name it, `onYear` and the address get `backup=25-26`), next is disabled on this year, previous is disabled on '21 - '22, and All time has no arrows. See them fail.
- [x] 2.2 Drop `earlier` from `backupPresets` and pass `today` to the section's `PresetGroup`; 2.1 passes.
- [x] 2.3 Delete the now-unused Earlier menu from `PresetGroup` and `PresetMenu`'s desktop branch in `components/solar/range-controls.tsx`, with its tests in `components/solar/range-controls.test.tsx` (fresh review finding); the suite still passes.

## 3. Home's year link

- [x] 3.1 Change `components/home/year.test.tsx:38` to expect `/impact?start=2026-01-01&end=2026-12-31`; see it fail.
- [x] 3.2 End the link on December 31 in `components/home/year.tsx`; 3.1 passes.

## 4. Verify

- [x] 4.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 4.2 On an onyx branch container against live data: Impact's All time shows "Backup · '26 - '27" with the picker on This year, the arrows step through '25 - '26 to '21 - '22 and stop there, picking All time renames the heading and hides the arrows, and Home's year link opens This year with the preset marked, at 1440 and 390; then the server's address for the OK before pushing.

## Workflow follow-up

- Record the scorecard round on v2026.11.26.15 (15 of 15; True-Up All time's title now "All time"; the year link noted, fixed here) in `.impeccable/scorecard.md`, in this change's code commit.
- Fresh ponytail review of the diff, then the code commit, then `Archive backup-names-its-year` with specs synced, then the PR.
