# Tasks

## 1. The data

- [x] 1.1 Add `daylight_code smallint` (nullable) to `solar_forecast` in `test/schema.sql`, as anton's `store-daylight-weather` adds it
- [x] 1.2 Test first (`lib/forecast.db.test.ts`): a row's `weather_code` is its daylight code when stored and its daily code otherwise; `now` is the newest `weather_sample` reading's code and time, or null with none. See it fail, then change the queries

## 2. The sky

- [x] 2.1 Test first (`lib/forecast.test.ts`): a reading 10 minutes old makes today's code the reading's with `sky` "now" in daylight and "night" after sunset; a reading 4 hours old, or none, leaves the forecast's code with `sky` "forecast"; the days ahead are unchanged. See it fail, then change `forecastCard`
- [x] 2.2 Test first (`components/solar/sky.test.ts`): `skyOf(0, "now")` is Sunny now with `Sun`, `skyOf(45, "now")` Fog now, `skyOf(0, "night")` Clear now with `Moon`, `skyOf(2, "night")` Partly cloudy now with `CloudMoon`, `skyOf(61, "night")` Rain now, and the forecast wording unchanged. See it fail, then change `skyOf`
- [x] 2.3 Test first (`components/solar/forecast.test.tsx`): today's tile shows its sky with the tile's `sky`, and the days ahead keep the forecast wording; then pass it through

## 3. Verify

- [x] 3.1 The whole suite passes, `tsc` is clean, and `openspec validate forecast-sky --strict` passes
- [x] 3.2 With the owner's go-ahead, once anton's `store-daylight-weather` is deployed, a throwaway branch container on onyx against production: today's tile against the latest reading, and each day's label against its stored daylight code; record in design.md under Results
- [x] 3.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 4. anton companion

- [x] 4.1 Propose `store-daylight-weather` in anton-tesla-api-ws (the column, the hourly codes from the same request, the daylight maximum) for the owner to apply there; record that it is proposed and, later, deployed

## 5. Rollout

- [ ] 5.1 With the owner's go-ahead, release after anton's change is deployed; the run passes
- [ ] 5.2 On teslasolar.report: today's tile reads the sky now and the days ahead their daylight labels; record in design.md under Rollout
- [ ] 5.3 This is the second release after deploy-status: check on onyx that `~/.local/state/tesla-next-deploy/<tag>.result` is 0 and `status <tag>` answers `succeeded` with the log, and record it in the archived deploy-status design (its task 5.2)

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive forecast-sky`, before opening the PR, which also carries the deploy-status rollout record (83e576a).
