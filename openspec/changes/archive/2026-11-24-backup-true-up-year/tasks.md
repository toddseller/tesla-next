# Tasks

## 1. Backup's picker reads True-up year

- [x] 1.1 Test first: in `components/impact/backup-section.test.tsx` the picker reads Previous true-up year, True-up year, Next true-up year, All time, True-up year selected; in `components/impact/impact-page.test.tsx` going back is a click on the section's True-up year, and the page's calendar-year preset is its only This year button. Run them and see them fail on the label.
- [x] 1.2 Relabel the preset in `lib/backup-years.ts` and update the comments that quote "This year" there and in `components/impact/backup-section.tsx`, with `lib/backup-years.test.ts`'s presets; the tests pass.

## 2. Verify

- [x] 2.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 2.2 `yarn build && yarn start`: Impact's Backup picker reads True-up year and All time at 1440 and 390 wide, the phone menu button reading True-up year. Checked by hand in the browser before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive backup-true-up-year`, then open the PR.
