# Tasks

## 1. The sentence knows a storm watch

- [x] 1.1 Test first: in `lib/home/now-sentence.test.ts`, add the spec's storm-watch scenarios (storm watch evening, filling up, charge not known, supplying), passing a `storm` flag beside `battery` and `vehicle`, plus one check that idle without storm watch still reads "idle at 100%". Run it and see the storm cases fail on "idle" and the charging wording.
- [x] 1.2 In `lib/home/now-sentence.ts`, take `storm` and change only the Powerwalls' clause: idle reads `holding at 98% for a storm watch` (`holding for a storm watch` without a charge), charging reads `charging at 5.0 kW for a storm watch, 72% full`. The new tests and the existing ones pass.
- [x] 1.3 Test first: in `components/home/now.test.tsx`, a served status with `storm_mode_active: true` on the grid reads "... The Powerwalls are holding at 100% for a storm watch.", and the same status with `island_status: "off_grid_unintentional"` reads "idle at 100%". See it fail, then in `components/home/now.tsx` pass `storm: gridPill(status, null)?.kind === "storm"`; both pass.

## 2. Verify

- [x] 2.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 2.2 `yarn build && yarn start`: Home's Now sentence reads as before with the live status (no storm watch now), at 390 and 1440. Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive now-holds-for-storm-watch`, then open the PR.
