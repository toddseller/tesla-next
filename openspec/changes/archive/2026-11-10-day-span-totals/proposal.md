# Proposal

## Why

The day view gives a day's totals, but questions about part of a day ("how much did we import after solar export stopped?") need adding up 5-minute steps by hand. On 2026-11-09 the answer was 8.67 kWh imported from 4:00 PM to midnight, against 22.19 kWh for the whole day, and nothing on the page shows it.

## What Changes

- **Selecting a span.** Dragging across a day view chart with a mouse selects that span of time, snapped to whole 5-minute steps. On touch screens, a Select toggle turns a finger drag into a selection, since touching the chart already shows the values under the finger. A click or tap without a drag still just shows the values. The span is shaded on the chart and named by its times ("4:00 PM to 12:00 AM"), with Clear.
- **The span's totals.** At 640 pixels and wider, each headline keeps the day's total with the span's total under it, and each breakdown gains a column for the span beside the day's. Under 640 pixels the span's figures replace the day's, with their own shares.
- The span stays when switching views (Solar, Home, Vehicle, Powerwall, Grid) and when the open day reloads, and clears when another day opens. On today, a span past the newest interval counts only what has arrived.
- **Exact energy per step.** `/api/intervals` records also carry each flow's Wh, so a span covering the whole day matches the day's totals exactly. Summing the rounded kW instead shows a different 0.1 kWh on 11 of 180 day-and-flow totals over the last 30 days.

Out of scope: selecting across days, keeping a span in the address, and the Distribution page's replay.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `solar-day-view`: selecting a span on a day's charts and showing its totals.
- `day-intervals`: a new requirement, each record's energy per flow in Wh.

## Impact

- tesla-next:
  - `lib/intervals/intervals.ts`: Wh per record.
  - `lib/solar/day-views.ts`: a span's totals from its records, reusing `viewSummary`.
  - `components/solar/day-view.tsx`: dragging, the toggle, the shading, the headlines and the breakdown columns.
  - Their tests.
- Mockups first, on a new canvas: the day view with a span selected, at desktop and phone widths.
- No new dependency, env var or version pin. `/api/intervals` grows by ten numbers a record, which the Distribution page ignores.
