# Tasks

## 1. Charges beside the dates on a phone

- [x] 1.1 Test first: in `components/true-up/cycle-list.test.tsx`, each cycle row's and year row's second cell holds its charges (empty when it has none, so a row without charges still has five cells), every row's class has `grid-cols-2` below `sm`, the charges cell carries `sm:col-start-5 sm:row-start-1`, and the estimate line carries `text-balance`. Update the existing textContent expectations to the new order (dates, charges, then figures). Run it and see the new checks fail.
- [x] 1.2 In `components/true-up/cycle-list.tsx`, change `ROW`'s phone columns to `grid-cols-2`, render the charges cell right after the dates in `CycleRows` and `Year` (always, empty when there are none), place it with `sm:col-start-5 sm:row-start-1`, and add `text-balance` to the estimate line. The tests pass, including "from 640 pixels every row has the same five columns".

## 2. A year's cycles indented

- [x] 2.1 Test first: the dates cell of each cycle inside a year's `<details>` carries `pl-5`, the `<ul>` itself does not, and a single year's cycles' dates cells do not. See it fail.
- [x] 2.2 Give `CycleRows`' dates cell the indent only when it sits inside a `Year`; the test passes, and in the browser a year row's figures and its cycles' start at the same positions.

## 3. The unit, once

- [x] 3.1 Test first: in `components/true-up/true-up-page.test.tsx`, the level-2 heading named "Billing cycles in kWh" exists and its "in kWh" span carries `normal-case`. See it fail.
- [x] 3.2 In `components/true-up/true-up-page.tsx`, add `<span className="normal-case tracking-normal">in kWh</span>` after "Billing cycles" in the `h2`; the test passes.

## 4. Verify

- [x] 4.1 Whole suite and types pass (`yarn test`, `yarn tsc --noEmit`).
- [x] 4.2 With the branch running against real data (an onyx branch container), at 375 and 390 on True-Up and All time: each cycle's and year's charge shares the first line with its dates and ends at the row's right edge, rows without charges keep Imported on the second line, the estimate line does not strand "kWh", an open year's cycle dates start under the year's name, and nothing scrolls sideways. At 1024 and 1440 the five columns line up as on `main`, with the open year's cycles indented. The heading reads "BILLING CYCLES in kWh". Give the URL for the hand check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent; report findings and wait.
- Commit the code, then `/opsx:archive` with spec sync as `Archive cycle-rows-on-phones`, then open the PR.
