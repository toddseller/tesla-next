# Design

## Context

`ReadingsSwitch` (`components/readings-switch.tsx`) is one component used by the Solar range view, the Solar day view (`day-panel.tsx`), Impact, Patterns and Top Ten, each placing it in its heading's controls row. A `Term` is a popover trigger button, so it can't sit inside the switch's own buttons. See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- One place to add the label, so every page gets it.
- Impact keeps its heading and controls on one row from 1024 pixels.

**Non-Goals:**
- Moving or rewording the note under the figures.
- A hint for Top Ten's VPP switch.

## Decisions

- **The label lives inside `ReadingsSwitch`.** The component returns the label `Term` and the group together, so all five places get it without touching their pages. Passing the label in from each page was the alternative; it repeats the same words five times.
- **The label sits above the switch at every width.** Beside it, the label pushed Impact's controls off its heading's row at 1024, where the row had no room to spare; above it, the row keeps its width on every page. The rows holding the switch (Solar's range and day views, Impact, Top Ten) align their controls along the bottom, so the switch stays level with the presets, steps and VPP switch beside it.
- **The group keeps `aria-label`, now "Grid readings".** Pointing `aria-labelledby` at the `Term` button would name the group by a button, which screen readers announce oddly; a plain label of the same words is simpler.
- **Definition text:** "From October 6, 2023 to April 26, 2026, Tesla read about half the grid energy PG&E's meter recorded. Corrected uses PG&E's readings for those days; As Tesla reported shows Tesla's own."

## Risks / Trade-offs

- [The label makes each controls row about one line taller] → the heading row centers on it; check that the headings still read as aligned at 1024, 1440 and 390.
