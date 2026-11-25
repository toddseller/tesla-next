# Proposal

## Why

On a phone, tapping a day on Home's year chart changes a readout that sits under the chart, below the screen: at 390 by 844 its top is at 891 pixels, so the visitor taps and sees nothing change (critique round 7, P1). From 768 pixels the readout's column already stays beside the chart; below that it needs to sit where the finger can't hide it and the screen still shows it.

## What Changes

- Below 768 pixels, the chart's explanation and the day card (the hint, the readout with its previous and next buttons, and "Open the day") move above the chart; the year's shares stay below it.
- Below 768 pixels, not only below 640, the chart is held to half the screen's height, so on a small tablet the readout above it and a tapped row near its foot are on screen together.
- From 768 pixels nothing changes: the column stays beside the chart and in view.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: "A day from the year" adds that below 768 pixels the readout sits above the chart, with the chart at most half the window's height, so the day a visitor taps is shown on screen.

## Impact

- `components/home/year.tsx` (layout classes only) and `components/home/year.test.tsx`.
- No data, API or other page changes.
