# Proposal

## Why

The 2026-11-24 critique found small places where the site's figures and words disagree with themselves: Patterns' "512 since 2021" sits over yearly cycles that add up to 511, Home's Since 2021 gives the true-up year's net twice side by side, the house's use without the car is "car apart" while the house with the car is "car included", two short lines end on a lone last word, and DESIGN.md leaves out True-Up's 34px figures. Each is small, but together they make a careful reader double-check the site.

## What Changes

- Patterns: the cycles since the first year are the sum of the yearly rows' cycles, so the tile matches the rows below it.
- Home's Since 2021: the current true-up year's net is given once, in the explanation sentence; the 24px net figure and its label beside the chart go. True-Up's dollar estimate leads that column.
- The house's use without the car reads "without the car" everywhere it said "car apart": Home's Today ("used by the house, without the car"), Distribution's Today so far, and the Solar day view's headline ("Total Usage, without the car").
- True-Up's tile lines wrap balanced and Impact's car charging subtitle wraps with `text-pretty`, so neither ends on a single word.
- DESIGN.md names True-Up's tile values and the savings card's lead figure (34px, 28px in a narrow tile) as lead figures, and keeps 18px for the savings card's breakdown figures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `patterns-page`: the cycles since the first year are the rows' sum.
- `home-story`: Since 2021 gives the net once, in its sentence, with no net figure; Today's house figure reads "without the car".
- `live-flow-scene`: Today so far says the house's use is without the car.
- `solar-day-view`: the Home view's headline on a day with car data reads "Total Usage, without the car".

## Impact

- Code: `lib/patterns.ts`, `components/home/since.tsx`, `components/home/today.tsx`, `lib/solar/day-views.ts`, `components/true-up/tiles.tsx`, `components/impact/car-charging.tsx`, and their tests (`lib/patterns.test.ts`, `components/home/since.test.tsx`, `components/home/today.test.tsx`, `components/scene/today-so-far.test.tsx`, `lib/solar/day-views.test.ts`).
- Docs: `DESIGN.md`.
- No API, data or dependency changes. Energy totals on Patterns keep their own rounding; only the cycles total changes.
