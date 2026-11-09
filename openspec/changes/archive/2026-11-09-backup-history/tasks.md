# Tasks

Test-first throughout: each task's test is written and run red, for the right reason, before its code, and the whole suite runs after it. Database tests use the throwaway PostgreSQL (`inject("pg")`) with `grid_outage` and `site_state` created as anton creates them.

## 1. Mockups

- [x] 1.1 Mockups of the Backup section (two or three layouts of the summary and the full list, phone and wide) and of the top bar's OFF GRID, OFF GRID TEST and STORM WATCH pills, in the design system's tokens; the owner picks one before section 4 starts

## 2. Event kinds

- [x] 2.1 Test-first, `lib/backup.ts`: the events query gives each event its kind (commissioning on or before 2021-10-22 site time, test over an `off_grid_intentional` stretch including an open one, blip under 60 s, outage otherwise), newest first; db tests cover each kind, the order of the checks, and an event with no stretch over it

## 3. Live outage and storm watch

- [x] 3.1 Test-first, `lib/live.ts`: listens on `outages_updated` and `site_state_updated`, reads the open `site_state` stretch on connect and on each `site_state_updated` (read-only pool), keeps it on `globalThis`, and keeps the old stretch and goes on forwarding when the read fails; tests in `lib/live.test.ts`
- [x] 3.2 Test-first, `app/api/live/route.ts` and `components/use-live-stream.ts`: `event: outages` and `event: site_state` (the stretch, also sent after the latest status when a stream opens), with `onOutages` and `onSiteState` handlers; the live status passes `island_status` and `storm_mode_active` through unchanged
- [x] 3.3 Test-first, `lib/live-status.ts`: the added pill (OFF GRID SINCE <time>, OFF GRID, OFF GRID TEST, STORM WATCH, none), covering every dashboard-shell scenario, the stale case included
- [x] 3.4 Test-first, `components/top-bar.tsx` and the layout: renders the pill as mocked, with the server's stretch on first render and updated by `site_state` events; `top-bar.test.tsx` covers an outage, a test, storm watch and on grid

## 4. Backup section on Impact

- [x] 4.1 Test-first, `lib/backup.ts`: the summary (outage count, hours, the longest and its day, the house's energy during outages from the Powerwalls and from solar, each interval counted by its fraction inside an outage); db tests with a half-interval case
- [x] 4.2 Test-first, `app/api/backup/route.ts`: `?year=24-25` or `all`, this true-up year for a missing or other value; 200 with `{"data": {summary, events}}` for that year, an event counted in the year it began; an empty database gives zero outages and an empty list
- [x] 4.3 Test-first, the section's year picker, reusing the True-Up Tracker's year buttons and Earlier menu: This year, the two years before, Earlier, then All time last; `backup` in the address (`24-25`, `all`), replaced without a history entry and leaving `start` and `end` alone; the page parses it on the server; component tests for the order, an Earlier pick and All time
- [x] 4.4 Test-first, the Backup section in `components/impact/` as mocked: summary (or "no outages"), the year's full list newest first with start, duration ("52 h 16 m", "18 s") and kind, each date linking to its day on the Solar page; the page renders it from the server and reloads it on `outages`, `site_state` and a reopened stream, keeping it when a reload fails; component tests and the 375-pixel layout checked in the browser

## 5. Top Ten

- [x] 5.1 Test-first, `lib/top-ten.ts`: a fourth `outages` ranking of outage-kind events by hours, ties to a tenth of an hour newest first, unchanged by `vpp`; db tests, with the route's tests updated for four rankings
- [x] 5.2 Test-first, `components/top-ten/`: `Ranking` takes a unit, `outageEntries` maps the rows, the Longest outage card comes last in the Powerwall color, and the page reloads on `outages` events; component tests cover "52.3 h", "16.9 h ahead of #2" and the timeline's description

## 6. Day view spans

- [x] 6.1 Test-first, `lib/intervals/intervals.ts`: the response adds `off_grid` (start, end, kind) and `storm_watch` (start, end or null) for spans overlapping the day, whole; db tests for an outage across midnight, an open storm watch and an empty day
- [x] 6.2 Test-first, `components/solar/day-view.tsx`: shading on every view's charts cut to the day, and the list under the charts ("Off grid (outage) 2:51 PM to midnight", "now" for an open span, storm watch with its grid-charge kWh); component tests, then the look checked in the browser

## 7. Savings math

- [x] 7.1 Test-first, `caseDays`: the part of each interval inside an outage or blip imports and exports nothing in the solar-only and no-system cases, and tests and commissioning stay lit; db tests for a whole, a half and a test interval
- [x] 7.2 Test-first, `caseDays` and `trueUpSavings`: a storm watch day kind after VPP and before held, the four-part split summing to what the Powerwalls added, `powerwalls_storm` and `storm_days`, and storm watch days as they were in peak-only; db tests
- [x] 7.3 Test-first, `lib/true-up/text.ts`: the key's "storm watch, N days" line, left out with no storm watch days; text tests
- [x] 7.4 With the owner's go-ahead, run the new savings read-only on onyx for '24 - '25 and '25 - '26, then update every scenario in this change's deltas (and add MODIFIED blocks for any other true-up-savings or true-up-tracker scenario whose figures move) to the recomputed figures

## 8. Docs and checks

- [x] 8.1 README: the tables tesla-next now reads (`grid_outage`, `site_state`), the channels it listens on, and the Backup section; no new env var or pin
- [x] 8.2 Whole suite, `tsc` and `yarn build` pass; `yarn build && yarn start` shows the Impact, Top Ten and Solar day pages and the top bar under the production CSP with no console errors
- [x] 8.3 `openspec validate backup-history --strict` passes, and `ponytail:ponytail-review` runs on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 9. Release and checks (ask before publishing)

- [ ] 9.1 With the owner's go-ahead, release; the deploy's health check passes
- [ ] 9.2 On teslasolar.report: the Backup section's figures match a direct read-only query, the outage ranking leads with February 4, 2024, the 2024-02-04 day view is shaded from 2:51 PM, the savings card shows the recomputed figures, and the top bar carries `site_state` (a Go Off-Grid test only if the owner wants one); record these in design.md under a Rollout section

## Workflow follow-up

- Commit the code, then archive (spec sync included) as `Archive backup-history`, on branch `backup-history`, which also carries the cutover-cleanup rollout record (771c314); open one PR.
- After the archive, edit the main specs' Purpose for `top-ten` (records include the longest outages) and `live-status-stream` (outage and site-state events) directly.
