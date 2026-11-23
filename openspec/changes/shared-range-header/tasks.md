# Tasks

## 1. The preset core

- [x] 1.1 Write failing tests in `lib/solar/ranges.test.ts`: `presets(today)` ends with All time (2021-10-10 to today); `impactPresets` is Today, This week, then the core; `trueUpPresets(years)` gives True-up year (the current year from the list) and All time (2021-10-01 to its end) and no `earlier`. See them fail for the right reason.
- [x] 1.2 Change `presets`, `impactPresets` and `trueUpPresets` in `lib/solar/ranges.ts`; drop `earlier` from `RangeControls` (keep it on `PresetGroup` for the Backup section); 1.1 passes and `components/impact/backup-section.test.tsx` still passes.

## 2. Stepping by shape

- [x] 2.1 Write failing tests for `step(range, direction)` in `lib/solar/ranges.test.ts`: a day, a Sunday to Saturday week, a month (including a 31st to a 30-day month), a calendar year, a true-up year, and null for a custom range and All time. See them fail for the missing function.
- [x] 2.2 Add `step` to `lib/solar/ranges.ts`; 2.1 passes.
- [x] 2.3 Write failing tests in `components/solar/range-controls.test.tsx`: the previous and next buttons sit either side of the dates button, are named for the step ("Previous month"), call `onRange` with the stepped range, are both disabled on a custom range, next is disabled when the next span starts after today, and previous when the previous span ends before 2021-10-10. See them fail.
- [x] 2.4 Add the arrows to `RangeControls`; 2.3 passes.
- [x] 2.5 Rewrite the arrow tests for option (a): the arrows sit inside the selected preset; a preset is selected for a range of its shape and then reads `rangeTitle` of it, with "Back to this month" as its tooltip, and choosing it pushes its own range; a range no preset's shape fits selects none, lights the dates button and has no arrows; on a phone the menu button names the stepped range with the arrows either side of it; Home's and Backup's `PresetGroup` don't select by shape. See them fail.
- [x] 2.6 Move the arrows into `PresetGroup`, given `today` by `RangeControls`; put `presetStyle` back to `px-3.5`; 2.5 passes.

## 3. The year jump

- [x] 3.1 Write a failing test in `components/solar/range-controls.test.tsx`: the open picker has a month list and a year list per month, the year list offers 2021 to the current year, and choosing 2022 shows that year's month. See it fail.
- [x] 3.2 Set `captionLayout="dropdown"` on the picker's `Calendar`; 3.1 passes and the picker's existing tests still pass.

## 4. One header

- [x] 4.1 Change the True-Up test in `components/true-up/true-up-page.test.tsx` to expect the h1 at full size with the headline under it as the lead, and the presets True-up year and All time; see it fail, then change `components/true-up/true-up-page.tsx` to the Solar and Impact header structure; it passes.
- [x] 4.2 Update the Solar and Impact page tests that list presets (`components/solar/solar-page.test.tsx`, `components/impact/impact-page.test.tsx`) to the new rows; they pass.

## 5. Verify

- [x] 5.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 5.2 Under `yarn build && yarn start`, at 1440x900 and 390x844: the three headers match the mockups; Impact's heading row stays one row at 1024 with the readings switch (All time), narrowing only the range presets if it wraps; Solar's All time bars are readable; stepping back a month, a year and a true-up year changes the address and keeps the scroll; the year list reaches 2022 in two picks; True-Up on a year with no cycles shows sensibly. Then the branch server's address for the OK before pushing.

## Workflow follow-up

- Commit `.impeccable/scorecard.md` with the code, and mark checks 1, 2 and 5 against the release.
- Fresh ponytail review of the diff, then the code commit, then `Archive shared-range-header` with specs synced, then the PR.
