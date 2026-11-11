# Tasks

## 1. Before starting

- [x] 1.1 Branch `mobile-menus` from `meter-corrected-readings-rollout`, so the `Record the meter-corrected-readings rollout` commit rides in this change's PR; `git log` shows it under the new branch's first commit

## 2. The page menu

- [x] 2.1 Test first (`components/top-bar.test.tsx`):
  - the bar has a "Pages" button with `aria-expanded="false"`, inside a navigation landmark with `sm:hidden`, while the wide-screen links' `nav` carries `max-sm:hidden`;
  - tapping the button sets `aria-expanded="true"` and shows the six links in order, the current one with `aria-current="page"`;
  - choosing Patterns from `/impact` closes the menu and slides the page `slide-next`;
  - Escape closes it.

  Update any existing test that finds the one navigation landmark. See the new tests fail, then add the page menu to `components/top-bar.tsx`; the tests pass
- [x] 2.2 Test first (`app/motion.test.ts`): `.motion-burger` bars transition in 200 ms on `--motion-ease`, the open state turns the outer bars to ±45° and hides the middle one, and the reduced-motion block lists `.motion-burger` and `[data-slot="popover-content"]`; see it fail, then add the rules to `app/motion.css` and the class to the bars; the tests pass

## 3. The presets menu

- [x] 3.1 Rename `EarlierMenu` to `PresetMenu`, taking its items and the label shown when none is picked ("Earlier" on wide screens); the existing Earlier tests in `components/solar/range-controls.test.tsx`, `components/impact/*.test.tsx` and `components/true-up/*.test.tsx` pass unchanged
- [x] 3.2 Test first (`components/solar/range-controls.test.tsx`):
  - `PresetGroup` renders its buttons with `max-sm:hidden` and a phone trigger with `sm:hidden`, named "Preset ranges: This month";
  - opening it lists the presets in order with the earlier years before All time ('25 - '26 … '21 - '22 for True-Up on 2026-11-08), the matching one checked;
  - choosing one calls `onRange` with its range and closes the menu;
  - a range no preset gives names the trigger "Custom";
  - the Backup group's trigger is named "Backup years: This year".

  See them fail, then add the phone menu to `PresetGroup`; the tests pass
- [x] 3.3 In `RangeControls`, lay the phone trigger and the dates button out as one wrapping row, each `max-sm:flex-1` and `whitespace-nowrap`; covered in the browser by 4.2, as jsdom applies no layout

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, `openspec validate mobile-menus --strict` passes, and `yarn build && yarn start` serves `/`, `/impact` and `/true-up` with no CSP violation in the console
- [x] 4.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel in Chrome:
  - at 390 px, the brand and Pages button share a row, the menu opens with the bars turning into an X and closes in reverse, and choosing a page closes it and slides the page;
  - Impact's presets menu and dates button share a row; True-Up's stack, with the earlier years in the menu; Backup's year is a menu;
  - at 320 px, the name and the button still share a row and nothing scrolls sideways;
  - at 640 and 1280 px, the bar and presets look as before;
  - with reduced motion emulated, the bars and menus change at once;
  - the console shows no CSP violation.

  Check the page menu once in Safari. Record in design.md under Results
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported to choose from; the one finding, chosen and fixed: `PresetMenu` took both a `phone` flag and a `look` function that only repeated it, and now `phone` alone picks the button's look (behavior unchanged, covered by the presets tests)

## 5. Rollout

- [ ] 5.1 Release (ask first); the deploy's health check passes, and teslasolar.report on a phone shows the page menu and the presets menus as in 4.2; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive mobile-menus`, before opening the PR, which also carries the meter-corrected-readings rollout record.
