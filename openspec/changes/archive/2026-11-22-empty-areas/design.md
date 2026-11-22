# Design

## Context

See proposal.md for why. The year chapter's right column is a flex column whose energy-mix block has `mt-auto`, so it is pushed to the bottom of a column as tall as the heatmap. Habits' row is a grid with `items-end`. Since 2021's x-axis ends at the later of today and the end of the whole system's payback year (`since.tsx`, `end`), and draws that year as a `ReferenceArea`. True-Up's tiles are a `repeat(auto-fit, minmax(240px, 1fr))` grid, so at the page's 1,136-pixel width four fit and a fifth wraps.

## Goals / Non-Goals

**Goals:** no large empty areas at 1440 pixels; each chart shows real data to its edge.

**Non-Goals:** the Payback card (complete, as the live page shows once its marks draw in); any page's figures or wording besides Since 2021's line about the projected year.

## Decisions

- **Year and Habits are layout only.** Drop `mt-auto` from the energy-mix block so it follows the readout; Habits' row uses `items-start`. Neither has a spec requirement on position, so no spec changes for them.
- **Since 2021's axis ends at today.** `end` becomes today. The solar payback month stays a dotted line when reached. A whole-system year already reached stays a shaded box, clipped at today: in the year it pays back the box runs past the axis, and Recharts would otherwise drop it whole. A projected one leaves the chart and becomes a sentence under it, replacing "dashed box: …", so the chart's key reads only what's drawn. The chart's text summary keeps saying the projected year.
- **One row from 1280 pixels, with no count.** At `xl` the tiles flow into a single row of equal columns whatever their number, so five share it and fewer simply widen. Each tile is a size container, and its figure is 28 pixels when the tile's content is under 180 pixels wide and 34 otherwise: five across leaves about 168 pixels, and every other layout at least 194, so only the five-across tiles shrink it; the widest real figure, a projection range like "$609–$655", fits a 214-pixel tile. Below 1280 the grid is as before.

## Risks / Trade-offs

- [A future figure wider than "$609–$655" could crowd a five-across tile] → the figure may wrap at its en dash, and the screenshots check the widest real one.
- [Since 2021 no longer shows the projected year on the time axis] → the Payback card on True-Up, which Since 2021 links to, draws it on its own timeline.
