# Tasks

## 1. The car ring says self-powered

- [x] 1.1 Test first: in `components/impact/car-charging.test.tsx`, the ring test (renamed "the ring shows the self-powered share, ...") expects the ring's text to be "61%self-powered", and the idle test expects no `/self-powered/`. Run it and see the ring test fail on "61%off the grid".
- [x] 1.2 In `components/impact/car-charging.tsx`, pass `caption="self-powered"` to the car `Ring`; the car-charging tests pass, and `grep -n "off the grid" components/impact/car-charging*` finds nothing.

## 2. Verify

- [x] 2.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 2.2 `yarn build && yarn start`: `/impact` at 390 and 1440, the car ring's caption sits inside the ring on one line like the house ring's. Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive car-ring-self-powered`, then open the PR.
