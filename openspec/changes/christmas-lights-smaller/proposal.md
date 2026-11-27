# Proposal

## Why

On teslasolar.report the Christmas bulbs read too big for the house. On a phone the 2x scale-up makes them heavy beads, about 6 px tall, along every edge, and on a desktop at about 11 px they are larger than the house's scale suggests. Side-by-side renders of the bulbs at several sizes over the real scene settled the sizes: 0.75 of today's bulb on wider screens and today's unscaled bulb on a phone.

## What Changes

- **Smaller bulbs on wider screens:** the bulb shape is drawn at 0.75 of its size today, about 8 px tall on a 1440 px desktop (it is about 11 px today).
- **No scale-up on a phone:** where the scene's stage is 480 px wide or less, the bulb shape is drawn at its unscaled size, about 3 px tall on a 390 px phone (about 6 px today). The 1.5x and 2x steps go.
- **Unchanged:** the bulbs' places, count, colors, twinkle, switch and season.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `live-flow-scene`: the Christmas bulbs' size on a phone and on wider screens.

## Impact

- **Code:** `components/scene/scene.css` (the bulb shape's scale) and its test, `components/scene/christmas-lights.test.ts`.
- **Nothing else:** the bulbs' layer and places in `components/scene/live-scene.tsx` and `layout.ts` stay as they are.
