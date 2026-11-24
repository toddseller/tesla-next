# Design

## Context

See proposal.md, Why. The note is fixed text at the foot of `RangeChart`; the chart's caption already picks Daily or Monthly with `isDaily(range)`. The forecast card comes from `app/solar/page.tsx`, which asks for `forecast(today)` on every range view and passes the card to `SolarPage`, which shows it when present and reloads it on today's totals.

## Goals / Non-Goals

**Goals:** the note and the card say only what's true for the range shown.

**Non-Goals:** the forecast's figures, sky or tiles; the day view (already without the card); Home's forecast.

## Decisions

- **The note follows `isDaily(range)`**, the same test as the caption, so the two can't disagree. "That month" for monthly bars, though a bar can be a month-long period such as January 15 to February 14: the caption already calls those bars Monthly.
- **The server decides, not the page.** The route asks for the forecast only when `rangeIncludes(range, today)` and passes `null` otherwise. That spares the forecast queries on past ranges, and `SolarPage` needs no change: with no card served it shows none and reloads none. Hiding the card in `SolarPage` instead would keep the queries and the reloads for a card nobody sees.

## Risks / Trade-offs

- [A page left open past the range's last day keeps its card until reloaded] → only possible for a range ending today; the next navigation or reload drops it.
