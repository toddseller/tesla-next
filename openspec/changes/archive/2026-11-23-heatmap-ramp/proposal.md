# Proposal

## Why

On the dark theme, the house-use heatmap's heaviest step is its darkest blue, so the hours the house uses most sink into the card while the lightest use stands out. Home's year chart runs the other way: brighter means more. The 2026-11-22 design check (round 2, step 3) asked for the heatmap to match.

## What Changes

- The seven house-use steps keep their blues and kW bands, in reverse order: under 1 kW is the darkest blue (#213C86) and 3.5 kW and up the lightest (#D4E1FA). Home's blue becomes the third step instead of the fifth.
- The key keeps its order, 0.5 to 3.5+ kW, so it now runs dark to light.
- DESIGN.md's note on the heat scale says the new order and why.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `patterns-page`: the use steps run from darkest to lightest, so heavier use is lighter.

## Impact

- `app/globals.css`: the `--color-use-1` to `--color-use-7` values, reversed.
- `DESIGN.md`: the Home flow color's heat scale note.
- No change to the steps' kW bands, the markup or the data.
