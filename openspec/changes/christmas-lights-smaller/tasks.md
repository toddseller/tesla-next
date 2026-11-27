# Tasks

## 1. The bulbs' size

- [x] 1.1 Test first (`components/scene/christmas-lights.test.ts`): the shape is scaled to 0.75 by default and unscaled where the stage is 480 px or less, with no 640 px step and no 1.5x or 2x scale; the bulb works out to about 8 px tall on a 1440 px desktop's 1184 px stage and about 3 px on a 390 px phone's 322 px stage. See it fail on today's rules, then change them in `components/scene/scene.css`; the whole suite passes

## 2. Verify

- [x] 2.1 The whole suite passes, `yarn build` passes, and `openspec validate christmas-lights-smaller --strict` passes
- [x] 2.2 In an onyx branch container reading production, with Playwright, a fresh page per width: replay 2025-12-20 at 9 PM at 1440 x 900 and 390 x 844, and measure one bulb's drawn height in pixels from a zoomed screenshot (about 8 px and about 3 px), with every run still on its eave and nothing scrolling sideways; give the URL for the manual check before any push
- [x] 2.3 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first

## Workflow follow-up

- Record the `christmas-lights` rollout (its first live night) on this branch once checked after sunset, as `Record the christmas-lights rollout`.
- Commit the code, then archive the change (syncing the `live-flow-scene` delta) as `Archive christmas-lights-smaller`, then open the PR; release only when asked.
