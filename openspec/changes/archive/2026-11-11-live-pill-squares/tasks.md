# Tasks

## 1. Before starting

- [x] 1.1 Branch `live-pill-squares` from `live-flows-pill-rollout`, so the `Record the live-flows-pill rollout` commit rides in this change's PR; `git log` shows it under the new branch's first commit

## 2. The squares

- [x] 2.1 Test first (`components/top-bar.test.tsx`): the pill and each flow are `flex items-center`, its square has no `align-middle`, and its " · " is a `whitespace-pre` span; the flows' text stays "SOLAR 6.2 kW · " and "HOME 1.4 kW · ". See it fail, then change the flow's markup in `components/top-bar.tsx`; the whole suite passes

## 3. Verify

- [x] 3.1 The whole suite passes, `tsc` is clean, `openspec validate live-pill-squares --strict` passes, and `yarn build` succeeds
- [x] 3.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel, in headless Chromium at 4x:
  - at 1366 px, each square's middle is within 0.5 px of its label's line middle, as the dot's is, and the labels, figures and PW part share one middle;
  - the pill is the same width as on teslasolar.report for the same figures, give or take the figures' own width, and " · " keeps a space each side;
  - at 390 and 1280 px the pill still reads PW alone.

  Save zoomed screenshots of the live status beside the same crop from teslasolar.report, and record the measurements in design.md under Results
- [x] 3.3 Show the owner the zoomed screenshots (and the branch container through the tunnel if wanted), and wait for their OK before pushing; OK given 2026-11-11
- [x] 3.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported to choose from; it found nothing to fix

## 4. Rollout

- [ ] 4.1 Release (ask first); the deploy's health check passes, and a zoomed screenshot of teslasolar.report at 1366 px shows the squares centered as in 3.2; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change (no specs to sync) as a second commit, `Archive live-pill-squares`. Push and open the PR, which also carries the live-flows-pill rollout record, only after 3.3's OK.
