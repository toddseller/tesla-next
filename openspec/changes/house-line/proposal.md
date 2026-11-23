# Proposal

## Why

The Solar range chart stacks house use on top of solar and grid, but solar and grid are where the house's energy came from, so each bar counts the same energy twice and stands about twice as tall as the energy involved. The 2026-11-22 design check (round 2, step 4) asked for house use to be drawn apart from its sources.

## What Changes

- Each bar stacks only solar and grid: solar and positive grid from zero upward, negative grid below zero.
- House use becomes a short Home-blue mark across each bar at its own value, a little wider than the bar and edged in the card's color, chosen over a line with dots, a light line and a step line in mockups on 2026-11-23.
- A mark above its bar means the Powerwalls covered the difference; below it, the rest was exported or stored.
- The value axis reaches the higher of each bar's top and its house mark.
- The legend shows the mark for "House, car included".
- Unchanged: the bar details, clicking to open a day or a period, the colors, the grid note and the way columns rise.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `solar-range-chart`: "Bar values" and "Bar shape and labels" change, house use moving from the stack to a mark.

## Impact

- `components/solar/range-chart.tsx` and `lib/solar/bars.ts`, with their tests.
- No change to `/api/range`, the data or the other charts.
