# Tasks

## 1. Expected hours for any day

- [x] 1.1 Test first (`lib/forecast.db.test.ts`): `expectedHours(day)` for a past day scales each forecast hour by the 30 days before that day, not before today (the spec's past-day scenario), and returns no hours with fewer than 7 scale days or no forecast hour; see it fail for the missing function, then add it in `lib/forecast.ts` with the scale query's text shared with the card's; the new tests and the card's existing tests pass

## 2. The day intervals response

- [x] 2.1 Test first (`app/api/intervals/route.test.ts`): the response's `expected` lists the day's forecast hours with their start and expected kWh, in time order, and is empty for a day without enough history; then have `dayIntervals` return `expectedHours(day)`; the tests pass

## 3. The Solar view

- [x] 3.1 Test first (`components/solar/day-view.test.tsx`): with expected hours the Solar view draws the expected line and its key "Expected from the forecast", and the Home view draws neither; without them the Solar view draws neither; the value axis reaches the expected peak when the flows stay below it; then add the rows, the monotone `Line`, the axis and the key; the tests pass
- [x] 3.2 Test first: `DayDetails` adds "Expected 7.8 kW" after the flows for a row whose hour expects 7.8 kWh, and lists no expected value among the flows; then add it; the test passes
- [x] 3.3 Test first: Total Generated reads "of 64 kWh expected (40%)" for a past day of 25.7 kWh against 64.4 expected, the 40% in `text-destructive`; "(100%)" without it for 63.1 against 63.1; no percentage on today; nothing without expected hours; then pass `today` from `DayPanel` and add the figure; the tests pass

## 4. The alert's link

- [x] 4.1 Test first (`lib/checks.db.test.ts`): each failing solar peak line, the low peak, the zero baseline and the day with no solar, ends with ` https://teslasolar.report/?day=<day>`, and passing lines don't; update the existing tests' expected lines, see the new ones fail, then add it to `peakCheck`; the tests pass

## 5. Verify

- [x] 5.1 The whole suite passes, `tsc` is clean, `openspec validate day-expected-solar --strict` passes
- [x] 5.2 A throwaway branch container on onyx reading production read-only: `/api/intervals?date=2026-04-16` lists 24 expected hours adding up to about 64 kWh with 11 AM at about 7.8, and `?date=2021-10-12` none; the day view of April 16, 2026 serves in about the time it did before, timed with `Accept-Encoding: gzip`; record in design.md under Results
- [x] 5.3 `yarn build && yarn start` against the local preview database loaded with April 2026's intervals and forecast hours: screenshots of April 16 and April 10's Solar view at 1280 and 375 pixels wide match mockup B, the pointer details show the Expected row, nothing scrolls sideways, and the production CSP raises no console error; record in design.md under Results
- [x] 5.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose; the owner chose its one finding: `expectedRows`' point placement had no test of its own, and now has one, shown to fail with the midpoint moved to the hour's start

## 6. Rollout

- [ ] 6.1 With the owner's go-ahead, release; the deploy's health check passes, and teslasolar.report's April 16, 2026 Solar view shows the expected line and "of 64 kWh expected (40%)"
- [ ] 6.2 With the owner's go-ahead, send one test alert through `deploy/pushover` on onyx with a failing solar peak line and its link, and check on the phone that the link opens April 16's day view; record in design.md under Rollout, and if it isn't tappable, note it for a follow-up that passes Pushover's `url` field

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive day-expected-solar`, before opening the PR, which also carries the daily-peak-check rollout record (78210b3), the README log fix (6975547) and the system-checks purpose update (7693fe0).
