# Design

## Context

See proposal.md, Why. The four marks live in three components: `components/home/habits.tsx` (Recharts lines and the figures beside them), `components/home/today.tsx` (Recharts `ReferenceArea` over the hours to come) and `components/top-ten/timeline.tsx` (positioned HTML dots and band).

## Goals / Non-Goals

**Goals:** name each mark where it sits, with the tokens the page already uses.

**Non-Goals:** Patterns' own difference figure stays as it is; no new colors; the timeline's dot positions, axis and assistive description are unchanged.

## Decisions

- **Habits' key is HTML under the chart, not a Recharts `Legend`.** Three short swatch-and-word items in the chapter's muted 13px text, like the Since 2021 chart's named lines. A Recharts legend would list every year, which is what the gray scheme avoids. Last year is `muted-foreground` at full opacity and 1.5px; earlier years stay at today's 0.6 opacity, dropped further to 0.3 so the two grays part clearly.
- **The watt gap is worked out from the two figures already passed in** (`figures.watts - figures.before.watts`), so it always agrees with the two W figures shown above it. The kWh a day stays as `lib/patterns` gives it, so Home and Patterns still agree. The Figure shows the signed watts with its W unit; its label carries "about ±N kWh a day more/less than a year ago" ("about" because the kWh a day is rounded from the watts).
- **"still to come" is the `ReferenceArea`'s own `label`**, placed inside at the top right in the muted foreground at 11px, so it moves with the dimmed area and disappears with it at day's end (the area spans nothing then).
- **Today's axis gains 12 AM at both ends, in `today.tsx` only.** The shared `TIME_TICKS` stay as the Solar day view's ported spec has them. Recharts centers a tick on its time, which hangs midnight's labels half outside the plot (the first under the kW axis), so a small custom tick anchors the first to start and the last to end; `interval={0}` stops Recharts dropping an end label.
- **"this year" is a span inside the band**, top right, 11px mono muted, `aria-hidden` like the rest of the drawing; the band's `title` becomes redundant and goes. Dots #2 to #10 all take `size-5`; 11px numbers fit "10" in 20px.

## Risks / Trade-offs

- [Larger dots for #4 to #10 overlap more where entries cluster, as 2022's solar days do] → the list under the timeline still gives each entry; drawing order already keeps the higher ranks on top.
- [A dot near the top of the current year can cover the "this year" caption] → acceptable: the caption is a hint, and the year marked below the band still names it.
