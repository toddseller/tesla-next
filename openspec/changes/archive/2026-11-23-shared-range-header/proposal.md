# Proposal

## Why

The scorecard drafted after the round 3 design check (`.impeccable/scorecard.md`) fails Solar, Impact and True-Up on three range checks: their preset rows differ (3, 6 and 5 buttons, with Custom only on some), their headers differ (True-Up turns its h1 into a small label over a 32 px headline), and reaching a year like 2022 on Solar takes about 48 clicks, since the calendar pages one month at a time. One header pattern with one preset core, a year jump and step arrows fixes checks 1, 2 and 5.

## What Changes

- **One preset core, in one order.** This month, This year, True-up year, All time, then the dates button. Impact keeps Today and This week in front of the core. Solar gains All time. True-Up shows the core's tail, True-up year and All time; its '25 - '26 and '24 - '25 buttons and its Earlier menu go (**BREAKING** for anyone used to one click to a past true-up year: it becomes one press of True-up year's previous button per year).
- **Step arrows on the selected preset.** A preset stays selected for any range of its shape (a day, a Sunday to Saturday week, a calendar month, a calendar year, an October to September true-up year) and holds previous and next buttons that step by that shape. Stepped away from its own range, it reads the range's name ("October 2026", "'25 - '26"), and choosing it brings its own range back. The dates button lights only for a range no preset's shape fits. Next is disabled once the next span would start after today, and previous once it would end before the first day of service.
- **Year jump in the picker.** The date-range picker's month captions become a month list and a year list, bounded by the first day of service and today, so any year is two interactions from the open picker.
- **One header.** On Solar's range view, Impact and True-Up: the 22 px h1 and the range controls share a row, with the lead sentence under it at the shared lead size. On a phone: h1, lead, then the controls. True-Up keeps its h1 at full size, and its headline becomes the lead at the shared size, the projection line staying muted under it.
- Mockups: "Range header mockups" (https://claude.ai/artifact/5UH2SjiNEt56iQDu82u2Fw), at 1440 and 390, and the picker with its year list.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: owns the shared range header: the header order, the preset core, stepping the selected preset and its name for a stepped range and the picker's month and year lists; the phone menu, dates button and keep-the-reader's-place rules lose True-Up's Earlier years.
- `solar-range-chart`: its presets become the core, adding All time.
- `impact-report`: the heading's row holds the step arrows too.
- `true-up-tracker`: the year picker becomes the core's tail with arrows; the headline becomes the page's lead under a full-size h1.

## Impact

- `components/solar/range-controls.tsx` (arrows, picker captions), `lib/solar/ranges.ts` (the core, the step by shape, True-Up's presets), `components/solar/solar-page.tsx`, `components/impact/impact-page.tsx`, `components/true-up/true-up-page.tsx`, with their tests.
- The Impact Backup section's own year picker keeps its Earlier menu (`backup-history`); `PresetGroup` keeps `earlier` for it.
- Out of scope: Patterns (no range; its lead is check 11), Impact's All time lead, Solar's day view header, the other scorecard changes.
