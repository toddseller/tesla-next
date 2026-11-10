## Why

Tesla's grid figures read about half of PG&E's meter from at least June 2022 until the April 2026 microinverter fix, and nothing noticed. anton now keeps PG&E's own readings (`meter_day`) current every morning from Home Assistant's Opower statistics (anton change `pge-meter-from-opower`), so the system can check itself: Tesla's grid figures against the meter, and solar output against its own history.

## What Changes

- **Meter check:** over the newest 7 days `meter_day` has, Tesla's grid imports against PG&E's, and Tesla's exports (solar's and the Powerwalls') against PG&E's. Each must be within 10%; a direction with under 10 kWh on PG&E's side that week isn't judged.
- **Stale meter:** PG&E's newest day more than 5 days old fails, since the meter check then has nothing new (Opower stopped, or anton's job did).
- **Output check:** the third-best day of solar in the last 30 days against the same 30 days of each past year since 2022; it fails when below every past year's by more than 5% of the lowest. Run over past data, it would have flagged April 2025.
- A read-only route, `/api/checks`, answers each check's line, and the existing weekly run on onyx (the dependency audit's timer) asks the running container for it and sends a Pushover alert naming each failed check. A passing week sends nothing.
- Alerts only: nothing new shows on the site's pages (the owner's choice).

## Capabilities

### New Capabilities

- `system-checks`: the meter, stale-meter and output checks, their route, and their weekly alert.

### Modified Capabilities

None. The weekly audit's own requirement is unchanged; the run gains a second step.

## Impact

- New `lib/checks.ts`, `app/api/checks/route.ts` and their tests; `deploy/weekly-audit` gains the check step; README's Weekly audit section.
- Reads `meter_day`, `data` and `energy_interval`; no writes, no new tables, no new settings.
