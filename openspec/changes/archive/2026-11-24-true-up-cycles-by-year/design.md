# Design

## Context

`CycleList` (`components/true-up/cycle-list.tsx`) renders one `<ul>` of rows, each `grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))]`. `auto-fit` collapses empty tracks, so a row with four cells (no charges) spreads them over the width that five cells share in the next row. `CycleChart` draws the running net as one Recharts `<Line dataKey="running">`; `runningNet` (`lib/true-up/text.ts`) already resets the value when `true_up` changes, but Recharts joins every consecutive non-null point. Each `Cycle` already carries its `true_up` label ("'25 - '26").

## Goals / Non-Goals

**Goals:**
- The list's years and columns, and the chart's line, read correctly across true-up years, with no change to the data or the API.

**Non-Goals:**
- Year dividers or year labels on the chart: its month labels already carry the year ("Oct '25") outside a single true-up year.
- The heading style debate (uppercase labels against sentence case) is round 4's group 4; the subheads follow whatever card headings use now.

## Decisions

**One `<Line>` per true-up year.** `chartRows` gives each row its `trueUp`, and `CycleChart` renders a running-net line for each distinct year, its `dataKey` a function that returns the row's running net only for that year's rows. Recharts doesn't draw between nulls (`connectNulls` defaults to false), so each year's line stands alone, and the existing gap for a cycle without data still breaks the line as it does now. The legend keeps one "Running net" entry, and the tooltip still reads `row.running`.
- *Alternative:* a blank slot between years. Rejected: it adds a fake cycle on the x axis and moves the bars.
- *Alternative:* splitting `running` into alternating keys by year parity. Rejected: it does the same thing as per-year lines but is harder to read.

**Five fixed tracks from `sm`, wrapping below it.** Rows keep the `auto-fit` template on phones (the spec's no-sideways-scrolling rule) and from `sm` take an explicit five-track template: the dates track a little wider, then imported, exported, net and charges. A row without charges just leaves the fifth track empty, with no placeholder needed. A range with no charges at all keeps the empty fifth track too, so the rule stays one rule.
- *Alternative:* a fixed template only when some cycle has charges. Rejected: it adds a branch for a range (before charges existed) where the empty column costs nothing.

**Subheads by grouping on `true_up`.** The started cycles are grouped by `true_up` in order. With one group the list renders as now. With more than one, each group renders as an `<h3>` with `yearName(label)` followed by its own `<ul>`, so existing tests that count list items still count cycles only. The footnote stays once, under the last group.
- *Alternative:* subheads as `<li>` items inside the one list. Rejected: assistive technology would count them as cycles, and the tests would need to filter them out.

## Risks / Trade-offs

- [A five-track row at 640 pixels might be too narrow for "Net 363.6 imported" and a charge with its estimate] → check the rendered page at 640, 768 and 1440 pixels during apply; the tracks use `minmax(0, …)` and the cells wrap their text rather than overflow.
- [Several `<Line>`s each run the entrance clip] → the clip applies per line through the same class, as the dashed last-year line already does; check the entrance visually.
