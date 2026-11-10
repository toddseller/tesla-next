# Proposal

## Why

From April 11 to 23, 2026, failing microinverters capped the array at about 4.2 to 4.9 kW, half its usual peak, and about 330 kWh went unmade until the owner noticed and Tesla replaced them. The weekly output check compares the third-best day of 30, so a fault has to fill most of its window before it shows: had it run then, its Monday run on April 20 would have passed, its window still holding April 2 to 5's 60 to 63 kWh days. Now that anton's forecast history reaches back to 2021-10-10, a day's peak can be judged against the sunlight forecast for it. Replayed over 2021 to 2026, a day-by-day peak rule fires on April 13, the fault's first bright day, and on only one other day in five years: 2025-08-28, a second fault nobody noticed, when output fell to about 0.5 kW under a clear sky for two days and cleared on its own.

## What Changes

- A new check, solar peak: on a bright day (forecast sunlight at least 60% of a clear day's for that date, measured from every year's stored forecasts), yesterday's highest 5-minute solar output fails when it is under 60% of the middle peak of the bright days in the 30 days before it. A seasonal measure of bright, because no November to January day reaches a fixed summer level.
- `GET /api/checks/daily` answers that check's line, in the weekly checks' `ok`/`FAIL` form.
- A daily run on onyx, with its own systemd user timer beside the Monday audit, asks the running site for the daily checks every morning and sends a Pushover alert with a failing line, or when the site doesn't answer. A passing day sends nothing.
- The weekly checks stay as they are.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `system-checks`: a daily solar peak check against the forecast, its results route and its daily alert.

## Impact

- `lib/checks.ts` (the check), `app/api/checks/daily/route.ts`, `lib/checks.db.test.ts`.
- `deploy/daily-check` with `deploy/tesla-next-daily-check.service` and `.timer`, installed on onyx by hand like the weekly audit's.
- `README.md`, the Weekly audit section, for the daily run and its install.
- Reads `solar_forecast` and `energy_interval`; nothing on the pages changes.
