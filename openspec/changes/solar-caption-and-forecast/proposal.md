# Proposal

## Why

Critique round 5 (2026-11-24, P2) found two places where the Solar page's range view says something that isn't so for the range shown: under monthly bars the chart's note says the Powerwalls stored more than they gave back "that day", and the live Solar forecast card, today and the next three days, sits under past ranges such as 2023 or April 2023, where it has nothing to do with the bars above it.

## What Changes

- The note under the range chart ends "that day" under daily bars and "that month" under monthly bars, the unit the chart's own caption names (Daily or Monthly).
- The Solar forecast card is served and shown only when the range includes today; a range wholly in the past (or, by address, wholly ahead) is served without it, and without asking for the forecast's data.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `solar-range-chart`: the below-zero note names the bars' unit.
- `solar-forecast`: the card shows only on a range that includes today.

## Impact

- `components/solar/range-chart.tsx`, `app/solar/page.tsx` and their tests (`components/solar/range-chart.test.tsx`, `app/solar/page.test.tsx`, `components/solar/solar-page.test.tsx`, whose forecast tests use a past range and move to one that includes today).
- No API, address, data or dependency changes.
