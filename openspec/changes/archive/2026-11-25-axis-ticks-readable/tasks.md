# Tasks

## 1. Axis labels take the muted gray

- [x] 1.1 Test first: in `components/ui/chart.test.tsx`, render a `ChartContainer` with a bar chart and an `XAxis`, take the `fill-muted-foreground` variant from the container's classes, turn its arbitrary selector into CSS (`_` to a space), and expect it to select the tick text (`.recharts-cartesian-axis-tick-value`). Run it and see it fail: the old selector finds nothing.
- [x] 1.2 In `components/ui/chart.tsx`, change the variant to `[&_.recharts-cartesian-axis-tick-value]:fill-muted-foreground`; the test passes.

## 2. Verify

- [x] 2.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 2.2 Branch container on onyx: on `/`, `/solar` (a range and a day), and `/true-up`, a default tick's computed fill is `rgb(154, 163, 173)` at 1440 and 390, with zoomed shots of the axes. Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive axis-ticks-readable`, then open the PR.
