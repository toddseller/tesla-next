# Tasks

## 1. The season

- [x] 1.1 Test first (`lib/scene/live-scene.test.ts`): `sceneState(...).christmas` is true at 9 PM on 2026-11-27, 11 PM on 2027-01-01 and 5 AM on 2027-01-02; false at 5 AM on 2026-11-27, 7 PM on 2027-01-02 and 9 PM on 2025-11-27; true at 9 PM on 2025-11-28 (another year's Thanksgiving). See them fail, then add the season by the evening's date beside `may` in `lib/scene/live-scene.ts`; the whole suite passes

## 2. The bulbs

- [x] 2.1 Convert board B's 64 points (the canvas's `project/Bulbs-twinkle.dc.html`) to stage units as design.md sets, into `CHRISTMAS_LIGHTS` in `components/scene/layout.ts`, one list per run; verify with a test that there are six runs and 64 points, alternating red and green along the string
- [x] 2.2 Test first (`components/scene/live-scene.test.tsx`): with `christmas` set at night the scene draws the bulbs layer with 64 bulbs, on the window lights' opacity and class; by day, or out of season, it draws none; the bulbs aren't inside the shaded house or the cloud layers. See them fail, then draw the layer in `components/scene/live-scene.tsx`; the whole suite passes
- [x] 2.3 Test first (`components/scene/live-scene.test.tsx` or `motion.test.ts`, as the stars' twinkle is tested): the three twinkle groups animate, stop under reduced motion and hold while a replay is paused; below the phone width the bulb symbol scales to at least 6 px tall. See them fail, then add the CSS to `components/scene/scene.css` and the phone scale; the whole suite passes

## 3. Verify

- [x] 3.1 The whole suite passes, `yarn build` passes, and `openspec validate christmas-lights --strict` passes
- [x] 3.2 In an onyx branch container reading production, with Playwright: replay 2026-11-26 at 9 PM (no bulbs) and 2026-11-27 at 9 PM (bulbs) at 1440 x 900 and 390 x 844; zoom on each run to confirm it hangs under its gutter as on board B, the vane check from design.md holds, bulbs are at least 6 px tall on the phone, and nothing scrolls sideways; replay 2026-12-10 at 3 PM (none); give the URL for the manual check before any push
- [x] 3.3 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first

## Workflow follow-up

- This branch carries the local `Record the outside-now rollout` and `Record the phone-first-screen rollout` commits; mention them in the PR.
- Commit the code, then archive the change (syncing the `live-flow-scene` delta) as `Archive christmas-lights`, then open the PR; release only when asked, and check the first night after release as design.md's Migration Plan says.
