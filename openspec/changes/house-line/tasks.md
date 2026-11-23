## 1. The chart

- [x] 1.1 `lib/solar/bars.test.ts`: the stack's ends come from solar and grid only (house never rounds). Verify it fails, change `stackEnds`, verify it passes
- [x] 1.2 `components/solar/range-chart.test.tsx`: house is a mark at its own value, not a stacked section: Oct 14's mark at 34.0 kWh over a bar of solar and negative grid, Oct 2's above its bar with the axis reaching it, the mark rising with its column (`--i`) and opening its day on click. Verify it fails, draw the mark in `range-chart.tsx`, verify it passes
- [x] 1.3 The legend shows the mark for "House, car included" (test, fail, change, pass)

## 2. Verify

- [x] 2.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots at 1440 and 390 of Solar's range chart for this month, October 2026 and '25 - '26, and a reload of today's column; verify by your OK on the screenshots before pushing
- [x] 2.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing

## Workflow follow-up

- Commit the code, then `/opsx:archive` with the specs synced and commit "Archive house-line"; push over SSH and open the PR.
