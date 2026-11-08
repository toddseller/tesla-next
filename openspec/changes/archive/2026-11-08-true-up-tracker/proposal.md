# Proposal

## Why

The True-Up Tracker shows where the house stands for its PG&E NEM true-up: grid energy by billing cycle, the running net through the true-up year, and the year in dollars. It still runs on anton-tesla-api-ws's React app and three Flask endpoints (`/api/v2/true_up_years`, `/api/v2/sheet`, `/api/v2/true_up_cost`). It is the fifth page in the migration series, redesigned from mockup A (https://claude.ai/artifact/LmzFa4KyBHmnrPoR17hfie), with its VPP credit as a tile on top and the year picker from the same canvas.

## What Changes

- **`/true-up` moves to tesla-next**, replacing its "not moved yet" placeholder, with the same functionality as anton's page except where this list says otherwise.
- **The range lives in the address** (`/true-up?start=2025-10-01&end=2026-09-30`), rendered on the server with its data. A missing or invalid range shows the current true-up year.
- **The page is laid out as mockup A:** a row of tiles (the net; the charges so far or the true-up; the projected true-up, or PG&E's bills against the estimate; the VPP credit), then the cycle chart, then the cycle list. anton's lines of text become tiles, and the VPP credit moves from a footnote to a tile.
- **The year picker keeps its size as years pass:** This year and the two years before it as buttons, every earlier year in an "Earlier" menu, All time, and the date picker. anton listed one preset per true-up year.
- **The chart moves from Chart.js to shadcn charts (Recharts),** as the Solar page did. Each cycle's import bar rounds only at its top and its export bar only at its bottom, square where they meet at zero.
- **The flows take the dashboard's colors:** imports in the grid color, exports in the solar color, the running net in Tesla red.
- **The page stays current:** a `totals` event for a day in the shown cycles reloads its data, as `totals_updated` does on anton.
- **The reads are ported to TypeScript:** billing cycles from PG&E's stored meter reads (or the estimate for years without them), each cycle's grid energy from PG&E's readings and the 5-minute intervals, and the true-up cost (segments split at season and rate changes, the baseline credit, the minimum delivery charges, Net Surplus Compensation, the projections, last year's running net and the VPP credit). Flask stays the writer: refreshing rates, read schedules and Net Surplus Compensation rates, importing statements and bills, and recording VPP payouts all stay in anton-tesla-api-ws.
- **Three routes answer as Flask's do,** so a script can check the port against Flask: `/api/true-up-years`, `/api/cycles` and `/api/true-up-cost`, like `/api/v2/true_up_years`, `/api/v2/sheet` and `/api/v2/true_up_cost`. The page reads the same functions directly. Change 7 (cutover) retires them with Flask.
- **Not moved:** anton's `/numbers` address, which redirects to `/true-up`, belongs to teslasolar.report until change 7.

## Capabilities

### New Capabilities
- `true-up-cycles`: PG&E's billing cycles and true-up years from the stored meter reads, each cycle's grid energy and its NEM charges with their source, and `/api/true-up-years` and `/api/cycles`. Taken from the read-side requirements of anton's `pge-billing-cycles`, `pge-meter-usage` and `true-up-cost`.
- `true-up-cost`: a true-up year in dollars (charges so far, amount due, credit left over, Net Surplus Compensation, the dollar and kWh projections), last year's running net, the VPP season, and `/api/true-up-cost`. Taken from anton's `true-up-cost` and `vpp-credit`, without the imports and refreshes Flask keeps.
- `true-up-tracker`: the page: its address, defaults and year picker, tiles, chart, cycle list, notes, layout and staying current. Taken from anton's `true-up-tracker`, `pge-billing-cycles`' presets and `vpp-credit`'s page requirement.

### Modified Capabilities
- `dashboard-shell`: "Pages not yet moved link to the live site" takes its example from the Top Ten page, the last one still to move.

## Impact

- **New code:** `app/true-up/page.tsx` (replacing the placeholder), `components/true-up/`, `lib/true-up/` with `app/api/true-up-years`, `app/api/cycles` and `app/api/true-up-cost`, and `scripts/compare-true-up.mjs`.
- **Shared code:** the range controls take a year menu beside their presets.
- **Database (read-only, unchanged):** reads `meter_read`, `rate_revision`, `nsc_rate`, `true_up_statement`, `true_up_statement_cycle` and `vpp_payout` for the first time, with `meter_day`, `energy_interval` and `data`. `test/schema.sql` gains the new tables.
- **Dependencies:** none added; Recharts is already pinned.
- **Docs:** `README.md` gains the three routes and the compare script.
- **Unchanged:** teslasolar.report, Flask's endpoints and writers, the Solar, Impact and Distribution pages, and the Top Ten placeholder.
