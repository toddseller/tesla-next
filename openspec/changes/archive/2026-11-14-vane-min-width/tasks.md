# Tasks

## 1. Before starting

- [x] 1.1 Branch `vane-min-width` from `uncover-keeps-corners-rollout`, so the `Record the uncover-keeps-corners rollout` commit rides in this change's PR; `git log main..` shows it under the new branch's commits
- [x] 1.2 Mockups on an artifact, before any code:
  - the vane on the roof with wind from 152 (toward) and 332 (away) degrees, at minimum widths 0.15, 0.25 and 0.35, beside today's hairline;
  - the chosen candidates also at 135 and 165 degrees, so the edges of the clamp zone show;
  - each by day and at night, at 1440 and 390 px.

  Settle `MIN` there, record it in design.md, and wait for an OK on the mockups before 2.1. OK given 2026-11-14, with 0.25

## 2. The clamp

- [x] 2.1 Test first (`components/scene/live-scene.test.tsx`, "weather vane"): under reduced motion, wind from 152 degrees poses the arrow with `|dx|` equal to `MIN` and `dy` above 0 (tip toward the viewer); from 332, `|dx|` equal to `MIN` and `dy` below 0; from 270, the transform is still `posed(270)`. See them fail for the hairline `dx`, then clamp `dx` in `vanePose`; the whole suite passes
- [x] 2.2 Test first: with frames running, a gusty wind from 150 degrees (gale speed and gusts) keeps every frame's `dx` the same sign and at least `MIN` in size over several seconds. See it fail (the side flicks as the shake crosses end-on), then take the side from the heading without its shake, as design.md decides; the whole suite passes

## 3. Verify

- [x] 3.1 The whole suite passes, `tsc` is clean, `openspec validate vane-min-width --strict` passes, and `yarn build && yarn start` serves `/distribution` with no CSP violation in the console
- [x] 3.2 A throwaway branch container on onyx reading production read-only, at 1440 x 900 and 390 px wide, with the development weather overrides: wind from 152 and 332 degrees shows a narrow arrow tipped toward and away; a gusty wind from 150 shakes without flicking sides; a swing from east to 200 degrees flips side once without a visible jump; day and night. Take zoomed screenshots and record the results in design.md under Results
- [x] 3.3 Show the screenshots and the branch container, and wait for an OK before pushing. OK given 2026-11-14
- [x] 3.4 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first. One finding, fixed test first: a swing settling near end-on changed side 3 or 4 times as the spring overshot. The review's suggested fix still flipped twice for a swing to 154 on the branch container, so the side is now remembered and changes only once the heading is clearly past end-on (design.md, Decisions); the test covers swings to 152 and 154

## 4. Rollout

- [ ] 4.1 Release (ask first); the deploy's health check passes, and on teslasolar.report the arrow shows at the current wind's direction; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive vane-min-width`. Push and open the PR only after 3.3's OK.
