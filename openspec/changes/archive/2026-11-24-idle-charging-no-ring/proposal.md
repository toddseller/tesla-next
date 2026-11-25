# Proposal

## Why

The 2026-11-24 evening critique found that on a day or range with no home charging, Impact's car charging section still draws its ring, empty, with "0%" and "off the grid" in the middle. The number reads as "the grid did all the charging", when the car simply didn't charge. Impact's other empty states, no backup events and a range before any charging data, already show a sentence and no chart.

## What Changes

- A range inside the covered period with no charging shows only the line "No home charging on November 9, 2026" (or "in" for a longer range): no ring, no percentage, no shares and no car lines.
- The spec stops promising "0 kWh" and an empty ring for that case; the page never showed "0 kWh".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `car-charging`: "A range with no charging" drops the 0 kWh figure and the empty ring for a sentence alone.

## Impact

- `components/impact/car-charging.tsx` and its test.
- No route, data, dependency or env var changes.
