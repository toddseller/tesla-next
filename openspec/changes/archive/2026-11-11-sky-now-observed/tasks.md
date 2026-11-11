# Tasks

## 1. Before starting

- [x] 1.1 Branch `sky-now-observed` from `live-pill-squares-rollout`, so the `Record the live-pill-squares rollout` commit rides in this change's PR; `git log` shows it under the new branch's first commit

## 2. The observed sky

- [x] 2.1 Test first (`lib/forecast.test.ts`), `observedCode` gives:
  - 0 for code 1 with 21% model low cloud and the airport at 0%;
  - 2 for the airport's 44%, and 3 for its 75% and 100%;
  - 0 for model-only cover under 25%, and 2 at 27%;
  - 45 for code 45 with no airport report, and 0 for code 45 with the airport at 0%;
  - 61 for code 61.

  See it fail, then add `observedCode` to `lib/forecast.ts` using `skyFrom`; the tests pass
- [x] 2.2 Test first (`lib/forecast.test.ts`):
  - `forecastCard` gives today's code from `observedCode` for a fresh reading in daylight (the 10:00 reading of 2026-11-11 gives 0);
  - at night a 5% reading gives 0, labelled Clear now by `skyOf`;
  - a reading 4 hours old still gives today's forecast code.

  Update existing tests whose readings lack cloud columns. See them fail, then use it in `forecastCard`; the whole file passes
- [x] 2.3 Test first (`lib/forecast.db.test.ts`): the latest reading comes back with its cloud and airport columns. Widen its `weather_sample` insert helper for them. See it fail, then widen the query and `Reading`; the whole suite passes

## 3. Verify

- [x] 3.1 The whole suite passes, `tsc` is clean, `openspec validate sky-now-observed --strict` passes, and `yarn build` succeeds
- [x] 3.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel:
  - the Solar page's today tile names the same sky as the Distribution page's scene at the same moment;
  - `/api/forecast`'s `today.code` matches `observedCode` for the latest reading, read through the app's own connection.

  Take a zoomed screenshot of today's tile beside the Distribution scene, and record both in design.md under Results
- [x] 3.3 Show the owner the screenshots and wait for their OK before pushing; OK given 2026-11-11
- [x] 3.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported to choose from; it found nothing to fix

## 4. Rollout

- [x] 4.1 Release (ask first); the deploy's health check passes, and teslasolar.report's today tile agrees with the Distribution scene; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its spec synced as a second commit, `Archive sky-now-observed`. Push and open the PR, which also carries the live-pill-squares rollout record, only after 3.3's OK.
