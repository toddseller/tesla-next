## Context

The runtime image ships only Next.js's standalone server, so anything that reads the database runs inside the app. `deploy/weekly-audit` already runs weekly on onyx (systemd user timer, Monday 06:30 Pacific) and alerts through `deploy/pushover` with the app's `.env` keys. Read-only checks on 2026-11-09:

- `meter_day` (anton) now has every day to two days ago; on days both cover, Opower reads about 110 Wh a day above PG&E's CSV.
- `data.to_grid` counts solar's exports only; with `energy_interval.grid_exported_from_battery_wh` added, Tesla's exports matched PG&E's within 1% from May 2026, through the VPP months.
- During the fault Tesla read 35 to 50% of PG&E's meter, both ways.
- The third-best day of each month's solar was steady to about 3% across 2022 to 2026, except April 2025 and 2026 (about 8% low, the microinverter fault) and foggy summers (July 2022 at 64 against 76 in 2024).

## Goals / Non-Goals

**Goals:** a Pushover alert within a week of a metering or output fault; silence otherwise.

**Non-Goals:** anything on the site's pages (the owner chose alerts only); correcting past figures; a daily schedule (the meter runs 1.5 days behind, and weekly matches the timer).

## Decisions

- **`/api/checks` in the app, called by the weekly run through `docker exec ... wget http://127.0.0.1:3000/api/checks`.** The route is reachable from outside like every route, but it answers only ratios and dates, no costs or account details; guarding it would add code for nothing private.
- **Plain text, one `ok`/`FAIL` line per check**, so the shell script needs only `grep` (onyx has no `jq` or Node outside containers) and the alert is the failing lines as they are.
- **Thresholds from the data, not guesses:** 10% for the meter (healthy weeks sit within 1 to 2%, the fault at 50%; Opower's 110 Wh a day is under 1 kWh a week); 10 kWh before a direction is judged (summer imports run 6 to 15 kWh a month); 5 days for staleness (normal lag is 1.5). Output fails only below every past year by 5% of the lowest, so a foggy year in the history widens its own margin; April's tight history makes it the sharpest month.
- **Past years for the output check include the fault years:** solar output was little affected outside April, and leaving years out by hand would need updating.
- **In `deploy/weekly-audit`, after the build**, its own section of the log and its own alert title, rather than a second timer and service; the audit's requirement and behavior are unchanged.

## Risks / Trade-offs

- [The output check's first real test is April 2027] → its rule is checked against 2025's April in the tests, from the real figures.
- [A week of VPP exports where Tesla and PG&E disagree on timing at midnight] → weekly totals absorb a day's edge.
- [Opower changes and the meter goes stale] → the stale check is exactly that alert.

## Migration Plan

Release as usual, then copy the updated `deploy/weekly-audit` to onyx with the release (the deploy's clone already has it). Rollback: the previous image; the script's extra step only alerts.

## Results

A throwaway build of the branch on onyx (2026-11-09; its image's 1,370 tests passed), reading production read-only, removed afterwards:

- `/api/checks` passed all three: Nov 1 – 7, 2026, Tesla's imports 99% and exports 98% of PG&E's meter over 7 days both have; PG&E's readings run to November 7; the third-best day of Oct 10 – Nov 8 is 43.5 kWh against 4 past years' lowest of 40.3 kWh.
- The meter query on fault weeks fails as it should: March 1 – 7, 2025 at 48% (imports) and 51% (exports); September 1 – 7, 2025 at 47% and 48%.
- `data.powerwall_to_grid` carries the Powerwalls' exports: within 1% of `energy_interval`'s battery exports for August to October 2026 (79.1 against 79.8, 52.8 against 53.3, 52.3 against 52.9 kWh).
- Review finding fixed before commit: only days both PG&E and Tesla have are compared, so a day anton missed can't read as Tesla running short.
