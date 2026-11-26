# Tasks

## 1. Live scene

- [x] 1.1 Add tests to `lib/scene/live-scene.test.ts` for the two new "Flow assignment" scenarios (solar charges the car before the house; the Powerwall charges the car before the house), run them and see them fail for the right reason
- [x] 1.2 Reorder `DESTINATIONS` in `lib/scene/live-scene.ts` (solar: Powerwall, car, home, grid; Powerwall: car, home, grid; grid: car, home, Powerwall) and update its comment; verify the new tests pass
- [x] 1.3 Update the link-order expectations that put home before car (`lib/scene/live-scene.test.ts` around line 470, `components/scene/live-scene.test.tsx` around line 258) and verify the scene suites pass

## 2. Replay order

- [x] 2.1 Change the expected link order in `lib/scene/replay.test.ts` to vehicle before home within a source, see it fail, then reorder `FLOWS` in `lib/scene/replay.ts` to match and verify the replay tests pass

## 3. History

- [x] 3.1 Replace "mixed sources split proportionally" in `app/api/intervals/route.test.ts` with the two new "Charging is attributed to energy sources" scenarios (solar covers the car while the grid covers the house; charging spills from solar to the Powerwall to the grid), run them against the throwaway PostgreSQL and see them fail
- [x] 3.2 Change `intervalWh` in `lib/intervals/intervals.ts` to fill charging from the home flows in order, keeping the cap at home consumption, and update the `HOME_TO_VEHICLE` comment; verify the route tests pass, including the existing overnight and capped cases

## 4. Integration

- [x] 4.1 Run the whole suite (`yarn test`) and `yarn build`, and verify both pass
- [x] 4.2 Check the Solar day view and Impact's Home car charging section for a daytime charge on a branch container on onyx, and verify the vehicle flows lean to solar

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent and report its findings before the first commit.
- Commit the code, then archive the change with the specs synced and commit `Archive car-first-charging` before opening the PR.
