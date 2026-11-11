# Tasks

## 1. Before starting

- [x] 1.1 Branch `range-picker-icon` from `true-up-motion-rollout`, so the `Record the true-up-motion rollout` commit rides in this change's PR; `git log main..` shows it under the new branch's commits
- [x] 1.2 Mockups on an artifact, before any code:
  - Impact's header on All time at 1280, 1024 and 390 px, with the icon (plain and selected);
  - the open picker with two months, on a past range and on This year (its days after today dimmed inside the range), and with one month at 390 px;
  - the "Pick a start day" / "Pick an end day" line.

  Show them and wait for an OK; record the artifact's link and the choices in design.md

## 2. The dates button

- [x] 2.1 Test first (`components/solar/range-controls.test.tsx`):
  - the button has no text, is named and titled "Choose dates, Oct 1 – 31, 2026" for October 2026;
  - it carries the selected look on a range no preset holds, and not on This month or on an Earlier year;
  - the existing test reading its text changes to read its name.

  See them fail for the right reason, then change the trigger in `range-controls.tsx`; the whole suite passes

## 3. The picker

- [x] 3.1 Test first (`components/solar/range-controls.test.tsx`), with `today` passed in and `matchMedia` stubbed:
  - on 2026-11-07, November 7, 2026 is enabled, November 8 disabled, and the next-month button disabled;
  - October 9, 2021 is disabled, October 10 enabled, and the previous-month button disabled in October 2021;
  - the "two years from today" test is replaced by these.

  See them fail, then add `today`, `startMonth` and `endMonth`, delete `lastPickable`, and pass `today` from `solar-page.tsx`, `impact-page.tsx` and `true-up-page.tsx`; `tsc` and the whole suite pass
- [x] 3.2 Test first (`components/solar/range-controls.test.tsx`):
  - at 640 px or wider (stubbed `matchMedia`) the picker shows two month grids, September and October 2026 for October 2026;
  - October and November 2026 for All time and for This year on 2026-11-11;
  - October and November 2021 for October 10 to 20, 2021 (the clamp);
  - one grid, October 2026, when `matchMedia` doesn't match or is missing;
  - on This year, November 12, 2026 (disabled, in the range) keeps the range fill with a muted date, and November 12 on October 2026's range still fades.

  See them fail, then add `numberOfMonths` read on open, the end-month `defaultMonth` and the `disabled` class; the whole suite passes
- [x] 3.3 Test first (`components/solar/range-controls.test.tsx`): the picker reads "Pick a start day" on opening and "Pick an end day" after one pick, and reopening starts over. See it fail, then add the line; the whole suite passes

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, `openspec validate range-picker-icon --strict` passes, and `yarn build && yarn start` serves `/`, `/impact` and `/true-up` with no CSP violation in the console (the pages can't reach the database locally; if they can't render, check the CSP on 4.2's container)
- [x] 4.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel:
  - on Impact, at 1024 and 1280 px, the heading and controls stay one row on every preset, and switching Today to All time doesn't move the first card;
  - Solar's and True-Up's headers at the same widths;
  - the picker at 1280 px shows two months opening on the end month, and at 390 px one month beside the presets menu;
  - nothing after today or before 2021-10-10 can be picked, and the arrows stop at both ends;
  - a custom range marks the icon, and its tooltip gives the dates;
  - no CSP violation.

  Take zoomed screenshots at 1280, 1024 and 390 px, and record the results in design.md under Results
- [x] 4.3 Show the screenshots and the branch container, and wait for an OK before pushing. OK given 2026-11-11
- [x] 4.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported to choose from; chosen fixes go test first. Both chosen and fixed test first: 1, the pick hint is a polite live region, so a screen reader hears "Pick an end day"; 2, the calendar highlights the site's today, not the viewer's

## 5. Rollout

- [ ] 5.1 Release (ask first); the deploy's health check passes, and teslasolar.report's Impact page stays one row on All time at 1280 px with the icon and two-month picker; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive range-picker-icon`. Push and open the PR, which also carries the true-up-motion rollout record, only after 4.3's OK.
