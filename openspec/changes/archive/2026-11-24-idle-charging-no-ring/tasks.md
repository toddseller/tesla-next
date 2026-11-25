# Tasks

## 1. No ring on a range with no charging

- [x] 1.1 In `components/impact/car-charging.test.tsx`, change "an idle day says there was no home charging, with an empty ring and no car lines" to expect no ring (no `img` named "Car charging") and no "0%" or "off the grid", alongside the existing line and no car lines. See it fail for the ring that is still drawn.
- [x] 1.2 In `components/impact/car-charging.tsx`, render the `total_kwh === 0` branch as the "No home charging" `Message` alone, as the before-coverage branch does; 1.1 passes.

## 2. Verify

- [x] 2.1 `yarn test` and `yarn build` (its type check) pass.
- [x] 2.2 Under the production CSP (an onyx branch container, since Impact needs data): an idle day on `/impact` shows the line and no ring; a day with charging still shows the ring, legend and car lines; switching between them in place works. Then give the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive idle-charging-no-ring` with specs synced, then the PR.
- Update the `critique-round-7` memory with the PR number.
