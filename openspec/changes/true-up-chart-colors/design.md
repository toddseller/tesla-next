# Design

## Context

`components/true-up/cycle-chart.tsx` draws imports and exports as one sign-stacked Recharts bar series pair, and the running net as one `Line` per true-up year in `var(--primary)` with a dot at every point. See proposal.md for why the colors change.

## Goals / Non-Goals

**Goals:**
- Match the export tint Home's Today chart already uses, so "sent to PG&E" looks the same on every page.
- One red mark on the chart.

**Non-Goals:**
- Changing the tooltip, last year's line, the projected band or the cycle list.

## Decisions

- **Export tint: `var(--color-grid)` at `fillOpacity` 0.55.** Home's "Sent to PG&E" area uses exactly that, so reusing the number keeps the two pages identical. A separate token or a new hex was the alternative; it adds a color the design system doesn't have.
- **Running net: `var(--foreground)`, `dot={false}`.** The text color is the design system's neutral for a primary line; muted gray is already last year's dashed line, so it would blur the two.
- **The red dot: one Recharts `ReferenceDot` at the last row with a running net.** It sits outside the per-year lines, so no line needs to know whether it is the latest. A per-line `dot` function was the alternative; it repeats the "is this the last point" test in every line.

- **No zero line across the bars.** With imports and exports in one gray family, the chart's mid-gray zero line along their seam made All time's dense bars look wavy off-axis (a café wall effect); hiding it removed that, where a lighter export tint or a gap at zero did not. The grid's own line at 0 stays, behind the bars.

## Risks / Trade-offs

- [The 0.55 gray reads close to the chart's background on some screens] → Home's Today chart already ships it on the same card color; check both at 1440 and 390 in the branch container.
