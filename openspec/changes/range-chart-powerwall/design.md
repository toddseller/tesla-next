# Design

## Context

`rangeTotals` in `lib/range.ts` builds `/api/range`'s items: daily ones in JavaScript from the `data` columns (`dailyItem`), and period ones from SQL sums, each rounded to one decimal place. `lib/solar/bars.ts` names the series (`solar`, `grid`, `house`) and decides which section of a stack rounds (`stackEnds`). `components/solar/range-chart.tsx` draws the stack with recharts, the house as a mark, a legend, the details and the note, and sizes the value axis from the most negative grid and the tallest of solar plus positive grid or house.

Checked against production for October 2026: house minus solar minus grid matches the Powerwalls' own columns to the tenth on every day (on VPP days too, since the grid figure there already leaves out the Powerwalls' export), and meter-corrected days move house and grid by the same amounts.

## Goals / Non-Goals

**Goals:** every bar's stack accounts for its house mark; the chart reads as the mockups do.

**Non-Goals:** gross charge and discharge, and any change to the figures the chart already shows.

## Decisions

- **The Powerwall figure is the remainder, computed from the rounded figures:** `powerwall = round1(house - solar - grid)`, once each item's own figures are rounded, for daily and period items alike. That makes a bar's sections always add up to its house mark exactly, which is the point of the section, and needs no new SQL or columns. Alternative: sum `house_from_powerwall` and the Powerwalls' charge columns. Rejected: it agrees within rounding, but needs the VPP rule repeated for it and can leave a 0.1 kWh gap between the stack and the mark. When any of the three is null, so is the Powerwall.
- **One more series in `SERIES`,** in stack order `solar, grid, powerwall, house`, and `stackEnds` orders the sections as the spec stacks them: negative Powerwall, negative grid, solar, positive grid, positive Powerwall. The section, legend and details reuse the grid's handling, in the shell's `--color-powerwall`.
- **The value axis** takes its low from the negative grid plus negative Powerwall, and its high from solar plus the positive grid and Powerwall, or the house, whichever is taller.

## Risks / Trade-offs

- [The remainder hides any day where Tesla's figures don't balance] → Accepted: the production check found none in October 2026, and the chart is not where data errors would be diagnosed.
- [A 0.1 kWh Powerwall section on days that balance to within rounding] → Accepted; it draws as a hairline at most.
