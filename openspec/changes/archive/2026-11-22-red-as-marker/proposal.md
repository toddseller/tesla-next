# Proposal

## Why

DESIGN.md says Tesla red is a marker, never a surface: the selection line, the outage dot, a chart's record ring and running-net line. The live critique found two places that fill an area with it: Top Ten's "this year" band behind each timeline, and True-Up's "Projected" band in the billing-cycle chart, whose maroon also competes with the red running-net line it projects.

## What Changes

- **Top Ten's "this year" band** becomes a neutral shade, the muted foreground at low opacity, as Since 2021 shades a year.
- **True-Up's projected band** and its swatch in the chart's key become the same neutral shade, so the red running-net line is the only red in the chart.
- **The site's date pickers** (the Solar day view's, the Solar custom range's, admin's) show a chosen day as the site's other selections do, the raised slate with the red underline, instead of a solid red square with a white number. Distribution's replay calendar keeps its red, as the house scene keeps its styling.
- Every red marker stays: the selection line, the #1 ring, the running-net line, the "this year" dots beside runners-up, the outage dot.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The specs say the year is shaded and the projection is a band; neither names its color, so no requirement changes (`skip_specs`).

## Impact

- `components/top-ten/timeline.tsx` (the band's fill).
- `components/true-up/cycle-chart.tsx` (the band's fill and its key swatch).
- `components/ui/calendar.tsx` (a `MARKER_SELECTED` class the site's pickers pass; the calendar's default is unchanged), `components/solar/day-panel.tsx`, `components/solar/range-controls.tsx`, `components/admin/day-field.tsx`.
