# Tasks

## 1. The card's codes

- [x] 1.1 Test first (`lib/forecast.test.ts`): a day ahead with code 73 and a low of 8.9 °C carries code 61; one with a low of -1.5 °C, or of exactly 0, or none, keeps 73; today without a recent reading, code 73 and a low of 8.9 °C, carries 61; a recent reading's snow code is left alone. See it fail, then swap a forecast row's snow code (71 to 77, 85, 86) for 61 in `forecastCard` when its `temperature_min` is above 0

## 2. Verify

- [x] 2.1 The whole suite passes, `tsc` is clean, and `openspec validate snow-above-freezing-reads-rain --strict` passes
- [x] 2.2 A throwaway branch container on onyx against production, under the production build: `/api/forecast` answers as before with today's and the days ahead's codes, with no console errors on the Solar page; zoomed screenshots and an OK on them before pushing
- [x] 2.3 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first

## 3. Rollout

- [x] 3.1 Once a release is asked for, publish it; the Deploy run passes
- [x] 3.2 On teslasolar.report: `/api/forecast` and the card agree; record in design.md under Rollout

## Workflow follow-up

- Branch from `forecast-temperatures-rollout`, so the PR also carries the forecast-temperatures rollout record (bc7db3b).
- Commit the code, then archive the change with its specs synced as a second commit, `Archive snow-above-freezing-reads-rain`, before opening the PR.
