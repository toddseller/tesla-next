# Tasks

## 1. Before starting

- [x] 1.1 Branch `range-keeps-scroll` from `range-picker-icon-rollout`, so the `Record the range-picker-icon rollout` commit rides in this change's PR; `git log main..` shows it under the new branch's commits

## 2. Solar

- [x] 2.1 Test first (`components/solar/solar-page.test.tsx`):
  - a preset pushes its address with `{ scroll: false }`, including the readings test's (`readings=tesla`);
  - a month bar pushes October 2026 with `{ scroll: false }`;
  - a daily bar still pushes its day with the address alone.

  See the first two fail for the right reason, then pass `{ scroll: false }` to `onRange`'s and `onOpenRange`'s pushes in `solar-page.tsx`; the whole suite passes

## 3. Impact and True-Up

- [x] 3.1 Test first (`components/impact/impact-page.test.tsx`, `components/true-up/true-up-page.test.tsx`): each range push asserts `{ scroll: false }`. See them fail, then pass it in `impact-page.tsx` and `true-up-page.tsx`; the whole suite passes

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, `openspec validate range-keeps-scroll --strict` passes, and `yarn build && yarn start` serves `/`, `/impact` and `/true-up` with no CSP violation in the console (the pages can't reach the database locally; if they can't render, check the CSP on 4.2's container)
- [x] 4.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel, in a window about 1280 by 700 px:
  - on Solar, scrolled to the chart, a preset, picked dates and a month bar each keep the chart in view; a daily bar opens the day view at the top;
  - on Impact and True-Up, scrolled down, a preset, picked dates and an Earlier year keep the page where it was;
  - Back returns to the previous range;
  - no CSP violation.

  Take zoomed screenshots before and after a pick on each page, and record the results in design.md under Results
- [x] 4.3 Show the screenshots and the branch container, and wait for an OK before pushing. OK given 2026-11-11
- [x] 4.4 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first. No findings: the four range pushes are the only ones, the day push keeps the default, and nothing to remove

## 5. Rollout

- [ ] 5.1 Release (ask first); the deploy's health check passes, and on teslasolar.report a preset picked while scrolled to Solar's chart in a short window keeps the chart in view; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive range-keeps-scroll`. Push and open the PR, which also carries the range-picker-icon rollout record, only after 4.3's OK.
