# Tasks

## 1. Which span the section follows

- [x] 1.1 Test first: in `lib/backup-years.test.ts`, `followedYear` gives Backup's All time for the page's All time (2021-10-10 to today, and an earlier start or later end), a true-up year for October 1 to September 30 from '21 - '22 to this one, and `null` for today, a month, a calendar year, a true-up year past this one and a range one day off. Run it and see it fail on the missing export.
- [x] 1.2 Add `followedYear` to `lib/backup-years.ts`, reusing `holds` and the page's All time preset; the test passes.
- [x] 1.3 Test first: in `app/impact/page.test.tsx`, the page at All time with `backup=23-24` fetches Backup's All time, at '23 - '24 with `backup=all` fetches '23 - '24, and at a month with `backup=23-24` still fetches '23 - '24. See the first two fail, then use `followedYear(range, today) ?? backupYear(...)` in `app/impact/page.tsx`; the tests pass.

## 2. The page and the section follow it

- [x] 2.1 Test first: in `components/impact/impact-page.test.tsx`, at the page's All time the section has no Backup years picker, its heading reads "Backup · All time", and picking the page's This month pushes an address with no `backup`; from a month with `backup=24-25`, picking the page's All time pushes an address with no `backup`; the existing "a new range keeps the backup year chosen" still passes for a week. In `components/impact/backup-section.test.tsx`, `follows` hides the picker and keeps the heading. See them fail.
- [x] 2.2 In `components/impact/impact-page.tsx`, leave `backup` out of `address()` when the range it makes follows, and pass `follows` to `BackupSection`, which leaves out its `PresetGroup` then; update the section's comments that say it is always apart from the page's range. The tests pass.

## 3. The bar against a day

- [x] 3.1 Test first: replace "each event's bar is its length against the year's longest event" in `components/impact/backup-section.test.tsx` with bars against a day: the 52-hour outage at 100%, a one-hour one at 1/24, and a year holding only a 64-second test at 64 / 86,400, not 100%. See it fail, then size the bar as `min(length / 86 400, 1)` in `components/impact/backup-section.tsx` and drop `longest`; the test passes.

## 4. Verify

- [x] 4.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 4.2 `yarn build && yarn start`: Impact at All time and at '23 - '24 shows Backup on the same span with no picker; This month shows the picker again with no `backup` in the address; '26 - '27's test bar is a sliver; checked at 1440 and 390 wide. Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive backup-follows-the-page`, then open the PR.
