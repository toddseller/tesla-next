# Design

## Context

See proposal.md for why and the delta specs for the behavior. What shapes the approach:

- **Production's figures** (read-only, 2026-11-11):
  - `meter_day` holds PG&E's daily import and export from 2023-10-06. Statements (`true_up_statement_cycle`) go back to November 2024. Nothing reaches further, and anton can't fetch earlier PG&E data.
  - Before 2026-04-27, on days where Tesla read at least 1 kWh, PG&E-to-Tesla ran at a median 2.09 for import (5th to 95th percentile 1.86 to 2.79) and 2.11 for export (1.88 to 3.09). Days from 2026-04-28 match within about 1%.
  - On 310 of the 930 days before the fix, Tesla's steps recorded under 0.5 kWh of import while PG&E read some, up to 9.4 kWh, 843 kWh in all. A grid draw Tesla didn't see at all can't be found by scaling what it did see.
  - Tesla's daily table (`data`) and the sum of its own 5-minute steps (`energy_interval`) differ by a median 0.2 kWh of import, and on a few days by 12 kWh. A rule for the steps can therefore only agree with PG&E's reading, not with the daily table.
- **Daily figures are already corrected:**
  - `lib/range.ts` builds the SQL fragments `gridIn`, `gridOut`, `house`, `houseGrid` and `houseSolar`, which use PG&E's reading on days before `METER_FIX_DATE` that have one, plus `dailyItem` in TypeScript.
  - `lib/impact.ts` and `lib/top-ten.ts` use those fragments; True-Up has its own (`lib/true-up/grid.ts` and `savings.ts`, with their own `METER_FIX_DATE`).
- **5-minute steps are read raw** in `lib/intervals/intervals.ts`: `dayCharging` reads them, and `dayIntervals` and `lib/car-charging.ts` build on it. `lib/patterns.ts` reads them in three queries.
- **Top Ten's VPP switch** is the pattern to follow: its choice is in the address, the page reads it in `app/top/page.tsx`, its buttons call `router.replace`, and the route takes `vpp=with`.

## Goals / Non-Goals

**Goals:**
- One place that defines the corrected window and both corrections, so every page agrees.
- Tesla's figures unchanged in the database, so "As Tesla reported" is just the uncorrected read.

**Non-Goals:**
- Correcting days before 2023-10-06.
- Any change to True-Up, anton, `meter_day` or the weekly meter check.
- A switch on Distribution. Its replay takes the corrected default from `/api/intervals`.
- Making Tesla's daily table and its steps agree with each other.

## Decisions

### One module for the window

`lib/meter.ts` holds `METER_FIX_DATE` (2026-04-27), `FIRST_METER_DAY` (2023-10-06), and `type Readings = "corrected" | "tesla"` with `readingsOf(params)`, which is `"tesla"` only for `readings=tesla`. `lib/range.ts` and `lib/true-up/grid.ts` import the date from it instead of each keeping its own.

`FIRST_METER_DAY` is a constant because PG&E's data can't reach further back, so it won't move. A query for `min(date)` on every page would only cost time.

### Daily: the existing fragments take the choice

`range.ts`'s fragments become functions of `readings`, with the corrected condition `false` for `"tesla"`. Every sum keeps its float8 casts and order, so corrected totals round exactly as they do today. `dailyItem(row, readings)` mirrors this. `rangeTotals`, `impactFigures` and `topTen` pass the choice through.

### 5-minute: spread each day's difference

One SQL builder, `energySteps(readings)` in `lib/intervals/steps.ts`, returns the step columns that `intervals.ts` and `patterns.ts` select.
- **Corrected:** it joins `meter_day` for days before the fix and takes window sums per `day`: the steps' import, export, solar, home use from the grid and home use from the Powerwall.
  - The import difference (PG&E minus the steps) is shared out by each step's home use from the grid, and added to `grid_imported_wh` and `house_from_grid_wh`. A day with no home use from the grid shares it by home use from the Powerwall, or evenly if it has neither.
  - The export difference is shared out by `solar_generated_wh`, added to `grid_exported_from_solar_wh` and taken from `house_from_solar_wh` with `greatest(0, …)`.
  - A negative difference (PG&E below Tesla, rare) is shared out the same way. Each flow is kept at zero or more, as `day-intervals` requires non-negative flows.
- **`"tesla"`:** it selects the stored columns.

Why grid draw first: the Powerwall's own meter read right, so a step it fed was already right, and the grid draw Tesla missed fed the steps that drew from the grid. The rule first planned shared the import by home use from the grid and the Powerwall together. Task 3.3 measured it on production (Results): it lifted Powerwall-fed nights that read right (July 2025 from 696 to 887 W), and fell short on grid-fed ones (October 2025 at 498 W), because the Powerwall's steps took part of the day's shortfall. On a day with no grid draw at all, the Powerwall-fed steps are the only times the house wasn't on solar, so they take it.

Where a charge session's energy is placed (`homeExcess`) still reads Tesla's stored home use, so a session lands in the same steps in both views.

Alternatives considered:
- **Scale each step by the day's ratio.** It fails on the 310 days with nothing to scale, and it would put no import at all on nights the Powerwall ran.
- **Spread evenly over the day.** It puts grid import into sunny middays, where the meter's readings say the house was exporting.

Exactly when the missing draw happened can't be known from a daily meter reading. The rule places it plausibly, and its total is exact.

### The switch

`components/readings-switch.tsx` is two buttons in the presets' style (`presetStyle`), labelled "Corrected" and "As Tesla reported". It's built like Top Ten's VPP group: `router.replace` to the same address with `readings=tesla` added or removed, and other parameters kept.

Each page shows it when its span reaches `[FIRST_METER_DAY, METER_FIX_DATE)`:
- **Solar:** the range, or the strip's range on a day view.
- **Impact:** its range.
- **Patterns:** the earliest month it shows, which is in the window until April 2027.
- **Top Ten:** always, since its rankings span every year.

The note from the spec sits under the figures. The pages' data calls, and their reloads through `useReload` and `/api/*`, carry the choice, so a live reload stays in the chosen view.

### Where the switch sits

The mockups (https://claude.ai/artifact/FNEFKV1pgTYLsbYnRrCzpq, production's October 2025 both ways) settled it: the switch sits in the page header beside the range presets, the same place as Top Ten's VPP switch, rather than under the chart. On Top Ten it sits beside the VPP switch, and on Patterns at the right of the title. At phone width it takes its own full-width row above the presets. The note goes under the figures. The day view puts it in the stepper's row.

### Kept memories keep both views

`patternsMonths` and `chargingDays` add the choice to their keys, so a finished month is kept once per view. The rewrite hook clears them as before.

## Risks / Trade-offs

- [Where in the day a corrected step's extra import sits is an estimate] → The day's total is PG&E's. The note says grid figures use PG&E's readings, and the design records the rule.
- [Corrected Patterns figures change what Always on and House use show for 2023 to 2026] → That's the point. The browser check compares one month's Always on figure with the expected effect (grid-fed nights near the Powerwall-fed level).
- [Where in the day a corrected day's missing import sat can't be read from a daily meter reading] → The grid-draw rule places it on the steps Tesla saw drawing from the grid. Task 3.3's comparison shows the months it leaves on the Powerwall unchanged and the grid-fed ones about doubled.
- [Window sums over Patterns' 13 months, about 110,000 steps] → It's one scan with windows per day. The branch check times Patterns cold, and its kept months keep later visits warm.
- [`readings` must reach every reload] → A test per page asserts that the reload URL carries it, and the browser check flips the switch and waits for a reload.

## Results

- **The import weighting (task 3.3), 2026-11-11, production read-only:** Always on's monthly figure, June 2024 to October 2026, three ways. "Design" shares the import by home use from the grid and the Powerwall. "Grid first" is the rule shipped.

  | Month | Tesla | Design | Grid first |
  |---|---|---|---|
  | 2024-07 | 780 | 880 | 862 |
  | 2024-11 | 300 | 657 | 657 |
  | 2025-01 | 300 | 592 | 592 |
  | 2025-06 | 804 | 930 | 816 |
  | 2025-07 | 696 | 887 | 696 |
  | 2025-08 | 648 | 803 | 672 |
  | 2025-10 | 288 | 498 | 620 |
  | 2025-11 | 276 | 643 | 643 |
  | 2026-01 | 252 | 532 | 532 |
  | 2026-07 (after the fix) | 840 | 840 | 840 |

  Summer months, which ran on the Powerwall overnight, stay close to Tesla's figures under grid first. Winter months, which ran on the grid, about double. November now reads 657 W (2024) and 643 W (2025) where it read 300 and 276. Grid-only weighting with no Powerwall fallback gave the same figures, apart from small differences in four summer months of 2024.

- **Branch container (task 5.2), 2026-11-11:** onyx, reading production read-only.
  - October 2025's `/api/range` and `/api/impact` answered byte for byte as teslasolar.report does today (corrected). With `readings=tesla`, the month read 147.2 kWh of grid and 1,096.2 kWh of house, against 299.7 and 1,261.8 corrected, and Impact read 70% self-powered (31% grid) against 39% (61%).
  - December 10, 2025's 5-minute steps imported 24.32 kWh corrected, PG&E's reading exactly, against Tesla's 12.35.
  - Patterns' November rows read 569, 657, 643 and 864 W for 2023 to 2026, where they read 264, 300, 276 and 864. The year-over-year jump to 2026 falls from +588 W to +221 W.
  - Patterns took 0.62 s cold in Tesla's view and 0.07 s warm. The corrected view is warmed at start (caches warmed in 4.9 s, about 1 s more than before) and answered in 0.12 s.
  - In Chrome at 1280 pixels: on Impact for October 2025, "As Tesla reported" changed the ring from 22/17/61 to 50/20/31, put `readings=tesla` in the address and changed the note. A reload kept the view. There was no CSP violation.
  - Not checked: 375 pixels (the browser window wouldn't shrink below its screen's width).
  - It was then gone through in a second browser through the same tunnel, and found right.

## Migration Plan

Release as usual (ask first). No data or schema change. Rollback is the previous release.
