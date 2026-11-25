# Tasks

## 1. The bar always shows

- [x] 1.1 Test first: in `components/scene/distribution.test.tsx`, replace the "replay bar shown on demand" and "progress line" groups with one test: under 1024px, 5 seconds after opening, untouched, the replay bar is in the page with no `data-shown` drawer state, and there is no progress line; and the same after a replay starts playing and runs 5 seconds. Run it and see it fail on the bar being hidden and the line showing.
- [x] 1.2 In `components/scene/distribution.tsx`, delete `BAR_SHOW_MS`, the show-on-demand state (`recent`, `hover`, `holds`, `poke`, `onHold`, `onHover`, `onMouseMove`, `barShown`) and the card's pointer and key handlers, the progress line, and the drawer's 0fr/1fr grid and transition; keep one wrapper carrying `lg:absolute lg:inset-x-0 lg:bottom-0` so the bar still overlays the scene from 1024px, and update the comments that describe the hiding. The new test passes.
- [x] 1.3 In `components/scene/replay-bar.tsx`, delete `onHold` and everything that only feeds it (`focusVisible`, the keyboard `onFocus`/`onBlur`, `holdMenu`, `onScrub`), keeping the date picker's open state so picking a day still closes it. Delete the "holding the bar shown" tests in `components/scene/replay-bar.test.tsx`; the bar's other tests still pass.

## 2. Verify

- [x] 2.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 2.2 `yarn build && yarn start`: Distribution at 390 x 844 shows the bar below the scene after 5 seconds untouched, with no progress line and no jump in Today so far; at 768 the same; at 1440 x 900 the bar still overlays the scene's bottom with POWERWALL readable. Check the bar's height at 390 and that the first screen still reads well. Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive replay-bar-always-shows`, then open the PR.
