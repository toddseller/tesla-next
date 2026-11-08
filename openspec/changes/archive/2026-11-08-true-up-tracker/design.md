# Design

## Context

See proposal.md for why. Flask computes the page's data in about 600 lines of Python: `services/meter_reads.py` (read dates, billing cycles, true-up years), `models/data.py` (`daily_grid`, `cycle_row`, `get_sheet_data`, `get_true_up_cost` and its comparable years, last year and projections), `services/true_up_cost.py` (segments, segment charges, pricing, minimum delivery, surplus, projections) and `services/vpp_credit.py`. It reads `meter_read`, `rate_revision`, `nsc_rate`, `true_up_statement`, `true_up_statement_cycle`, `vpp_payout`, `meter_day`, `energy_interval` and `data`, all written by anton-tesla-api-ws. anton's tests for them (`test_meter_reads.py`, `test_reports_sheet.py`, `test_true_up_cost.py`, `test_true_up_cost_api.py`, `test_vpp_credit.py`, about 100 tests) and its page's helpers (`utils/trueUp.js` with its tests) are the port's reference.

tesla-next already has what the page shell needs from changes 3 and 4: the address-backed range (`parseRange`, `datesLabel`), `RangeControls`, `useReload`, `useLiveStream`, `pyRound`, `dateError`, the compare scripts' `compareAll`, and Recharts through shadcn's chart component.

## Goals / Non-Goals

**Goals:**
- `/api/true-up-years`, `/api/cycles` and `/api/true-up-cost` equal to Flask's for every true-up year, All time and a sweep of custom ranges, checked on onyx before the page work builds on them.
- Pure pricing functions that take rates as data, so anton's pricing tests port without a database.

**Non-Goals:**
- Writing anything: rate, read schedule and Net Surplus Compensation refreshes, statement and bill imports, VPP payouts and their push notifications stay in Flask.
- Reloading on an import: Flask's imports send no event, so a newly imported bill shows on the next load. Making it live needs an anton change.
- anton's `/numbers` redirect, which belongs to teslasolar.report until change 7.

## Decisions

**Modules follow Flask's, under `lib/true-up/`.**
- `reads.ts`: read dates (stored or estimated), `billingCycles`, `trueUpEndYear`, `trueUpLabel`, `trueUpYears`.
- `grid.ts`: `dailyGrid` (one query per range over `meter_day` and `energy_interval`), `cycleRow` and `cycles`.
- `pricing.ts`: `segments`, `segmentCharges`, `priceDays`, `minimumDelivery`, `amountDue`, `surplus`, `project`, `projectNet`. Pure: each takes the rate revisions as an array.
- `cost.ts`: `trueUpCost`, with comparable years, last year, projections and the VPP season, loading the rate revisions once per request.

Flask queries `rate_revision` for every segment and day. One load gives the same revision for each day, since the table only changes when Flask's daily refresh adds a row.

**Python's two roundings, kept apart.** `round(x, n)` is `pyRound`. `cents()` is `Decimal(str(x)).quantize(..., ROUND_HALF_UP)`: half up on the shortest decimal that reads back as the double. JavaScript's `String(x)` gives the same shortest digits as Python's `repr` (only the exponent notation differs, e.g. `1e-07` against `1e-7`), so `cents` rounds the digits of `String(x)` half up as a decimal string, never through `toFixed`. Its tests include the bill's lines and ties such as 0.125 and 2.675.

**Sums as Flask makes them.**
- `daily_grid` sums integer Wh in SQL, which PostgreSQL returns as `bigint`. The `pg` driver hands those back as strings, so they are converted with `Number`; that is exact far past these totals.
- Per-cycle and per-segment totals are sums of integers, so their order doesn't matter. Flask divides by 1000 only after summing, and so does the port.
- Peak is `extract(hour from timezone('America/Los_Angeles', start_at))` from 16 to before 21, as Flask's SQL has it.
- The running nets and projections add one-decimal kWh in cycle order, as Flask does, before `pyRound`.

**The page reads the functions; the routes exist for reloads and parity.** Each route has the same `dateError` checks as `/api/range`: 400 with a message and no query on a bad date. `/api/true-up-cost` answers Flask's full shape, including `rates_effective` and the VPP fields. The server page calls `trueUpYears`, `cycles` and, for a true-up year, `trueUpCost`. The client reloads `/api/cycles` and `/api/true-up-cost` together on a `totals` event for a day from the first shown cycle's first day to the last's last day. That covers a year's last cycle running past September 30, which anton's `trueUpRefetchRange` covered.

**Text helpers ported from anton's `utils/trueUp.js`** to `lib/true-up/text.ts`, with its tests: net labels, cycle dates, charges, the estimate line, the billed line, the projection and the VPP wording. Where mockup A changed the wording, the tests change with it ("$118.81 credit", tile titles). They stay client-safe, apart from `lib/true-up/cost.ts`, which imports the database.

**The year picker extends `RangeControls`** with an optional `earlier` list: a Popover menu button ("Earlier") beside the presets that shows the picked year's label and is marked selected when it holds the shown range. The Solar and Impact pages pass nothing and are unchanged. The presets (This year, the two before it, All time) and the menu come from `trueUpYears`, so the current year turns over on the October read, as Flask's does, not on October 1 as the Solar page's True-up year preset does.

**The chart is a Recharts `ComposedChart`**, one slot per cycle:
- **Bars:** imports and exports share one stack, so they sit in the same slot. Exports are drawn as negative numbers, with `stackOffset="sign"`. Imports round `[4, 4, 0, 0]` and exports `[0, 0, 4, 4]`, so the bars are square where they meet at zero. The Solar page's `stackEnds` decides this for a three-part stack, which these two-part bars don't need.
- **Lines:** the running net in `--primary` and last year's running net dashed in `--muted-foreground`.
- **Band:** the projection is an `Area` over `[low, high]`.

Change 3 recorded Recharts' traps; this keeps clear of them:
- It uses `ComposedChart`, because `AreaChart` ignores `Line`.
- It gives each stack its own id.
- It hides the band's outline in the tooltip.

**Tiles from mockup A, chosen by state.** Net always; Charges so far or True-up for a true-up year; Projected true-up for the current year with a kWh projection; Billed against estimate when a billed cycle has an estimate; VPP when the year has a season. The tiles sit in a grid of `minmax(240px, 1fr)`, so they wrap.

**Schema.** `test/schema.sql` is regenerated on onyx with `meter_read`, `rate_revision`, `nsc_rate`, `true_up_statement`, `true_up_statement_cycle` and `vpp_payout` added to its `pg_dump` command, and its header updated.

## Risks / Trade-offs

- [The `cents` port differs from Python's in a last-digit case] → its tests take values from PG&E's bills and anton's tests, and the compare script checks every cycle's charges for every true-up year against Flask.
- [`/api/true-up-cost` is slow for the current year: it builds every comparable year's daily grid and reprices it] → one query per year, a few years; Flask does the same per request. If it shows, the comparable years' grids can be cached per day.
- [Rate revisions loaded once per request miss a revision Flask adds mid-request] → the next request picks it up, as Flask's next request would.
- [Flask's answer depends on today (finished years, the open cycle, projections)] → the compare script asks both apps within the same minute, away from midnight and the October read.

## Migration Plan

Merging deploys nothing. Before the page work, a build of the branch on onyx is compared with Flask, as in change 4. After the release (published by you), `scripts/compare-true-up.mjs` runs on onyx against the deployed app, and the page is compared side by side with teslasolar.report/true-up for the current year, '25 - '26 and '23 - '24. Rollback is the existing `tesla-next-next:previous` image; teslasolar.report keeps its page until change 7.

## Results

- **Before the page work (November 8, 2026, 8:42 a.m. site time):** `scripts/compare-true-up.mjs` found the true-up years equal and no mismatch over 22 ranges each from `/api/cycles` and `/api/true-up-cost`, between Flask and a build of the branch, run on onyx in throwaway containers that were removed afterwards. The answers carried real figures: '25 - '26's 12 cycles from PG&E's statement and its $767.73 true-up, and the current year's $107.56 so far with dollar and kWh projections from '24 - '25 and '25 - '26.
- **Before the pull request:** locally under `yarn build && yarn start`, on a throwaway database seeded with '24 - '25, '25 - '26 and the current year to November 8, the production CSP was in force (no `'unsafe-eval'`) with no violation or console message on `/true-up`. The layouts were checked with Playwright's headless Chromium over the DevTools protocol: one column at 375 pixels with nothing past the edge and every year button one line high, three tiles to a row at 1024 and four at 1440, matching mockup A. This year, '25 - '26, the Earlier menu ('22 - '23, which then named the button and was marked) and the picker (October 10 to 20, 2022) each changed the address. The open menu took mockup A's input border and shadow, so it stands off the tiles under it.
- **Test databases:** the true-up tests all need the same years of meter reads, so each of their files copies `tsr_template` into a database of its own (`test/true-up.ts`), rather than clearing tables other files read.
