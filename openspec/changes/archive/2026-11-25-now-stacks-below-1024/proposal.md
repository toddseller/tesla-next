# Proposal

## Why

The 2026-11-24 night critique's one P1: at 768 pixels the Home page's Now chapter puts its sentence and the house scene side by side, which leaves the scene about 250 pixels wide and its labels colliding. The chapter splits at 768 because the sentence column keeps up to 26rem, and the scene only gets a readable width (about 500 pixels) from 1024 up.

## What Changes

- Below 1024 pixels the Now chapter stacks: the sentence, then the scene at the content's full width. From 1024 up it stays side by side as today.
- The heading and the sentence keep their current sizes at every width.
- The Year chapter moves its split to 1024 too. At 768 its readout's day buttons overflow the narrow column beside the chart and the whole page scrolls sideways by 60 pixels (on the live site as well). Below 1024 the readout, its day buttons and its link sit above the chart, as on a phone, and the chart is at most half the window's height.
- The spec's "Below 640 pixels" (which the code never matched; it split at 768) becomes "Below 1024 pixels", with a scenario for a 768-pixel window.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: "The house scene in Now" stacks the scene under the sentence below 1024 pixels instead of 640, and gains a 768-pixel scenario; "A day from the year" puts the readout beside the chart from 1024 instead of 768, and gains a 768-pixel scenario.

## Impact

- `components/home/now.tsx` (the chapter's grid) and `components/home/now.test.tsx`.
- `components/home/year.tsx` (the chapter's grid, the chart's height cap, the readout column) and `components/home/year.test.tsx`.
- No route, data, dependency or env var changes.
