# Design

## Context

Recharts 3.8 gives every default tick label the class `recharts-cartesian-axis-tick-value` and a `fill` attribute of `#666`; a CSS `fill` beats the attribute. The site's own `AxisTick` (`components/solar/axis-tick.tsx`) draws its own `<text>` in `fill-muted-foreground`, so value axes that use it are fine; the default ticks are not.

## Goals / Non-Goals

**Goals:** every default axis label on every chart in `ChartContainer` reads in the muted gray.

**Non-Goals:** setting value-axis ticks in Plex Mono (Today's kW, Habits' W, Records' values are Plex Sans today); the tick font is a separate question from contrast.

## Decisions

- **Fix the selector in `ChartContainer`**: `[&_.recharts-cartesian-axis-tick-value]:fill-muted-foreground`, targeting the class Recharts puts on the text itself. One line reaches every chart, rather than passing a `tick` to some thirteen axes. It also covers Today's `TimeTick`, which receives that class.
- **The Solar day view is included.** Its sections keep their own styling, but its time axis is in `ChartContainer` and fails 4.5:1 like the rest; its value axes already use the muted gray through `AxisTick`.
- **Test the selector against the rendered DOM**: render a chart with an axis in jsdom and check the container's `fill-muted-foreground` variant selects the tick text. jsdom doesn't apply Tailwind, so the test checks that the selector reaches the element, which is what broke.

## Risks / Trade-offs

- [A later Recharts renames the class again] → the test fails on the upgrade instead of the contrast failing silently.
