# Tasks

## 1. The data

- [x] 1.1 Add `temperature real` to `weather_sample` and `temperature_max real`, `temperature_min real` to `solar_forecast` in `test/schema.sql`, as anton's `store-temperatures` adds them, and note it in the file's header; verify the database tests still pass
- [x] 1.2 Test first (`lib/forecast.db.test.ts`): the newest reading carries its temperature (14.6) and none for a reading without one; each forecast row carries its high and low (17.8, 11.1) and none for a row without them. See it fail, then add the columns to the two queries in `forecast()`

## 2. The card's figures

- [x] 2.1 Test first (`lib/forecast.test.ts`): today's temperature is the recent reading's in whole °F (14.6 °C reads 58), null for a reading 4 hours old, none, or one without a temperature; each day ahead's high and low in whole °F (17.8 and 11.1 read 64 and 52), both null unless both are stored. See it fail, then add them in `forecastCard`
- [x] 2.2 Update the route test (`app/api/forecast/route.test.ts`) and the card fixtures (`components/solar/forecast.test.tsx`, `components/solar/solar-page.test.tsx`, `app/page.test.tsx`) for the new fields, and verify those suites pass

## 3. The tiles

- [x] 3.1 Test first (`components/solar/forecast.test.tsx`): Today's tile reads "58°" with the kWh so far, and no temperature when it is null; a day ahead reads "64° / 52°" with its sky, read aloud as "High 64°, low 52°", and no temperature when null; the tiles otherwise render as before. See it fail, then add the lower-right temperatures, with the phone row's kWh cell stacking the high and low and its column widened to 80 px, with design tokens

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, and `openspec validate forecast-temperatures --strict` passes
- [x] 4.2 A throwaway branch container on onyx against production, under the production build: `/api/forecast` carries today's temperature and the three days' highs and lows from anton's new columns (closing anton's open post-deploy check); screenshots at 1280 and 375 px checked against "Temperatures on the tiles" and "Temperatures on a phone", no horizontal scrolling at 375, no console errors; zoomed screenshots and an OK on them before pushing
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first

## 5. Rollout

- [x] 5.1 Once a release is asked for, publish it; the Deploy run passes
- [x] 5.2 On teslasolar.report: the tiles' temperatures against `/api/forecast`; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive forecast-temperatures`, before opening the PR, which also carries the forecast-day-by-hour rollout record (cea7c71).
- Record in anton's archived `store-temperatures` design that its rows fill, from task 4.2, if anton's own check is still open then.
