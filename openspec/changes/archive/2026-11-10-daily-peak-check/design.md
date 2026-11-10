# Design

## Context

See proposal.md for why and specs/system-checks/spec.md for the behavior. What shapes the approach:

- `lib/checks.ts` holds the weekly checks, each an async function returning one `ok`/`FAIL` line; `/api/checks` joins `allChecks(siteToday())`. Only the running container can reach the database, so the server asks the site over HTTP.
- `deploy/weekly-audit`, run by a systemd user timer on onyx (Mondays 06:30 Pacific), builds the test stage, then fetches `/api/checks` with `docker compose exec -T next wget` and sends `FAIL` lines through `deploy/pushover`. The units are copied to onyx and enabled by hand (README.md, Weekly audit).
- anton's `solar_forecast` has a row for every day from 2021-10-10 (`radiation_mj`), after the backfill of 2026-11-10. `energy_interval` holds the 5-minute intervals (`day`, `solar_generated_wh`); anton finishes the previous day after midnight, and the newest interval lags 10 to 15 minutes.

The rule's figures come from a replay over 2021-10-10 to 2026-11-09 (daily solar, forecast and each day's highest interval, read-only from production):

| Rule | First alert in the fault | Other alerts |
|---|---|---|
| peak under 60% of the bright-day middle, 1 bright day | 2026-04-13 | 2025-08-28 |
| kWh per MJ under 50% of the 30-day middle, 2 bright days in a row | 2026-04-16 | none |

The owner chose the peak rule, run daily. 2025-08-28 is a second fault, not a false alarm: at 10 AM, under a clear sky (observed code 0, 6 to 20% cloud, 620 to 900 W/m² forecast), solar fell from 1.6 kWh an hour to about 0.5 and stayed there until 9 AM on August 30, with the grid connected (no outage logged, the house drawing the rest from it) and the Powerwalls neither charging nor discharging. It cleared without the owner noticing, after about 75 kWh unmade. So the rule found both faults in five years and nothing else.

That replay counted a day as bright at 15 MJ/m², and the first branch run (task 3.2) showed what that costs: 1,176 of 1,857 days too dull to judge, every one from November to January, as a clear December day forecasts about 11 MJ/m². A seasonal measure replaced it, each date's clear-day forecast (the 90th percentile of every year's forecasts within 15 days of the date), replayed the same way:

| Bright day | Fault days caught | Other alerts | Days judged, by month |
|---|---|---|---|
| 15 MJ/m² | 8 of 8 | 0 | 0% Nov to Jan, 37 to 72% otherwise |
| 15 MJ/m², or 60% of the 30-day brightest | 8 of 8 | 0 | 37 to 75% |
| 60% of the date's clear-day forecast | 8 of 8 | 0 | 40 to 77% |
| 70% of the date's clear-day forecast | 8 of 8 | 0 | 28 to 74% |

The clear-day forecast runs from 10.6 MJ/m² in mid-December to 30.0 in mid-June. The owner chose 60% of it.

## Goals / Non-Goals

**Goals:**
- One more check function and one route, the same shape as the weekly ones, and a daily timer that reuses the weekly run's alerting.

**Non-Goals:**
- Changing the weekly checks or their schedule.
- Leaving out days with a grid outage. On an outage with full Powerwalls the panels are curtailed and the check can fail; the replay found no such day, and a fault alert during an outage is noise rather than harm.
- Holding back repeat alerts. A fault alerts on each bright day it lasts, which is the reminder wanted while it is unfixed.

## Decisions

### Judge yesterday, in one query

`peakCheck(today)` judges `shiftDay(today, -1)`, the newest finished day, so a 7 AM run never sees a partial day. One query returns yesterday's `radiation_mj`, its clear-day forecast and `max(solar_generated_wh) * 12`, and `percentile_disc(0.5)` over the peaks of the bright days 30 to 1 before it that have intervals. Each of those 31 days' clear-day forecast is `percentile_disc(0.9)` over `solar_forecast` rows whose day of the year is within 15 of its own, the distance taken both ways round the year (`least(d, 365 - d)`), so late December and early January share their days; a leap year's extra day shifts a date by one, which 15 days on each side absorbs. That is 31 percentiles over about 1,900 rows a run. `percentile_disc` takes the lower middle, as the replay did and as the Patterns page's monthly figure does. The function returns the spec's lines: `FAIL solar peak: <day>'s peak was 52% of the usual bright-day peak (4.4 of 8.4 kW)`, or `ok solar peak: ...` with the percentage, or the reason it wasn't judged.

Alternative: judge a rolling window of days. One day is enough for the peak rule, and the replay's false-alarm count was measured that way.

### A route of its own

`app/api/checks/daily/route.ts` answers `peakCheck(siteToday())` alone, in the same plain text as `/api/checks`. Adding the peak check to `allChecks` would make the daily run repeat the weekly checks' failures every morning, and the weekly run would judge only Sunday. Alternative: a query parameter on `/api/checks`; a separate path keeps each run's request fixed and needs no parsing.

### One checks script, two timers

The checks half of `deploy/weekly-audit` (fetch, grep `^FAIL`, alert, or alert that the site didn't answer) moves into `deploy/checks ROUTE NAME`, printing what it fetched. `weekly-audit` calls `deploy/checks /api/checks Weekly` and appends its output to its log, as now. `deploy/tesla-next-daily-check.service` runs `deploy/checks /api/checks/daily Daily` directly; its output goes to the user journal. `deploy/tesla-next-daily-check.timer` fires at 07:00 Pacific every day with `Persistent=true`, well after anton finishes the day and after the Monday audit's 06:30 start. Alerts are titled "Daily checks failed: tesla-next" and "Daily checks couldn't run: tesla-next".

Alternative: a second, separate `deploy/daily-check` script. Its alerting would be a copy of the weekly run's.

### Thresholds from the replay

60% of a clear day, 15 days either side, the 90th percentile, the 60% peak share and at least 5 bright days in the window are the replay's values, kept as named constants with their reason. The clear-day forecast comes from every stored year, including the days ahead anton keeps; it isn't stored, so it follows new years without upkeep.

Alternative: 15 MJ/m², or 60% of the 30-day window's brightest forecast. It caught the same days, but a month of June gloom lowers its own bar, and its 15 MJ/m² belongs to this latitude. The 30 days match the forecast card's and the weekly output check's window.

## Risks / Trade-offs

- [A fault whose peak stays above 60%, a few panels' microinverters] → The weekly output check still covers slow losses; a lower cut-off would alert on more summer fog days.
- [Days with no stored intervals now fail] → An anton outage that loses a day alerts the next morning; the replay over the branch container (task 3.2) counts how many past days would have.
- [The forecast stops arriving] → Yesterday without a forecast passes unjudged, saying so; the weekly run doesn't watch the forecast either. anton's forecast fetch logs its failures.
- [The timer isn't installed after deploy] → Deploys don't touch systemd units; the rollout task installs them and checks `list-timers`.

## Migration Plan

Release as usual (ask first). Then copy the two daily units to `~/.config/systemd/user/` on onyx, `daemon-reload`, `enable --now tesla-next-daily-check.timer`, and start the service once by hand: yesterday should read `ok solar peak` and nothing is sent. The weekly timer's unit is unchanged; its script picks up `deploy/checks` from the deployed clone. Rollback: disable the daily timer and release the previous tag.

## Results

A throwaway branch container on onyx against production, read-only, 2026-11-10:

- **The 15 MJ/m² rule, first run:** `peakCheck` failed on exactly the replay's days, but 1,176 of 1,857 days were too dull to judge, every one from November to January. The seasonal clear-day forecast replaced it (Context).
- **The seasonal rule:** over every day from 2021-10-11 to 2026-11-10, it fails on 8 days, the replay's: August 28, 2025 (27% of the usual bright-day peak, 2.5 of 9.2 kW) and April 13, 16 to 19, 22 and 23, 2026 (49 to 55%, 4.1 to 4.6 of 8.4 kW). April 10, 2026 passes at 124%. 1,107 days were judged, against 643 under 15 MJ/m²; 735 were too dull, 7 had too few bright days before them (the history's first weeks), and none lacked intervals.
- **Winter:** every December 15 and January 15 from 2022 is judged except two dull ones (December 15, 2021 at 33% of a clear day's 10.7 MJ/m², January 15, 2023 at 44%), reading 88 to 116% of the usual peak of about 5.5 kW.
- **The route:** `/api/checks/daily` answered 200 `text/plain` in 0.11 s: `ok solar peak: November 9, 2026's peak was 89% of the usual bright-day peak (6.0 of 6.7 kW)`, a November day the 15 MJ/m² rule couldn't have judged. The query takes 46 ms.

## Rollout

Released as v2026.11.10.8 on 2026-11-10. Its Deploy run passed, connected throughout; onyx kept the result 0 and runs the merge commit, and teslasolar.report answered 200. Then on onyx:

- **The route:** `/api/checks/daily` from the running container: `ok solar peak: November 9, 2026's peak was 89% of the usual bright-day peak (6.0 of 6.7 kW)`.
- **The timer:** `tesla-next-daily-check.timer` enabled from the deployed clone's units; `list-timers` shows it due at 07:00 Pacific (15:00 UTC), beside the Monday audit. Started once by hand, the service exited 0, logged the same `ok solar peak` line and sent nothing. The line is logged under the script's name, so `journalctl --user -t checks` shows it and `-u tesla-next-daily-check` shows only systemd's start and finish; README.md now says so.
- **The weekly run:** `tesla-next-weekly-audit` started by hand took 23 s; the dashboard audit and all three weekly checks passed through `deploy/checks`, its log keeping their lines, and nothing was sent.
