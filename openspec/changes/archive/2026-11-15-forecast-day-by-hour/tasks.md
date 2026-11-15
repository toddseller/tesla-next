# Tasks

## 1. The data

- [x] 1.1 Test first (`lib/forecast.db.test.ts`): `forecast(today)` returns the forecast hours of today through today + 3 with each hour's site day, made Wh only for today's started hours, and nothing past today + 3. See it fail, then widen the query and rename `hourly.today` to `hourly.hours`

## 2. The card's figures

- [x] 2.1 Test first (`lib/forecast.test.ts`): each day ahead's `byHour` uses today's scale (the spec's "A day ahead's hour"), has `made` null on every hour and `byNow` null, and is cut to its first and last hour with expected > 0; a day ahead without forecast hours has `byHour` null; every day ahead's is null when today's is. See it fail, then change `forecastCard`
- [x] 2.2 Update the route test (`app/api/forecast/route.test.ts`) and the card fixtures (`app/page.test.tsx`, `components/solar/solar-page.test.tsx`) for the days ahead's `byHour`, and verify those suites pass
- [x] 2.3 Test first (`lib/forecast.test.ts`): the card's good day is a whole kWh (43.29999923706055 reads 43), null without one. See it fail, then round it in `forecastCard`

## 3. The card

- [x] 3.1 Test first (`components/solar/forecast.test.tsx`): with `byHour`, Today and each day ahead with hours are buttons, Today pressed at first; pressing Thursday marks it pressed and shows "Thursday by hour" with its date, Expected alone in the legend, no made-against-expected line and no solid columns; pressing Today brings Today by hour back; no tile is a button when `byHour` is null, nor a day ahead whose `byHour` is null, nor Today when no day ahead is; the chart's footnote is unchanged. See it fail, then build it in `components/solar/forecast.tsx`
- [x] 3.2 Test first: rerendering the card with a new card keeps Thursday chosen, and with days that no longer include Thursday shows Today by hour. See it fail, then make it pass
- [x] 3.3 Test first: the chosen day ahead's tile carries the raised class and Today's never does; Today keeps its solar outline in both states; no tile has a hover class. See it fail, then add the styling with design tokens
- [x] 3.4 Test first: choosing another day draws the chart in again (its columns carry the rise classes after the press), and a reload of the same day does not. See it fail, then key the panel by its day

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, and `openspec validate forecast-day-by-hour --strict` passes
- [x] 4.2 `yarn build && yarn start` against the local preview database with production's forecast hours: no CSP violation; screenshots at 1280 and 375 pixels wide with Today and with Thursday chosen, checked against "Pick a day, B" and "B on a phone" for the chosen state, and with Today chosen against teslasolar.report's card for each tile's layout, type and spacing, unchanged; no horizontal scrolling at 375; zoomed screenshots and an OK on them before pushing
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from

## 5. Rollout

- [x] 5.1 Once a release is asked for, publish it; the Deploy run passes
- [x] 5.2 On teslasolar.report: choose each day ahead and compare its hours with `/api/forecast`; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive forecast-day-by-hour`, before opening the PR, which also carries the admin-page rollout records (4a7f7f0, 0f5ddc3).
