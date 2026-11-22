# Proposal

## Why

The live critique found large empty areas at 1440 pixels that make finished pages read as unfinished: about 450 pixels of nothing between the year chapter's day readout and its energy-mix bar, Habits' chart pinned low in a tall row, roughly 30% of Since 2021's chart given to an empty future out to 2028, and True-Up's fifth tile (Tesla VPP credit) alone on a second row. The critique also said the Payback card had no "now" or projected mark; it does, drawing them in one after another, and the critique caught it midway, so it is left as it is.

## What Changes

- **The year chapter:** the energy-mix bar and its link follow the day readout, rather than sitting at the bottom of the column.
- **Habits:** the chart aligns to the top of its row, beside the text, rather than its bottom.
- **Since 2021 ends at today.** The chart runs from October 2021 to today, all of it real data. A payback already reached stays marked on it (solar's month, and a whole-system year once it has passed); a projected whole-system year is said in words under the chart, "The whole system is projected to pay back in 2028", rather than drawn as a box in an empty future.
- **True-Up's tiles fit one row on wide screens.** With five tiles, they sit five across from 1280 pixels, their figures a little smaller there so each fits, wrapping as now on narrower screens.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: Since 2021's chart ends at today, and a projected payback year is said in words.
- `true-up-tracker`: Layout fits five tiles on one row on wide screens.

## Impact

- `components/home/year.tsx`, `components/home/habits.tsx` (layout only).
- `components/home/since.tsx` (the axis's end, the marks, the line under the chart).
- `components/true-up/tiles.tsx` (the grid and the figure size at five across).
