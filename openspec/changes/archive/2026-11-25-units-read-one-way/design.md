# Design

## Context

`energy(kwh, digits, top)` in `lib/units.ts` already picks the unit from a third figure, and `energyAxis` already puts the unit on the top tick only. True-Up's `Energy` helper (`components/true-up/tiles.tsx`) calls `energy` without `top`, so each figure picks its own unit; its comment says so on purpose. Patterns' axis in `LastTwelve` (`components/patterns/always-on.tsx`) prints the top tick in kW and the middle in raw watts. Home's Habits already shows the always-on difference as signed watts with "about N kWh a day" after it.

## Goals / Non-Goals

**Goals:**
- Each tile and axis reads in one unit.
- Patterns and Home give the always-on difference the same way.

**Non-Goals:**
- Changing `scaleTop`'s 250 W step: a 1,250 W top reads 0.625 in the middle, which is still in the right unit.
- The other mixed-unit places the critique did not name.

## Decisions

- **The tile's figures follow the net, not the larger of the pair.** Taking the unit from the larger figure would print a 448.8 kWh export as 0.4 MWh under a kWh net, losing most of its precision. Following the net keeps the headline and its two totals in one unit; when the net reaches MWh they switch with it. The peak and off-peak nets keep their own unit: under an MWh net a peak of 15.8 kWh would read 0.0 MWh (found in review). `Energy` takes the net as an optional `top`.
- **The axis middle reads `top / 2000`**, the top tick's kW, in place of `top / 2` watts. The axis's top is never under 1,000 W, so a W-only axis case is not needed here; the display-units rule covers it for any later axis.
- **Patterns' Difference reuses Home's form**: the figure is the signed watt gap, and the text after it reads "+14 kWh a day", without Home's "about", so it fits one line in the phone's narrow column. The watt gap is the latest month's watts minus the year-earlier month's, as Home computes it; `kwhPerDay` keeps its current rounding.
- **DESIGN.md follows the code on the focus ring.** The code draws `ring-ring` (Dusk Gray) at full strength in every focusable component. At 50% on Night Sky the ring falls under WCAG's 3:1 for focus indicators, so the doc changes, not the code. The refreshed `.impeccable/design.json` already describes the code.
- **`components/ui/button.tsx` keeps only what the calendar renders.** The calendar is its only user, with the `ghost` variant and the `default` and `icon` sizes. The other variants (including the red `default`) and sizes go, and `ghost` becomes the default variant, so nothing can render red text-on-fill by omission.

## Risks / Trade-offs

- [A later shadcn component expects a removed variant] → `yarn tsc` fails on the unknown variant name, so it can't slip in silently; add the variant back then.
- [The Difference text wraps at 390 px] → the figure already stacks its "after" text under the value below `sm`; check at 390 in the browser.
