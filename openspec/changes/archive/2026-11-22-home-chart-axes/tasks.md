## 1. The shared ticks

- [x] 1.1 `lib/home/records.test.ts`: `yearTicks(from, to)` gives each January 1 after `from` up to `to` (October 2021 to the end of 2028 gives 2022 to 2028; a span inside one year gives none), and `tenthTick` reads 52.3888 as "52.4" and 25 as "25". Verify it fails, move the ticks out of `components/home/records.tsx` into `lib/home/records.ts` with the format beside them, verify it passes

## 2. The charts

- [x] 2.1 `components/home/records.tsx`: the y-axis is marked by `valueTicks` (0, the record, and the lowest figure when a series starts below 0, as the month export tab's does) with `tenthTick`, tested first in `lib/home/records.test.ts`, and the x-axis uses `yearTicks`. Verify by the Records tests and, on the branch container, the outage tab's axis reading to a tenth
- [x] 2.2 `components/home/since.tsx`: the x-axis ticks are `yearTicks` over the chart's span, replacing the automatic ones. Verify by the Since tests and, on the branch container, "2025" falling just before the March 2025 mark

## 3. Verify

- [x] 3.1 Full suite, `yarn build`, then zoomed screenshots of both charts at 390 and 1440 on an onyx branch container; verify by your OK on the screenshots before pushing
- [x] 3.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing
