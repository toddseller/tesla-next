## 1. Shared range helpers

- [x] 1.1 `lib/solar/ranges.test.ts`: the year-earlier days (a past month, a range including today clipped at today's date a year earlier, Feb 29 to Feb 28, null before 2021-10-10) and the range's name and comparison name for each case in design.md. Verify they fail, add the helpers to `lib/solar/ranges.ts`, verify they pass

## 2. Solar

- [x] 2.1 Sentence tests for each scenario in `solar-range-chart`'s lead sentence, comparison and no-year requirements (556 kWh in November so far, 6% more; October 2026 against October 2025; about the same; its first month; no comparison for 2022). Verify they fail, write the sentence function, verify they pass
- [x] 2.2 `components/solar/solar-page.test.tsx` (or the page's existing test): the sentence sits under the h1, follows the reloaded bars, and the forecast card comes after the range chart. Verify it fails, change `solar-page.tsx` and `app/solar/page.tsx` (the year-earlier `rangeTotals`), verify it passes

## 3. Impact

- [x] 3.1 Sentence tests for each scenario in `impact-report`'s new requirements (up from, down from, about the same, today, yesterday, no sentence for All time or 2022). Verify they fail, write the sentence function, verify they pass
- [x] 3.2 `components/impact/impact-page.test.tsx`: the sentence under the h1, following reloaded figures, absent without a year-earlier share. Verify it fails, change `impact-page.tsx` and `app/impact/page.tsx` (the year-earlier `impactFigures`), verify it passes

## 4. True-Up

- [x] 4.1 `lib/true-up/text.test.ts`: the current year's headline and muted line (dollars, kWh only, crossing zero, none without a projection) and a past year's (more, less, nothing due, none without the year before). Verify they fail, add the functions to `lib/true-up/text.ts`, verify they pass
- [x] 4.2 Page and tile tests: the headline with the title as a small label, the title and subtitle kept without one, no Projected true-up tile, four tiles on one row at 1440. Verify they fail, change `true-up-page.tsx`, `tiles.tsx` and `app/true-up/page.tsx` (the year before's cost), verify they pass

## 5. Top Ten

- [x] 5.1 Sentence tests for each scenario in `top-ten`'s new requirements (places without a record, one record, two records and nothing else, nothing this year with the newest record, an empty database). Verify they fail, write the sentence function, verify they pass
- [x] 5.2 `components/top-ten/top-ten-page.test.tsx`: the sentence replaces the subtitle and follows the VPP switch; the subtitle stays without one. Verify it fails, change `top-ten-page.tsx`, verify it passes

## 6. Verify

- [x] 6.1 Full suite and `yarn build`; on an onyx branch container, zoomed screenshots at 1440 and 390 of Solar (this month, October 2026, October 2021), Impact (today, this month, All time), True-Up (this year, '25 - '26, All time) and Top Ten (both VPP choices); verify by your OK on the screenshots before pushing
- [x] 6.2 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the pick before committing

## Workflow follow-up

- Commit the code, then `/opsx:archive` with the specs synced and commit "Archive lead-sentences"; push over SSH and open the PR.
