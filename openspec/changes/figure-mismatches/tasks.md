# Tasks

Each fix is test-first: write or change the test, run it and see it fail for the right reason, then make it pass.

## 1. Patterns' cycles since the first year

- [x] 1.1 In `lib/patterns.test.ts`, add the "Rows that round up" case (two years of 60,750 Wh out, rows 2 and 2, total 4); run it and see it fail with 3.
- [x] 1.2 In `lib/patterns.ts` `powerwallYears`, make `total.cycles` the sum of the rows' cycles; `lib/patterns.test.ts` and `components/patterns/powerwall-use.test.tsx` pass, the existing 511 case unchanged.

## 2. Since 2021 gives the net once

- [x] 2.1 In `components/home/since.test.tsx`, change the net tests to expect no "more imported than sent this true-up year" figure and the net once, in the sentence (`getAllByText` of the figure's text has length 1); keep the "sent" and "even" cases as sentence checks; run them and see them fail on the figure that's still there.
- [x] 2.2 In `components/home/since.tsx`, delete the net figure block, `netText` and `startName` if nothing else uses them; the dollar estimate test reads "under the net" no more, so rename it; drop the now unused `trueUpStart` prop from `Since` and `app/page.tsx`, and move `app/page.test.tsx`'s served-net check to the sentence. `since.test.tsx` and `app/page.test.tsx` pass.

## 3. "without the car"

- [x] 3.1 Change "car apart" to "without the car" in `components/home/today.test.tsx`, `components/scene/today-so-far.test.tsx` and `lib/solar/day-views.test.ts` (test names and comments too); run them and see them fail on the old label.
- [x] 3.2 Change the label in `components/home/today.tsx` `TodayTotals` and the headline in `lib/solar/day-views.ts`; the three test files pass, and `grep -rn "car apart" components lib app` finds nothing.

## 4. Lone last words and DESIGN.md

- [x] 4.1 Add `text-balance` to the `Tile`'s text container in `components/true-up/tiles.tsx` (`text-pretty` left "true-up." alone at 1440) and `text-pretty` to the subtitle in `components/impact/car-charging.tsx:53` (class only, no test); confirmed under 5.2.
- [x] 4.2 In DESIGN.md's Hierarchy, list True-Up's tile values and the savings card's saved figure under Lead figure (34px, 28px in a narrow tile), and narrow the Secondary figure entry to "the True-Up savings card's breakdown figures (18px)".

## 5. Whole suite and the browser

- [x] 5.1 Run the whole suite (`yarn test`) and `yarn build`; both pass.
- [x] 5.2 Under `yarn build && yarn start`, check Home's Since 2021 at 1440 and 390 (net only in the sentence, column opens with the estimate), Patterns' cycles tile against its rows, Today and Distribution's "without the car", the Solar day view's headline, True-Up at 1440 and Impact at 390 for lone last words; give the owner the URL to check before push.

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report, and wait for the owner's pick of fixes.
- Commit the code, then archive the change (spec sync included) as a second commit, `Archive figure-mismatches`, and open one PR.
