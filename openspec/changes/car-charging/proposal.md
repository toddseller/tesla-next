## Why

The cars are the household's biggest load (about 330 kWh a month into them at home), and nothing on the site says where that charging came from. The Wall Connector's history now reaches back to 2025-10-20, and the interval code already splits each 5 minutes of charging across solar, Powerwall and grid for the Distribution replay, so the Impact page can answer "how much of the cars' charging was sunshine?" for any range.

## What Changes

- Impact gains a **Home car charging** section (mockup A, https://claude.ai/artifact/MMFUCmT5BXdHjfiwfnZYiZ), between "Where the home's energy came from" and Backup, for the picked range:
  - a ring of the solar, Powerwall and grid shares of home charging, with the share off the grid in its middle, and the kWh into the cars;
  - a line per car with its kWh and its own solar, Powerwall and grid bar, counting only charging the Wall Connector measured for that car;
  - "since" notes where the data starts: the household from the first stored charge session (2025-10-20), the cars from the first measured interval (2026-10-17);
  - a range in the covered period with no charging says so; a range entirely before it says there is no charging data.
- A new `GET /api/car-charging?start_date=&end_date=` answers the section's figures; the page reloads them with the rest on `totals` events and a reopened stream.
- Home charging only (the Wall Connector); energy only, no dollars.
- **anton companion:** anton's vehicle refresh replaces the whole `vehicle` table, so a car that leaves the account (both cars are leased, and the Tesla T.I.E. Fighter is due to be replaced) would lose its name. anton keeps a departed car's row, with its last name and `streamed` false, so its history keeps that name here and in the Distribution replay.

## Capabilities

### New Capabilities

- `car-charging`: home charging's split by source and by car over a range, its data route, and the Impact section that shows it.

### Modified Capabilities

- `day-intervals`: a car that has left the account keeps the last name stored for it, instead of "Vehicle"; and a charge session's energy is placed in the stretch of its recorded duration with the most extra load within 24 hours of plug-in, instead of walking 12 hours from plug-in and stopping after 30 quiet minutes, which dropped about a third of the backfilled sessions' energy (design.md, Results).

## Impact

- New `lib/car-charging.ts`, `app/api/car-charging/route.ts`, a section in `components/impact/`; `app/impact/page.tsx` and `components/impact/impact-page.tsx` load and reload it.
- `lib/intervals/intervals.ts`: the charging placement inside `dayIntervals` is taken out into a function both use, so the replay's answers don't change.
- anton-tesla-api-ws: `services/vehicles.py`'s `refresh()` upserts instead of deleting (a companion change in that repository; the owner runs it there).
- `lib/intervals/gap-estimates.ts` (`placeSessions`) and the session loading in `intervals.ts`: the new placement rule, which also changes the Distribution replay's session days.
- No writes from tesla-next; no new tables.
