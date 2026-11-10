# Tasks

## 1. The table

- [x] 1.1 Add `solar_forecast` to `test/schema.sql` exactly as the design's contract gives it (anton's `store-solar-forecast` creates it in production), and check `test/postgres.test.ts` still passes

## 2. The figures

- [x] 2.1 Test first (`lib/forecast.test.ts`): `forecastCard` gives tomorrow 33 kWh from 900 kWh over 360 MJ/m² and 13.2 MJ/m²; today's 9.6 kWh so far against 31 expected, and a full bar past it; the good day as the most solar of the 30 days; no expected kWh and no days with 5 days behind the scale; `staleSince` for a fetch over 6 hours old and none for one 40 minutes old; no days when the newest fetch is 26 hours old, today's kWh so far kept; then write it
- [x] 2.2 Test first: `skyOf` gives Sunny for 0, Partly cloudy for 1 and 2, Cloudy for 3 and an unknown code, Fog likely for 45 and 48, Rain for 51 to 67 and 80 to 82, Snow for 71 to 77, 85 and 86, Thunderstorms for 95 to 99; then write it
- [x] 2.3 Test first (`lib/forecast.db.test.ts`, own database): `forecast(today)` sums the scale and the good day over only the 30 days before today that have both a `data` row and a forecast, and returns today's and the next three days' rows and today's solar so far; see it fail, then write the queries
- [x] 2.4 Test first: `GET /api/forecast` answers 200 with `{ data }` from `forecast(siteToday())`; then write the route

## 3. The card

- [x] 3.1 Test first (`components/solar/forecast.test.tsx`): the card shows Today with expected and so-far kWh and its sky, Tomorrow, Thursday and Friday with kWh, bar width against the good day, label and hidden icon, the footnote naming the good day; "Forecast from 4:15 AM" when stale and no time when fresh; "No forecast right now" with today's kWh so far when there are no days; then write it with the mockup's layout (tiles in a row from `sm`, today's tile and day rows on a phone)
- [x] 3.2 Test first (`app/page.test.tsx` and `components/solar/solar-page` tests): the range view's first response holds the card above "Solar by date range" and a day's view doesn't; a totals event for today and a reopened stream reload it from `/api/forecast`, a totals event for another day doesn't, and a failed reload keeps it; then wire it into `app/page.tsx` and `SolarPage`

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, and `openspec validate solar-forecast --strict` passes
- [x] 4.2 Local `yarn build && yarn start` on a throwaway database seeded with 40 days of `data` and forecasts: the card at 1280 and 375 pixels against the mockups, the stale note and the no-forecast state by changing `fetched_at`, a day's view without the card, no CSP violation or console error
- [x] 4.3 With the owner's go-ahead, once anton's `store-solar-forecast` is deployed and backfilled, a throwaway branch container on onyx against production: the card's figures against the spike's method by hand for today and tomorrow, and how long `/` takes; record both in design.md under Results
- [x] 4.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 5. anton companion

- [x] 5.1 Propose `store-solar-forecast` in anton-tesla-api-ws (the table, the hourly fetch and upsert, the 60-day backfill, failures keeping the rows) for the owner to apply there; record that it is proposed and, later, deployed: proposed 2026-11-10, deployed and backfilled the same day (64 rows from 2026-09-11, the hourly fetch storing today and three days ahead)

## 6. Rollout

- [x] 6.1 With the owner's go-ahead, release after anton's change is deployed; the deploy's health check passes
- [x] 6.2 On teslasolar.report: the card at 1280 and 375 pixels, today's kWh so far matching the range chart's bar for today; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive solar-forecast`, before opening the PR, which also carries the patterns-page rollout records (5f022b5, 98b896b, e0d3d0e).
