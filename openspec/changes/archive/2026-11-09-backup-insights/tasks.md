# Tasks

Test-first throughout: each task's test is written and run red, for the right reason, before its code, and the whole suite runs after it. Database tests use the throwaway PostgreSQL with their own database, as `lib/backup.db.test.ts` does.

## 1. Mockups

- [x] 1.1 Mockups of the Backup section at 1280 and 375 pixels: the five tiles (Closest call added), the blips line, a storm-day group and outage rows with weather, lowest charge or drop, and the solar refill note, plus the estimates note; the owner picks one before section 3 starts

## 2. The figures (`lib/backup.ts`)

- [x] 2.1 Test-first, a pure `outageBattery(intervals, outage)`: the drop and its time (energy in at 0.36/0.41), started full by the 12-hour signal and 1 kWh tolerance, the lowest %, kWh left and hours left from the hour before the low point, more than 36 kWh out meaning solar refilled, and fewer than 80% of intervals meaning incomplete; unit tests for each spec scenario, the night-full and no-draw cases included
- [x] 2.2 Test-first, a pure weather label from samples: thunderstorm, heavy rain or rain by `rainFrom`, high wind (40 km/h) or windy (25 km/h), joined, else Calm, none without samples; unit tests for the spec's two scenarios and the cutoffs
- [x] 2.3 Test-first, pure storm-day groups and blips per true-up year over the year's events: the 6-hour gap from the previous end, outages and blips only, a group's count and total time; unit tests for the February 4, 2024 case, a test nearby, and a year without blips reading 0
- [x] 2.4 Test-first, `backupHistory`: one more query for the outages' intervals (12 hours before to the end) and weather samples, each outage carrying its battery figures, weather and refill flag, the summary its closest call and blips; db tests with seeded intervals for a full start, a below-full start and a gap, and the route test for the new fields

## 3. The section (`components/impact/backup-section.tsx`)

- [x] 3.1 Test-first, as mocked: the Closest call tile (a dash without a full-start outage) linking to its day, the blips line, the estimates note, storm-day groups with their heading line, and each outage row's weather, "~43%" or "fell 12.0 kWh" (marked incomplete when it is), and the refill note; component tests, then the look checked in the browser at 1280 and 375 pixels

## 4. Docs and checks

- [x] 4.1 README: the Backup history paragraph gains the rebuilt battery figures with their constants, the weather, storm days and blips per year
- [x] 4.2 Whole suite, `tsc` and `yarn build` pass; `yarn build && yarn start` on a throwaway database seeded with an outage like February 4, 2024 shows the section under the production CSP with no console errors and no sideways scrolling
- [x] 4.3 With the owner's go-ahead, a build of the branch on onyx, in a throwaway container removed afterwards, answers `/api/backup?year=all`; February 4, 2024 reads about 39% and solar refilled, and December 14, 2024 and August 9, 2022 their drop only; record the figures in design.md under Results
- [x] 4.4 `openspec validate backup-insights --strict` passes, and `ponytail:ponytail-review` runs on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 5. Release and checks (ask before publishing)

- [ ] 5.1 With the owner's go-ahead, release; the deploy's health check passes
- [ ] 5.2 On teslasolar.report: the section's figures match the onyx run, at 1280 and 375 pixels with no console errors; record in design.md under Rollout
- [ ] 5.3 At the first real outage logged by `battery_sample`, compare its rebuilt lowest charge with the samples' lowest and record the difference in design.md (may come after the archive, as a rollout record of its own)

## Workflow follow-up

- Commit the code, then archive (spec sync included) as `Archive backup-insights`, on branch `backup-insights`, which also carries the backup-history rollout record (eaa9f4f); open one PR.
