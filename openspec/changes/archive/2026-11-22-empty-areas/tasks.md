## 1. Layout

- [x] 1.1 `components/home/year.tsx`: the energy-mix block follows the readout (drop `mt-auto`); `components/home/habits.tsx`: the row aligns to the top. Verify by the existing tests passing and, on the branch container, screenshots at 1440 with no gap under the readout and the Habits chart beside its text

## 2. Since 2021 ends at today

- [x] 2.1 `components/home/since.test.tsx`: with the whole system projected for 2028, no box is drawn and under the chart reads "The whole system is projected to pay back in 2028"; a whole-system year reached this year is drawn clipped at today (the shaded box caught as Since asks for it, since jsdom can't lay a chart out); solar's payback month stays marked. The axis ending at today is checked in the 4.1 screenshots. Verify it fails, implement in `components/home/since.tsx`, verify it passes

## 3. True-Up's five tiles

- [x] 3.1 `components/true-up/tiles.test.tsx`: from 1280 pixels the tiles share one row, and each figure is 28 pixels when its tile's content is under 180 pixels wide (only five across) and 34 otherwise. Verify it fails, implement in `components/true-up/tiles.tsx`, verify it passes

## 4. Verify

- [x] 4.1 Full suite and `yarn build`; on an onyx branch container, screenshots at 1440 (and 1280 for True-Up) of the year chapter, Habits, Since 2021 and True-Up's tiles, and at 390 to check nothing changed on a phone; verify by your OK on the screenshots before pushing
- [x] 4.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing
