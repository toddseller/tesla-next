# Proposal

## Why

Critique round 8 (2026-11-24, P2) found that on a phone the Distribution page hides its replay bar about 3 seconds after opening, leaving only a 3px progress line along the scene's bottom edge, though Home's link promises "See the house live, with replay". A visitor who doesn't think to tap the scene never learns replay is there. The hiding buys nothing back: under 1024px the bar sits below the scene and covers none of it, so hiding it only shortens the card and makes Today so far jump each time the bar slides in or out.

## What Changes

- The replay bar shows at every window width, all the time, as it already does from 1024px up. It no longer hides after its last use, or shows on a tap, a moving mouse or keyboard focus, below 1024px.
- The progress line that stood in for the hidden bar on phones goes, since the bar is never hidden.
- The bar no longer slides into and out of view below 1024px; its placement is otherwise unchanged (over the scene's bottom from 1024px, below the scene under it).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-replay`: "Replay bar shown on demand" and "Progress line" are removed; "Replay bar" says the bar always shows; "Replay bar placement" is replaced by "Replay bar position", the same placement without the slide and its reduced-motion scenario.

## Impact

- `components/scene/distribution.tsx` loses the show-on-demand state, the progress line and the drawer's open and close transition.
- `components/scene/replay-bar.tsx` loses `onHold`, which only told the page to keep the bar shown.
- Their tests: the show-on-demand, progress-line and holding tests in `components/scene/distribution.test.tsx` and `components/scene/replay-bar.test.tsx` go; one phone-width test takes their place.
- Phones see a taller page by the bar's height. No API, data or address changes.
