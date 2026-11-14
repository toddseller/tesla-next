# Proposal

## Why

On the Impact page, Solar offset's bars uncover with their right end rounded at 4px, then snap to 8px when the uncover ends. A bar that fills its track hides the snap behind the track's own corner, but a short one, like solar on a dull day, shows it plainly.

## What Changes

- The uncover keeps the corner its bar rests with: Solar offset's bars stay at 8px from their first frame to their last, so nothing changes shape when the motion ends.
- Bars that already rest at the uncover's corner (the Solar page's forecast bars) and bars with no resting clip (Patterns, backup, car charging, savings) look the same as today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-motion`: adds that a bar's corners stay the same while it uncovers as when it rests.

## Impact

- **Code:** the `motion-uncover` keyframes in `app/motion.css` and Solar offset's bars in `components/impact/sections.tsx`, with their tests in `app/motion.test.ts` and `components/impact/sections.test.tsx`.
- No mockups: the bars keep the shape they already rest with.
