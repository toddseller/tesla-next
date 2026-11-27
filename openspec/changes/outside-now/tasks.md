# Tasks

## 1. Temperature and code reach the client

- [x] 1.1 Test first (`app/api/intervals/route.test.ts`, beside its gusts cases, with the throwaway PostgreSQL): a day's weather readings carry `temperature` 13.4 and `code` 3 from a stored row, and a row without a temperature carries its code and no temperature. See them fail, then add both to the mapping in `lib/intervals/intervals.ts`; the whole suite passes
- [x] 1.2 Test first (`lib/scene/weather.test.ts`): `weatherAt` blends `temperature` between two readings, returns whichever has one when the other has none, and returns the code of the reading at or before the time, never a blend. See them fail, then add the two fields to `Sky` and those cases to `weatherAt`; the whole suite passes
- [x] 1.3 Test first (`components/scene/use-site-data.test.tsx`, and the live-weather tests): a live status carrying `temperature` 16.7 and `code` 3 gives the site those values and `useLiveWeather` passes them on unwalked; a status without them gives null. See them fail, then add them to `use-site-data.ts` and `UNWALKED` in `live-weather.ts`; the whole suite passes

## 2. The Outside band on Distribution

- [x] 2.1 Test first (`lib/scene/weather.test.ts` or a new `components/scene/outside.test.tsx`): the condition word is Cloudy for code 3 by day, Clear for code 0 at 9:40 PM, Fog for a fog code with cover 1 or low 1, and not Fog for a fog code with low 0.19 and cover 0.2. See them fail, then write the word function on `skyOf` as design.md sets; the whole suite passes
- [x] 2.2 Test first (`components/scene/outside.test.tsx`): live, the band reads Outside now, 62°F, Cloudy, Calm, Sunrise and Sunset for the spec's morning in °F and mph, and 17°C in °C; in replay it reads Outside at 12:00 PM with the 2024-02-04 noon storm's wind as `windText` words it and that day's sun times; without weather it shows only the sun times; with wind but no temperature or code it shows the wind and sun times. See them fail, then write `components/scene/outside.tsx` from the design system's card tokens; the whole suite passes
- [x] 2.3 Test first (`components/scene/distribution.test.tsx`): Distribution renders the band between the scene and Today so far, live and in replay, from the same weather as the scene. See it fail, then place it in `distribution.tsx`; the whole suite passes

## 3. The weather sentence on Home

- [x] 3.1 Test first (`lib/home/now-sentence.test.ts`): `outsideParts` gives 62, cloudy and sunset at 4:52 PM for the spec's morning, clear and the next day's sunrise at 9:40 PM, gusts of 53 mph for 86 km/h and none below 40 km/h, and nothing without a temperature. See them fail, then write it in `lib/home/now-sentence.ts`, reusing Backup's high-wind cutoff; the whole suite passes
- [x] 3.2 Test first (`components/home/now.test.tsx`): Now shows "Outside it's 62°F and cloudy; sunset at 4:52 PM." under the live sentence, the gusts clause marked to show only from `md`, and no sentence without a temperature. See it fail, then render it in `now.tsx` with the phone gaps tightened below `md`; the whole suite passes

## 4. Verify

- [x] 4.1 The whole suite passes, `yarn build && yarn start` serves `/` and `/distribution` under the production CSP with no console errors, and `openspec validate outside-now --strict` passes
- [x] 4.2 In an onyx branch container reading production: screenshot `/distribution` at 1440 x 900 and 390 x 844 live and replaying 2024-02-04 at 12:00 PM, and `/` at 1440 x 900 and 390 x 844; verify against the mockups (Distribution B, Home phone 2) and that at 390 x 844 Today's first figure sits no more than 2 pixels lower than production's with the same live sentence; give the URL for the manual check before any push
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first

## Workflow follow-up

- Ships after anton's `weather-in-live-status` is deployed.
- Commit the code, then archive the change (syncing the `scene-weather`, `day-intervals` and `home-story` deltas) as `Archive outside-now`, then open the PR; release only when asked.
