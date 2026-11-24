# Design

## Context

`components/solar/range-controls.tsx` marks a preset when its range equals the shown range (`holds`), else, given today, one of the shown range's shape. All time has no shape, so only its exact dates mark it. True-Up's title and chart heading use `isTrueUpAllTime` in `lib/solar/ranges.ts`, also an exact match. Each page's All time differs: Solar and Impact run 2021-10-10 to today, True-Up 2021-10-01 to the current true-up year's September 30, Backup 2021-10-01 to the same.

## Goals / Non-Goals

**Goals:** one match rule for every page's All time, shared by the controls and True-Up's names.

**Non-Goals:** rewriting the address to All time's dates; naming Solar's or Impact's All time in their titles (they show dates today, and still will); treating a range from True-Up's first billing cycle (Nov 5, 2021) as covering.

## Decisions

- **Covering, measured from the first day of service.** All time holds a range when `range.start <= FIRST_DAY && range.end >= preset.range.end`. Using `FIRST_DAY` rather than the preset's start is what catches the critique's case: True-Up's All time starts October 1, before any data, so a link from October 10 shows the same thing. Alternative, `range.start <= preset.range.start`, misses that case.
- **Found by label.** `holds` moves to `ranges.ts` and treats the preset labeled "All time" this way. The core preset order already fixes that name on every page; a flag on `Preset` would be a new field for one preset.
- **`isTrueUpAllTime` becomes `holds` on True-Up's last preset**, so the title, the heading and the marked button can't disagree.

## Risks / Trade-offs

- [The address keeps the typed dates, so stepping or sharing carries them] → All time has no step buttons and the data shown is the same; a redirect would cost a round trip for no visible change.
- [A future preset named "All time" with a narrower meaning would cover too much] → the label is the core preset's, defined once in the spec's preset core.
