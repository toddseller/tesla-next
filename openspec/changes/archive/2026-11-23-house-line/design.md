# Design

## Context

See proposal.md for why. The chart is a recharts 3 `BarChart` with one stacked `Bar` per flow, each drawn by a custom `Section` shape. `stackEnds` (`lib/solar/bars.ts`) says which sections round, and `riseFrom` scales each section about the zero line so a column rises as one piece (`site-motion`). The value axis is set explicitly with `niceAxis`.

## Goals / Non-Goals

**Goals:**
- House use drawn at its own value, inside its bar's slot, in front of solar and grid.
- The details, clicks and entrance motion work as they do now.

**Non-Goals:**
- No change to the bar details, the data or `/api/range`.
- No change to the day views or the other pages' charts.

## Decisions

**House stays a `Bar` in the same stack, and its shape draws the mark at the house value.**
- Recharts places it in the bar's slot and keeps all three values in the details, as now.
- Its shape ignores the stacked position recharts gives it and finds the house value's y from the plot area and the axis domain, the same arithmetic `riseFrom` uses for the zero line.
- It stacks as 0 (its `dataKey` a function returning 0), so recharts never widens the axis for it. The details still read house from the row. Pinning the axis with `allowDataOverflow` instead also clipped the bars to the plot area, cutting a mark at the axis top in half.
- Alternatives:
  - A `Bar` with its own stack would sit beside the bar, in a second slot.
  - A `Line` or `Scatter` with a custom dot gets the bar's centre but not its width.

**`stackEnds` drops house.** Only solar and grid round their outer ends: the top of the higher section, and the bottom of solar or, below zero, of grid.

**The mark:**
- It's 4px tall with fully rounded ends, in Home blue.
- It reaches past the bar by up to 4px a side (10% of the bar's width on narrow bars), with a 1.5px card-colored edge so it reads over yellow and gray, as mocked.
- It's drawn last, so it lies over both sections.

**Motion and clicks.**
- The mark takes its column's `riseFrom` transform and `--i`, so it rises with its column.
- Clicking the mark opens the day or the period, like the sections.

**The axis top** is the largest of each bar's `solar + max(0, grid)` and its house.

## Risks / Trade-offs

- **[Risk] A reload's animation moves the house `Bar`'s stacked rectangle, not the mark.** The mark is drawn from the row's value, so it moves straight to its new height when the row reloads. Mitigation: none needed, since it matches reduced motion; check a reload in the browser.
- **[Risk] On a phone a full month's marks are narrow.** They keep the 4px height and the card-colored edge; check the 390 screenshot.
