# Proposal

## Why

Chart axis labels across the site draw in Recharts' default `#666`, about 3.0:1 on the card, short of the 4.5:1 the dashboard shell requires for text (critique round 10, P1). The chart container's override, `[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground`, comes from shadcn's chart for Recharts 2. Recharts 3 draws tick text in a `.recharts-cartesian-axis-tick-label` group and keeps `.recharts-cartesian-axis-tick` for the tick lines alone, so the selector matches nothing.

## What Changes

- Every chart's default axis labels take the muted gray (`#9AA3AD`, about 7:1 on the card), as the labels drawn by the site's own tick component already do.
- Affected: Solar's range chart and forecast (dates), the Solar day view's time axis, True-Up's cycle chart (cycles), and Home's Today (kW), Habits (months, W), Records (years, values) and Since 2021 (years).
- `dashboard-shell` gains a scenario naming chart axis labels under "Text is readable".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: The dashboard's design system names chart axis labels among the text that meets 4.5:1.

## Impact

- `components/ui/chart.tsx` (one selector) and `components/ui/chart.test.tsx`.
- No data, API or dependency change.
