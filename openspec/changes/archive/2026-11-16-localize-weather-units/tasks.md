# Tasks

## 1. Units from the request

- [x] 1.1 Test first (`lib/units.test.ts`): `en-US,en;q=0.9` gives °F and mph; `de-DE,de;q=0.9,en;q=0.8` °C and km/h; `en-GB` °C and mph; `fr,fr-FR;q=0.8,en-US;q=0.5` °C and km/h; `en`, `*`, an empty string and null °F and mph. See it fail, then write `unitsFor()` in `lib/units.ts` with the two region sets from the display-units spec
- [x] 1.2 Test first (`app/layout.test.tsx`, mocking `next/headers`): a child reading `useUnits()` sees °C and km/h under `de-DE` and °F and mph with no header. See it fail, then add the client `UnitsProvider` and `useUnits()` (defaulting to US units) and fill it in `app/layout.tsx` from `headers()`; the layout turns async, so the existing layout tests render `await RootLayout(...)`

## 2. Temperatures on the tiles

- [x] 2.1 Test first (`lib/forecast.test.ts`, `app/api/forecast/route.test.ts`, `app/page.test.tsx`): the card carries 14.6, 17.8 and 11.1 as stored rather than 58, 64 and 52. See it fail, then drop `fahrenheit()` from `forecastCard` and the °F comment on `ForecastCard`
- [x] 2.2 Test first (`components/solar/forecast.test.tsx`): under °F today reads 58° and tomorrow 64° / 52° with "High 64°, low 52°"; under °C 15° and 18° / 11°. See it fail, then convert and round in the tiles with `useUnits()`; update `components/solar/solar-page.test.tsx` fixtures if they assert a temperature

## 3. Wind readout

- [x] 3.1 Test first (`lib/scene/weather.test.ts`): `windText(29, 56, 225, "km/h")` reads "29 km/h, gusts 56 km/h, from SW", `windText(3, 6, 90, "km/h")` "Calm", and the existing mph cases pass with `"mph"`. See it fail, then add the unit argument to `windText`
- [x] 3.2 Test first (`components/scene/live-scene.test.tsx`): under km/h the vane's label reads "Wind: 29 km/h, gusts 56 km/h, from SW". See it fail, then pass `useUnits().wind` to `windText` in the vane; `components/scene/hydration.test.tsx` still passes

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, and `openspec validate localize-weather-units --strict` passes
- [x] 4.2 A throwaway branch container on onyx against production, under the production build: the Solar page and the Distribution vane read °F and mph with Chrome's `en-US`, and °C and km/h with `curl -H 'Accept-Language: de-DE'` and a browser set to German; `/api/forecast` returns °C; no console or hydration errors; zoomed screenshots and an OK on them before pushing
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent before the first commit, with its findings reported to choose from; chosen fixes go test first

## 5. Rollout

- [ ] 5.1 Once a release is asked for, publish it; the Deploy run passes
- [ ] 5.2 On teslasolar.report: the same checks as 4.2; record in design.md under Rollout

## Workflow follow-up

- Branch from `snow-above-freezing-reads-rain-rollout`, so the PR also carries that change's rollout record (1ab7d49).
- Commit the code, then archive the change with its specs synced as a second commit, `Archive localize-weather-units`, before opening the PR.
