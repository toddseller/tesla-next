## 1. The preset

- [x] 1.1 Test first in `lib/solar/ranges.test.ts`: `impactPresets("2026-11-09")` ends with All time, 2021-10-10 to 2026-11-09, and `presets` (the Solar page's) has no All time; see it fail, then add the preset to `impactPresets` from `FIRST_DAY`
- [x] 1.2 Test first in `components/impact/impact-page.test.tsx`: the row lists six presets, All time last, and picking it pushes `/impact?start=2021-10-10&end=2026-11-08` and marks it selected on that range; see it fail, then pass with 1.1's change

## 2. Verify

- [x] 2.1 The whole suite passes, `tsc` is clean and `openspec validate impact-all-time --strict` passes
- [x] 2.2 Local `yarn build && yarn start`: the row at 1280 pixels in one line and at 375 pixels as two rows of three, All time loads the page with no console error and no sideways scrolling
- [x] 2.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 3. Rollout

- [x] 3.1 With the owner's go-ahead, release; the deploy's health check passes
- [x] 3.2 On teslasolar.report: All time in the row at 1280 and 375 pixels, the page and Home car charging loading for it; record under a Rollout heading in proposal.md (this change has no design.md)

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive impact-all-time`, before opening the PR, which also carries the car-charging rollout records (1f474b1, c6362d4).
