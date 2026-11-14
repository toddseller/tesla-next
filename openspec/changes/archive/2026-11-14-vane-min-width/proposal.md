# Proposal

## Why

When the wind blows from about SSE or NNW, the weather vane's arrow points straight at the viewer or straight away, and it narrows to a hairline less than a pixel wide. On teslasolar.report, with wind from the SE, the arrow measured 0.77 px wide, so the vane looked like it had lost its arrow. A real vane seen end-on looks the same, but on screen it just looks broken.

## What Changes

- **The arrow never narrows past a minimum width.** Near end-on it keeps a narrow but visible plate, with its tip down toward the viewer for a southerly wind and up into the picture for a northerly one. The minimum is chosen in the mockups.
- **Shaking near end-on doesn't flick the arrow from side to side.** Exactly end-on, the arrow has no side, so within that narrow zone it keeps the side its wind direction gives.
- Every other direction, the swing, the shake and the readout stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-weather`: "Vane points into the wind" gains the minimum width near end-on, and the arrow keeps its side while it shakes there.

## Impact

- **Code:** `vanePose` and the frame loop in `components/scene/live-scene.tsx`, and its tests in `components/scene/live-scene.test.tsx`.
- **Mockups:** the arrow from SSE and NNW at a few candidate minimum widths, by day and at night, at 1440 and 390 px, before any code.
- **Data and dependencies:** none.
