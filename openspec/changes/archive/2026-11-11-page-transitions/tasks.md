# Tasks

## 1. Before starting

- [x] 1.1 `subtle-motion` is merged, its task 1.1 found View Transitions working in a production build under the CSP, and this branch starts from it

## 2. The top bar

- [x] 2.1 Test first (`components/top-bar.test.tsx`, `components/page-slide.test.tsx`): from `/impact`, choosing Patterns slides the page `slide-next` and choosing Solar `slide-previous`; without a tab change the page holds still, and the direction clears when the new page arrives; see it fail, then add `components/page-slide.tsx` and the tabs' `onNavigate`; the tests pass
- [x] 2.2 Test first: the current link holds the highlight span inside a `ViewTransition` named `nav-highlight` and keeps `aria-current="page"`; a pending link brightens while `useLinkStatus` reports it pending, and `aria-current` stays on the old link until the path changes; then add them; the tests pass

## 3. The page content

- [x] 3.1 Test first (`app/layout.test.tsx`, `app/motion.test.ts`): the page content sits in `PageSlide`, served holding still; `motion.css` times the `nav-highlight` group at 250 ms with the site's ease-out and the reduced-motion block turns it off; then add them; the tests pass

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, `openspec validate page-transitions --strict` passes
- [x] 4.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel in Chrome at 1280 and 375 pixels:
  - each tab change brightens the tab on the click, then glides the highlight and slides the page together, the right way;
  - the live status keeps updating during a change;
  - a range change and a day step don't slide as a page;
  - with reduced motion emulated, the change is instant;
  - the console shows no CSP violation.
  Check one change in Safari. Record in design.md under Results.
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported to choose from; the one finding, chosen and fixed: the current tab's position was looked up once per tab, and now once per render (behavior unchanged, covered by the direction tests)

## 5. Rollout

- [ ] 5.1 Release (ask first); the deploy's health check passes, and moving between teslasolar.report's tabs glides and slides as in 4.2; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive page-transitions`, before opening the PR, which also carries the `subtle-motion` rollout record.
