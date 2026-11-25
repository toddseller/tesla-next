# Tasks

## 0. Sidecar

- [x] 0.1 Commit the refreshed `.impeccable/design.json` on its own (`Refresh the design sidecar`), before any code; `git show --stat HEAD` lists only that file.

## 1. The always-on axis in kW

- [x] 1.1 Test first: in `components/patterns/always-on.test.tsx`, the last-12-months axis reads "1 kW", "0.5" and "0" for the fixture (top 1,000 W), and "1.5 kW", "0.75", "0" when a month reaches 1,500 W. Run it and see "500" and "750" fail it.
- [x] 1.2 In `LastTwelve` (`components/patterns/always-on.tsx`), print the middle tick as the top tick's kW (`top / 2000`); both cases pass.

## 2. The Difference leads with watts

- [x] 2.1 Test first: in `components/patterns/always-on.test.tsx`, change the figures test to the spec's scenarios: "+588 W" with "+14 kWh a day" for the fixture, and "-420 W" with "-10 kWh a day" for 300 W against 720 W. See them fail on "+14 kWh".
- [x] 2.2 In `Figures`, show the signed watt gap (latest minus a year earlier) with `after` reading `<signed kwhPerDay> kWh a day`; the tests pass.

## 3. The True-Up tile in its net's unit

- [x] 3.1 Test first: in `components/true-up/tiles.test.tsx`, add the spec's kWh-net case (1,174.0 kWh imported, 448.8 kWh exported reads "Imported 1,174.0 kWh · Exported 448.8 kWh"), and keep the "Net for the year" expectation's peak at "413.4 kWh imported". See the new case fail.
- [x] 3.2 In `components/true-up/tiles.tsx`, pass the net to `Energy` as `energy`'s `top` for the imported and exported totals only; the tile tests pass.

## 4. Design-system leftovers

- [x] 4.1 In `DESIGN.md`, the Neutral list's Dusk Gray and the button Focus line say the focus ring is Dusk Gray at full strength (3px); `grep -n "50%" DESIGN.md` no longer finds the ring.
- [x] 4.2 In `components/ui/button.tsx`, keep only the `ghost` variant and the `default` and `icon` sizes, and make `ghost` the default variant. `yarn tsc --noEmit` passes and the calendar tests in `components/solar/` and `components/admin/` still pass.

## 5. Verify

- [x] 5.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 5.2 `yarn build && yarn start`: `/patterns` (axis, Difference) and `/true-up` (net tile) at 390 and 1440, and the Solar day picker's calendar still looks as before. Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive units-read-one-way`, then open the PR.
