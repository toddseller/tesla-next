# Proposal

## Why

Critique round 6 (2026-11-24, P1) found Feb 4, 2024 showing two solar totals: 5.9 kWh on the range chart and 15.7 kWh in its day view. The daily row in `data` stopped updating at 12:39 that day, when the outage began, and nothing finished it; the 5-minute intervals held the whole day. The row and Mar 11, 2023's (also frozen, short in house use) were re-saved from Tesla's history with anton's `backfill_history`. Nothing noticed either for over two years. A weekly check would have caught each within a week.

## What Changes

- A new weekly check, `solar totals`, compares each day's solar total in `data` with the sum of its 5-minute intervals in `energy_interval`, over the 7 days to yesterday, and fails for any day where they differ by more than 0.5 kWh, naming each such day and both figures.
- Solar only: it is measured apart from the grid, so the 2022 to 2026 grid metering fault doesn't touch it, and Tesla's day ending at 11:55 p.m. before anton's interval cutover adds no solar. Over the whole history, no row the collector finished normally is more than 0.5 kWh off; Feb 4, 2024 was the only one.
- `GET /api/checks` gains the check's line, so the weekly run on onyx alerts on it with no change to the server's scripts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `system-checks`: a new check of each day's solar total against its 5-minute intervals.

## Impact

- `lib/checks.ts` (a new check, added to `allChecks`) and `lib/checks.db.test.ts`.
- `README.md`'s description of the weekly run's checks.
- No page, API shape, dependency or server-script changes; the check only reads.
