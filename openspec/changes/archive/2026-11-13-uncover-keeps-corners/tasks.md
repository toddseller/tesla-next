# Tasks

## 1. Before starting

- [x] 1.1 Branch `uncover-keeps-corners` from `weather-vane-rollout`, so the `Record the weather-vane rollout` commit rides in this change's PR; `git log main..` shows it under the new branch's commits

## 2. The uncover's corner

- [x] 2.1 Test first (`app/motion.test.ts`): both `motion-uncover` keyframes clip with `round var(--round, 4px)`. See it fail on today's `round 4px`, then change the keyframes in `app/motion.css`; the whole suite passes, including the forecast tests
- [x] 2.2 Test first (`components/impact/sections.test.tsx`): each Solar offset fill sets `--round` to `8px` and its clip-path rounds by `var(--round)`. See it fail, then set it in `components/impact/sections.tsx` and update the test's comment about the uncover's clip rounding less; the whole suite passes

## 3. Verify

- [x] 3.1 The whole suite passes, `tsc` is clean, `openspec validate uncover-keeps-corners --strict` passes, and `yarn build && yarn start` raises no CSP violation. 1741 tests pass; locally the Impact page can only show its database error (React #441), with no CSP violation in the console
- [x] 3.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel: on the Impact page on Today (a short solar bar), at 1440 x 900 and 390 px wide, the Solar bar's right end keeps its corners through the end of the uncover, and Home's bar and the Solar page's forecast bar look as before. Take zoomed screenshots of the end of the uncover and the resting bar, and record the results in design.md under Results
- [x] 3.3 Show the screenshots and wait for an OK before pushing. OK given 2026-11-13
- [x] 3.4 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first. Two findings. The Backup duration bar (`rounded-xs`, 2px) was said to snap from 4px to 2px; on onyx it doesn't, since `motion-uncover` fills both ways and the bar keeps the class, so it uncovers and rests at the 4px clip. Setting `--round: 2px` would only have changed its resting look, so it was tried and reverted. The `8px` repeating `rounded-md` was left as it is

## 4. Rollout

- [ ] 4.1 Release (ask first); the deploy's health check passes, and on teslasolar.report the Impact page's Solar bar keeps its corners as it uncovers; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive uncover-keeps-corners`. Push and open the PR, which also carries the weather-vane rollout record, only after 3.3's OK.
