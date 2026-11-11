# Proposal

## Why

In the top bar's live pill, the amber and blue squares before SOLAR and HOME sit about 1.1 px below the middle of their labels, while the live dot beside LIVE is centered (0.25 px off). Measured on teslasolar.report at 4x on 2026-11-11, after live-flows-pill's release. The squares use `align-middle`, which puts their middle at the baseline plus half the height of a lowercase "x". The labels and figures are capitals and digits, which stand taller. The dot is centered by flexbox instead.

## What Changes

- Each flow in the pill becomes a small group centered the way the dot is: the square, then the label with its figure ("SOLAR 4.6 kW").
- The " · " after each flow keeps its spaces, so the pill's text, its spacing and its width stay as they are.
- Nothing else in the bar changes.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. `dashboard-shell` already says each power follows a square in its flow color; how the square sits against its label is styling, which no requirement covers (`skip_specs`).

## Impact

- `components/top-bar.tsx` (the flow's markup) and `components/top-bar.test.tsx`.
- The first change checked under the new rule for UI changes: zoomed screenshots, compared with the mockup and the dot, and the owner's OK before pushing.
