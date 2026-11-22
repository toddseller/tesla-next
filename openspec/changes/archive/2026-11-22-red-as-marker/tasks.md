## 1. Red as a marker only

- [x] 1.1 `components/top-ten/timeline.test.tsx`: the "this year" band is shaded in the muted foreground, not Tesla red. Verify it fails, change `components/top-ten/timeline.tsx`, verify it passes
- [x] 1.2 `components/true-up/cycle-chart.test.tsx`: the projected band is drawn in the muted foreground and its key swatch matches, while the running-net line stays red. Verify it fails, change `components/true-up/cycle-chart.tsx`, verify it passes

- [x] 1.3 `components/solar/range-controls.test.tsx` and `day-panel.test.tsx`: the opened picker's calendar carries `MARKER_SELECTED`, the raised slate with the red underline for a chosen day instead of the red fill. Verify they fail, add it in `components/ui/calendar.tsx` and pass it from the Solar and admin pickers, verify they pass (found by the review; Distribution's replay calendar keeps its own)

## 2. Verify

- [x] 2.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots at 1440 and 390 of Top Ten's timelines and True-Up's cycle chart with its band; verify by your OK on the screenshots before pushing
- [x] 2.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing
