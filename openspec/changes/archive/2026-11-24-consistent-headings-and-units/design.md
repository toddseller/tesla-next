# Design

## Context

See proposal.md, Why. Each page formats energy itself: `energy` in `components/impact/sections.tsx` is the only one that switches to MWh; the rest are local `whole`, `tenth` and `kwh` helpers (`lib/lead.ts`, `components/home/since.tsx`, `components/home/year.tsx`, `lib/true-up/text.ts`, `components/patterns/powerwall-use.tsx`, `components/top-ten/entries.ts`, `components/home/records.tsx`, `components/solar/range-chart.tsx`). Many places set the number and the unit apart: Home's `Figure value unit`, True-Up's `Tile value unit`, Top Ten's `best.value` and `best.unit`, and lead sentences that wrap the number alone in `{}` for mono. Energy axes put the unit on the top tick through `unitOnTopTick(" kWh")`.

## Goals / Non-Goals

**Goals:**
- One function decides kWh or MWh, so the threshold and precision live in one place.
- Keep the number and the unit separable, because most callers style them apart.

**Non-Goals:**
- Daily figures (Today, the day view, the forecast, Backup's event rows): they never reach 1,000 kWh, so they keep their formatters.
- kW and W figures.

## Decisions

- **`energy(kwh, digits, top = kwh)` in `lib/units.ts` returns `[value, unit]`.** `lib/units.ts` already holds the site's display units. When `top` is 1,000 kWh or more the value is MWh with one decimal and thousands separators; below it, kWh with `digits` decimals (0 where a place shows whole kWh today, 1 where it shows tenths) and thousands separators. Callers join the pair for sentences and pass the halves to `Figure`, `Tile` and Top Ten. A tuple over a string avoids parsing the unit back out; over an object, it reads as `const [value, unit] = energy(x)`. Signs and absolute values stay with the callers, as they are now.
- **Axes take their unit from the top tick.** `energyTick(tick, topTick)` beside `energy` divides each tick by 1,000 when the top tick is 1,000 kWh or more and keeps the tick's own round step ("0, 20, 40 MWh", not energy's forced tenth); the axes keep `unitOnTopTick` for the unit. Since 2021's axis, which shows no unit today, gets the same treatment, which answers the critique's minor note.
- **A list takes its largest figure's unit.** `energy` takes an optional `top` (the list's largest figure, compared by size so a negative figure counts) that picks the unit for the whole list; Top Ten's rankings, Patterns' Powerwall rows, True-Up's projected range and the range chart's tooltip pass it, so a list never mixes units and Top Ten's head unit still names every row. Records' step chart and figures go through `energy` too.
- **Headings use the section label classes already in use** (`text-sm font-medium tracking-[0.06em] text-muted-foreground uppercase`), copied to each heading rather than lifted into a component: there are a dozen headings, and the classes are the design system's own spelling everywhere else. Backup's year span keeps `font-normal` so the year reads lighter than the word.
- **The savings card's dollars need no change.** `CountUp` renders its text through `Measured`, which sets each figure in Mono and leaves the words around it in the sans; a span-wide `font-mono` would break the existing words-in-sans test. A test pins the figures in Mono.
- **"House" in Impact only where Impact speaks in prose.** API fields (`home`) and the flow color token stay; they name the Home flow.

## Risks / Trade-offs

- [A tenth of a MWh hides up to 50 kWh] → Accepted with the owner's pick; the screen reader labels follow the same rule so sighted and spoken figures agree.
- [Tests elsewhere quote kWh totals over 1,000] → The specs that did (`solar-range-chart`, `true-up-tracker`, `patterns-page`, `home-story`, `site-motion`) carry deltas in this change; their tests follow those scenarios. `true-up-cost` and `system-payback` quote kWh as calculation inputs, never shown, and stay.
- [A billing cycle can pass 1,000 kWh (1,125.1 in the live data)] → The cycle rows stay in kWh as PG&E's bill prints them (owner's choice, 2026-11-24), written into `display-units` as an exception.
- [A True-Up tile's Imported and Exported can land in different units] → Each figure carries its own unit instead of one shared "kWh" at the end of the line.
