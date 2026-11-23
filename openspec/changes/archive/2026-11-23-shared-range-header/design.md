# Design

## Context

All three pages already draw their range controls with one component, `RangeControls` in `components/solar/range-controls.tsx`, fed a preset list from `lib/solar/ranges.ts`: `presets(today)` for Solar, `impactPresets(today)` for Impact, and `trueUpPresets(years)` for True-Up, which also returns the Earlier years. `PresetGroup` renders a preset row with an optional Earlier menu, and the Impact Backup section uses it directly for its own year picker (`backup-history`), so `earlier` stays on `PresetGroup`. `ranges.ts` already recognizes a range's shape when naming it (`monthOf`, `yearName`, the week test in `rangeNames`). The picker is the shadcn `Calendar` over react-day-picker 10.0.2, which supports `captionLayout="dropdown"`. Solar and Impact already lay out header A; True-Up's header swaps a small label h1 and a 32 px headline in when it has a headline.

## Goals / Non-Goals

**Goals:** one preset list builder for the core, one step function, and every header change inside the existing components; the mockups' look at 1440 and 390.

**Non-Goals:** a new header component (the three headers differ in what they hold: Solar's and Impact's readings switch, True-Up's projection line), and any change to the lead sentences' wording.

## Decisions

- **The core is one list, sliced per page.** `presets(today)` grows All time (2021-10-10 to today), becoming the core. Impact prepends Today and This week to it, as it does now. True-Up takes `[True-up year, All time]` from its years: the current year from `/api/true-up-years` (not the calendar rule, since its current year turns at the October read) and its own All time (2021-10-01 to the current year's end), labelled as the core labels them. Alternative: one fixed list with flags per page. Rejected; the Impact and True-Up ranges differ from the core's by data, not by flags.
- **A step is a pure function of the range.** `step(range, direction)` in `ranges.ts` returns the neighbour span or null: a day, a Sunday to Saturday week, a whole calendar month, a January to December year or an October to September year, in that order of tests; anything else gives null. `RangeControls` disables an arrow when `step` returns null, when the next span starts after `today`, or when the previous span ends before `FIRST_DAY`. Deriving the step from the range, not the preset last clicked, makes a shared address step the same way. Alternative: step a custom range by its length. Rejected in exploration as harder to predict.
- **Arrows live on the selected preset** (option (a) on the mockups canvas, chosen over arrows beside the dates button, which lit the calendar after a step and hid what changed, and over arrows around the whole row). A preset is selected when it gives the range, or else when its range has the shown range's shape (`step(preset.range, 1)?.name === step(range, 1)?.name`); a shape no preset has is a custom range, so Solar's single days light the calendar and have no arrows. On a wide screen the arrows sit inside the selected segment, 32 px wide to keep the segment's 40 px height; on a phone they are 44 px squares either side of the menu button. They push like presets, through `onRange`, so the address, history and kept scroll come for free.
- **A stepped preset reads `rangeTitle(range)`,** the name the tab title already uses ("October 2026", "2025", "'25 - '26", "Nov 22, 2026"), so the button and the title always agree. Choosing it pushes its own range; its tooltip is "Back to" and its label, lower-cased.
- **Only `RangeControls` steps.** `PresetGroup` takes `today` from `RangeControls` and only then selects by shape and draws arrows; Home's year buttons and the Backup section pass none, since their presets are each an exact year and must not light by shape.
- **Padding stays per row.** The review found that narrowing `presetStyle` also tightened the readings switch and Top Ten's VPP toggle; it goes back to `px-3.5`. Impact's row at 1024 still wrapped, by 14 px, on a stepped 2025 week with the readings switch ("Nov 16 – 22, 2025" is the longest name), so the range presets alone take `max-xl:px-1.5`.
- **The year jump is `captionLayout="dropdown"`** on the existing `Calendar`, bounded by the existing `startMonth` and `endMonth`; the shadcn wrapper already styles the dropdowns. The picker's controlled `month` isn't needed: the dropdown moves the shown month itself, and the started pick (`first`) is our own state, so it survives the move.
- **True-Up's header becomes header A** by dropping the label style from its h1 and giving the headline `LEAD`; the projection line keeps its muted 14 px. Its controls move into the same structure as Impact's (heading row, lead under it, `max-sm:order-last` controls), so the phone order matches.
- **`trueUpPresets` loses `earlier`;** `RangeControls` loses its `earlier` prop. `PresetGroup` keeps it for the Backup section.

## Risks / Trade-offs

- [Impact's heading row at 1024 holds the readings switch, six presets and now three squares, about 100 px wider] → Measure at 1024 during apply; if it wraps, tighten preset padding at `lg` before anything else, since the spec keeps one row.
- [Solar's All time is about 62 month-long periods starting on the 10th, since anton's period rule starts at the range's first day] → Accepted: it is how any custom range has always split; check the bars stay readable at 1440 and 390.
- [On True-Up between October 1 and the October read, Next true-up year is enabled and opens a year with no cycles yet] → Accepted for four days a year; check during apply how the page shows a year with no cycles.
- [Past true-up years lose one-click buttons] → True-up year's previous button reaches last year in one press, and each earlier year in one more.
- [A stepped preset's label changes width, so the row shifts as you step] → Accepted; the name is what tells the viewer what changed.
