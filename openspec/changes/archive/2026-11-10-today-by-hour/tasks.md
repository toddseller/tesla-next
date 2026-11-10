# Tasks

## 1. The data

- [x] 1.1 Add `solar_forecast_hour` (`start_at` timestamptz primary key, `radiation_wm2` real not null, `fetched_at` timestamptz not null) to `test/schema.sql`, as anton creates it, and note it in the file's header
- [x] 1.2 Test first (`lib/forecast.db.test.ts`): the scale per hour of the day from the 30 site days before today counts only hours with both forecast sunlight and intervals, and leaves out older days and today; the scale's day count; today's forecast hours with their made Wh so far (none for hours not started); the newest interval's end; none of it with nothing stored. See it fail, then add the queries to `forecast()`

## 2. The card's figures

- [x] 2.1 Test first (`lib/forecast.test.ts`): each hour's expected kWh is its sunlight times its hour of the day's scale, 0 without one; the shown hours run from the first to the last with expected > 0 or made ≥ 0.05 kWh; `made` is null for hours not started; `byNow` matches the spec's Early afternoon scenario; `over` after the last shown hour; `byHour` is null with no hour today or fewer than 7 scale days. See it fail, then change `forecastCard`
- [x] 2.2 Update the route test (`app/api/forecast/route.test.ts`) and the card fixtures for `byHour`

## 3. The panel

- [x] 3.1 Test first (`components/solar/forecast.test.tsx`): Today by hour with its legend and made-against-expected line, one column per shown hour, a tick only where made beats expected, no line before the first hour and the "made today" wording after the last, and no panel when `byHour` is null. See it fail, then build the panel in `components/solar/forecast.tsx` with recharts, the chart helpers and the design tokens
- [x] 3.2 Test first: an hour's details read "9–10 AM", made and expected kWh to one decimal, and expected only before the hour starts. See it fail, then add the tooltip

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, and `openspec validate today-by-hour --strict` passes
- [x] 4.2 A branch container on onyx against production: the panel against the day's intervals and forecast hours, the two queries timed, and the sunlight-against-output alignment checked; record in design.md under Results
- [x] 4.3 `yarn build && yarn start` against the local preview database: screenshots of the card at 1280 and 375 pixels wide, checked against mockup B, with no horizontal scrolling at 375
- [x] 4.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 5. Rollout

- [x] 5.1 With the owner's go-ahead, release; the run passes
- [x] 5.2 On teslasolar.report: the panel's hours against the day's intervals; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive today-by-hour`, before opening the PR, which also carries the forecast-sky rollout record (1e635ef).
