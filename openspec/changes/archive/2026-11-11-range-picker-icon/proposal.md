# Proposal

## Why

On the Impact page, choosing All time makes the Corrected / As Tesla reported switch appear, and the range controls no longer fit beside the heading: they drop to a second row and every card below moves down, which feels like a glitch. Measured on teslasolar.report at full width, the heading and controls need 1165 px of the 1136 px available. The widest piece is the dates button, 272 px for "Oct 1, 2021 – Nov 11, 2026", and it repeats the dates the card's heading already shows.

## What Changes

- **The dates button becomes a calendar icon.** A 44 px square button with no dates on it, on Solar, Impact and True-Up, which share it. Its name for assistive technology and its tooltip give the shown dates. It shows as selected, as a preset does, when no preset matches the range, so a custom range is still marked in the bar. With it, Impact's heading, switch, presets and icon need about 940 px and share one row in any window from 1024 px up.
- **The picker shows two months side by side** in a window at least 640 px wide, and one month below that. It opens with the range's end month on the right, or the current month when the range ends later, so All time opens on this month and the last rather than on October 2021.
- **The picker stops at today.** Days run from 2021-10-10, the site's first day of service, to today in the site's time zone, replacing the allowance of two years past the visitor's today. Its months page no earlier than October 2021 and no later than the current month.
- **The picker says what to pick:** "Pick a start day", then "Pick an end day" after the first click.
- **On a phone the icon always sits beside the presets menu**, where the wider dates button sometimes went below it (True-Up).
- **Unchanged:** the Corrected / As Tesla reported switch stays in the header; between about 750 and 1000 px wide the controls can still wrap when it appears. The single-day pickers (Solar's day view, Distribution's replay bar), the Backup year picker, the presets, and the addresses and API, which still accept ranges up to 732 days ahead, stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: the dates button is a calendar icon beside the presets, named with the shown dates and marked when no preset matches; on a phone it always sits beside the presets menu.
- `solar-range-chart`: the custom range picker offers days up to the site's today rather than two years ahead, shows two months (one on a phone) opening on the range's end month, and says which day to pick.
- `impact-report`: the custom range picker's limits follow Solar's; the heading and the range controls share one row from 1024 px wide, whichever preset is shown.

## Impact

- **Code:** `components/solar/range-controls.tsx` (the icon, the picker's months, limits and hint), and the pages that pass it the site's today: `components/solar/solar-page.tsx`, `components/impact/impact-page.tsx`, `components/true-up/true-up-page.tsx`. Their tests, chiefly `components/solar/range-controls.test.tsx`.
- **Mockups:** the header at 1280 and 390 px with the icon, and the open picker with two months and with one, before any code.
- **Data, routes and the pages' loading:** unchanged.
