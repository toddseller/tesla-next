## 1. Charging per day

- [x] 1.1 Test first: `dayCharging(day)` against the throwaway database gives each interval's charging by source, its car and whether that name was measured, and `dayIntervals`' existing tests still pass unchanged; see the new test fail, then take the charging out of `dayIntervals` into `dayCharging` and have `dayIntervals` call it

## 2. Charging over a range

- [x] 2.1 Test first (`lib/car-charging.db.test.ts`): the Powerwall night of the spec gives 10 kWh, 0/60/40% and 60% off the grid; a range starting before coverage counts from the first session and says so; a range before coverage is null; an idle day in coverage is 0 kWh with no shares and no cars; car lines count measured and same-car gap intervals only, never sessions; no VIN in the answer
- [x] 2.2 Test first: a finished day is computed once per process and today every time (as `payback.cache.test.ts` does)

## 3. Route and section

- [x] 3.1 Test first: `/api/car-charging` answers 200 with the figures, null before coverage, and 400 with a message for bad dates, accepting `/api/impact`'s ranges
- [x] 3.2 Test first (`components/impact/car-charging.test.tsx`): the section shows the ring's label, the kWh, the legend, the car lines with "measured from" when the range starts earlier, the "since" note, the idle-day and no-data messages, and sits between the energy section and Backup on the page
- [x] 3.3 Test first: a `totals` event for a day in the range and a reopened stream reload the section with the other figures; a failed reload keeps it

## 3b. Session placement

- [x] 3.4 Test first in `gap-estimates.test.ts` and the intervals route test: a session is placed in the stretch of its duration with the most extra load within 24 hours (the spec's next-day charge), the earliest of equals, with no 30-minute quiet end, and the coverage runs 24 hours past the last session; see them fail, then change `placeSessions`, the coverage and the days of excess and measured charging a day loads
- [x] 3.5 With the owner's go-ahead, re-run the onyx branch build: the placed share of the session energy by month, All time's total, and three days against `/api/intervals`; record in design.md under Results

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean and `openspec validate car-charging --strict` passes
- [x] 4.2 Local `yarn build && yarn start` on a throwaway database seeded with sessions and measured charging: the section at 1280 and 375 pixels, All time, a day, an idle day and a range before coverage; no CSP violation or console error, no sideways scrolling
- [x] 4.3 With the owner's go-ahead, a throwaway branch container on onyx: time `/api/car-charging` for All time cold and warm, check its day totals against `/api/intervals` for three days (one measured, one from sessions, one idle), and record the figures in design.md under Results
- [x] 4.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 5. anton companion

- [x] 5.1 Propose the companion in anton-tesla-api-ws (`refresh()` upserts, keeping a departed car's row with `streamed` false) for the owner to apply there; record its name here: `keep-departed-cars` (2026-11-09, uncommitted in that repository)

## 6. Rollout

- [ ] 6.1 With the owner's go-ahead, release; the deploy's health check passes
- [ ] 6.2 On teslasolar.report: the section at 1280 and 375 pixels for This month and All time, its day totals matching the Distribution replay for one day; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive car-charging`, before opening the PR, which also carries the payback-card-fixes rollout record (dd1e01e).
