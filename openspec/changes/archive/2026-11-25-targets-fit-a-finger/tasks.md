# Tasks

## 1. A tap area for inline words

- [x] 1.1 Test first: in `components/term.test.tsx`, a hinted term's button carries the `tap-area` class. Run it and see it fail.
- [x] 1.2 Add `@utility tap-area` to `app/globals.css` (`position: relative`; an empty `::after`, `position: absolute`, `inset: -6px 0`) and give the `Term` trigger the class; the test passes.
- [x] 1.3 In `DESIGN.md`, beside the 44px navigation and 40px segment rule, add that inline words that act (hints, links in text) take `tap-area` for a tap area at least 24px tall; `grep -n "tap-area" DESIGN.md` finds it.

## 2. Backup day links

- [x] 2.1 Test first: in `components/impact/backup-section.test.tsx`, every link to a day (event rows, a storm day, Longest, Closest call) carries `tap-area`. See it fail.
- [x] 2.2 Give the four `Link`s in `components/impact/backup-section.tsx` the class; the test passes.

## 3. Replay controls on phones

- [x] 3.1 Test first: in `components/scene/replay-bar.test.tsx`, the previous-day, next-day and play buttons carry `max-lg:size-11`; Day, Speed and LIVE carry `max-lg:min-h-11`; the Time input carries `max-lg:h-11` and draws its track through `[&::-webkit-slider-runnable-track]` and `[&::-moz-range-track]` classes. See it fail.
- [x] 3.2 In `components/scene/replay-bar.tsx`, add those classes: `IconButton` centered at `max-lg:size-11`; Day, Speed and LIVE at `max-lg:min-h-11`; the input transparent, `h-1 max-lg:h-11`, its 4px track on the runnable-track and moz-range-track pseudo-elements, and the WebKit thumb at `-mt-1.5` so it centers on the track. The test passes.

## 4. Verify

- [x] 4.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 4.2 `yarn build && yarn start`, at 390 x 844 and 1440 x 900, measured with `getBoundingClientRect` and `elementFromPoint`: every Term trigger's tap area (top bar STORM WATCH if active, True-Up's terms, Grid readings) and every backup day link is at least 24px tall, and the lines and rows around them are as tall as on `main`; at 390 every replay control is at least 44px and a point 15px above the scrubber's track hits the input; at 1440 the replay bar is as tall as on `main` and POWERWALL stays readable; the scrubber's track and thumb look right in Chrome and Firefox. Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive targets-fit-a-finger`, then open the PR.
