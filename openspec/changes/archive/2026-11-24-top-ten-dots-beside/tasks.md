# Tasks

Each task goes test-first: write the test, see it fail for the right reason, make it pass, then run the whole suite (`yarn test`).

## 1. Placing the ranks

- [x] 1.1 In `components/top-ten/timeline.test.tsx`, test `placeRanks` with the live solar positions at a 265px plot: each of #1 to #10 is labeled level with its own dot with no line, and #4's and #5's labels (a day apart) don't overlap each other's dots; make it pass in `components/top-ten/timeline.tsx`
- [x] 1.2 Test that export day #1 at the top of its axis, a day before #2, keeps its "1" level with its own dot, clear of #2's dot, at 13px from the ring; make it pass
- [x] 1.3 Test that the phone outage positions put #7, #8 and #10 under one label "7, 8, 10", that a label which had to move carries a line to its dot, and that a label near the right edge goes to the left; make it pass

## 2. The timeline

- [x] 2.1 Test that the dots are 8px (#1 10px, still ringed) at their unchanged positions, and that once the plot's width is known (stubbed `ResizeObserver` and width, as `cloud-canvas.test.tsx` does) the ranks 1 to 10 show beside them with their `motion-pop` order; update the "#1 is ringed" and "dots fade in" tests to the new spec scenario; make it pass by measuring the plot and rendering `placeRanks`' labels and lines
- [x] 2.2 Test that without a known width the dots still render and no ranks show; make it pass

## 3. Checks

- [x] 3.1 Run `yarn test`, `npx tsc --noEmit` and the production build (branch container on onyx), and check `/top`'s four timelines at 375px, about 768px and 1440px in light and dark, zoomed, against the mockup; looked over and approved before pushing

## Workflow follow-up

- Run the ponytail review on the uncommitted diff in a fresh subagent and wait for the pick of fixes.
- Commit the code, then archive the change with spec sync as `Archive top-ten-dots-beside`, then open the PR.
