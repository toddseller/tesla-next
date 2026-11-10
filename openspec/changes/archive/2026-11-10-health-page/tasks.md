# Tasks

## 1. Figures from the database

- [x] 1.1 Test first (`lib/health.db.test.ts`, own database): the months query counts only nights with 40 or more intervals starting 1:00 to 4:55 AM site time, takes each night's lowest house use in watts (70 Wh is 840 W, a car charging at 2 AM doesn't move it), and gives each month the lower middle of its nights (300, 840, 864, 900 is 840); a night of 36 intervals and a month with none are left out. See it fail, then write the query in `lib/health.ts`
- [x] 1.2 Test first: the years query gives each calendar year's energy out of and into the Powerwalls (from solar and the grid) and its first day; an empty table gives no months and no years. See it fail, then write it

## 2. Shaping the figures

- [x] 2.1 Test first (`lib/health.test.ts`): `latestFigures` gives "November so far" 864 W against "November 2025" 276 W and +14 kWh a day on 2026-11-10, -10 for 300 against 720 W, "November 2026" on December 1 before a December night counts, and no year-earlier figure when there is none
- [x] 2.2 Test first: `sameMonth` gives the latest month's calendar month in each year that has it, oldest first, skipping a missing year; `lastTwelve` gives the latest month and 11 before, oldest first, with none for a missing month or year-earlier figure
- [x] 2.3 Test first: `powerwallYears` gives 2025's 3,030 kWh as 75 cycles and 83%, a dash when nothing went in, "from Oct 10" for a first year starting 2021-10-10, "so far" for this year, and totals since the first year (20,715 kWh is 511 cycles)

## 3. The page

- [x] 3.1 Test first (`components/health/*.test.tsx`): the Always-on load section shows the three figures, "November in each year" rows with only the latest in the home color, and 12 month columns each with its hidden "September 2026: 840 W, a year earlier 264 W" label and a mark only where a year-earlier figure exists; with no months it shows the no-readings message
- [x] 3.2 Test first: the Powerwall use section shows the three tiles with totals since the first year, a table row per year with its note, kWh, cycles and round trip, and the 40.5 kWh footnote; with no years it shows the no-data message
- [x] 3.3 Test first (`app/health/page.test.tsx`, `health()` mocked): `/health` is served with "Health", both sections and their figures in the first response, Always-on load first
- [x] 3.4 Test first (`components/top-bar.test.tsx`): six links in order with Health (`/health`) last, marked current on `/health`; then add it to `pages`

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean and `openspec validate health-page --strict` passes
- [x] 4.2 Local `yarn build && yarn start` on a throwaway database seeded with a year and a half of intervals: `/health` at 1280 and 375 pixels against the mockup C boards, the top bar at 1512 and 390 pixels, no CSP violation or console error, no sideways scrolling
- [x] 4.3 With the owner's go-ahead, a throwaway branch container on onyx: `/health` against production shows the spike's figures (November 2026 864 W, November 2025 276 W, 2025's 3,030 kWh, 75 cycles, 83%) and how long it takes to serve; record both in design.md under Results
- [x] 4.4 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 5. Rollout

- [ ] 5.1 With the owner's go-ahead, release; the deploy's health check passes
- [ ] 5.2 On teslasolar.report: `/health` at 1280 and 375 pixels with the figures matching 4.3's, and the top bar on one line at 1512 pixels; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive health-page`, before opening the PR, which also carries the warm-caches rollout record (ae5e25b).
