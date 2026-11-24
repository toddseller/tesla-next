# Tasks

## 1. Replay bar always shown on a desktop

- [x] 1.1 Test first in `components/scene/distribution.test.tsx`: after the bar hides, the drawer carries no `translate-y-full` and the progress line carries `lg:hidden`. Run it and see it fail on the slide.
- [x] 1.2 Drop the desktop slide from the drawer and hide the progress line from 1024px in `components/scene/distribution.tsx`; the test passes.

## 2. Today so far at every width

- [x] 2.1 Test first in `components/scene/today-so-far.test.tsx`: at a wide screen the block renders its seven figures and link, with no `sm:hidden`, and the grid carries `sm:grid-cols-4 lg:grid-cols-7`; drop the "no block on a wide screen" test. Run it and see it fail.
- [x] 2.2 Remove the `matchMedia` gate and `sm:hidden` from `components/scene/today-so-far.tsx` and widen the grid; update the component comment and `TodayTotals`' comment in `components/home/today.tsx`. The test passes.

## 3. Verify

- [x] 3.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`; the repo has no lint script).
- [x] 3.2 `yarn build && yarn start`: at 1440 x 900 the bar still shows after 5 seconds at rest, with no progress line; the totals sit in one row below the scene; at 1024 and 768 the figures wrap as specified; at 390 nothing changes. Give the owner the URL to check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive desktop-distribution`, then open the PR.
