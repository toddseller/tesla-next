# Tasks

Code tasks are test-first: write or port the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Ported code keeps anton's logic, and its comments are swept under the comment rule in the same task. Tasks marked **(owner)** are done by you; I check each where I can.

## 1. The rankings and `/api/top-ten`

- [x] 1.1 `lib/range.ts` exports its `gridIn` and `gridOut` fragments; its existing tests stay green
- [x] 1.2 `topTen()` in `lib/top-ten.ts` against a database of its own (`ownDatabase`), test-first: solar days by the stored figure with NULL days left out; export days computed per row as Flask's instance properties (a day with PG&E's readings before April 27, 2026, a VPP day leaving out the Powerwall's exports, a day with no `from_grid`); export months summed in SQL; the tie rule (78.6 twice newest first, a tie at 10th won by the newer 11th day); fewer than ten rows; an empty database giving three empty rankings; Flask's labels ("Jun 13, 2022", "May 2024"), negative export figures and each row's `day` or `month`
- [x] 1.3 `app/api/top-ten/route.ts` test-first: 200 with `{"data": [{"solar": [...]}, {"net_grid": [...]}, {"to_grid_months": [...]}]}` from `topTen()`
- [x] 1.4 `scripts/compare-top-ten.mjs` reusing `firstDifference`, comparing Flask's fields with ties allowed as the design says, with a test of a tie in order, a tie at 10th place and a real mismatch; README gains the route and the script; run it on onyx against a build of the branch and Flask and get zero mismatches before the page work builds on `topTen()`

## 2. The page

- [x] 2.1 The record's text test-first: how long it has stood ("4 years, 4 months" for June 13, 2022 on 2026-11-08, "2 years, 5 months" for May 2024, "1 year, 1 month", "5 months", "less than a month"), the lead over #2 from the figures as shown (0.7, 30.9), the full date ("Monday, June 13, 2022", "May 2024"), and the Solar page links (`/?start=2022-06-01&end=2022-06-30&day=2022-06-13`, `/?start=2024-05-01&end=2024-05-31`) through `address` and `monthOf`
- [x] 2.2 The timeline test-first: ten dots placed by date from 2021-10-01 to the end of the current year and by figure within `niceAxis` of the ten (78 to 81 kWh for the live solar days), the years marked, the current year shaded, #1 ringed, #2 and #3 numbered, solar and grid colors, and a label listing the ten
- [x] 2.3 The ranking card test-first with Testing Library on the live figures from the mockup: the record, the timeline, #2 to #10 as links with this year's marked (three export days in 2026), exports without a minus sign, and "nothing to rank yet" for an empty ranking
- [x] 2.4 `app/top/page.tsx` renders `topTen()` on the server, replacing the placeholder; test-first that the served HTML holds the three records and their runners-up
- [x] 2.5 `TopTenPage` reloads `/api/top-ten` on every `totals` event and on a reopened stream, keeping its rankings on a failed reload, test-first with the fake event source
- [x] 2.6 `components/not-moved-yet.tsx` and its test are deleted, with nothing left importing them (`yarn tsc --noEmit` and the whole suite pass)

## 3. Checks before the pull request

- [x] 3.1 Under `yarn build && yarn start` locally on a throwaway database seeded with top-ten days, months, ties and a VPP day: no CSP violation on `/top`; at 375 px one column with the record above its timeline and no sideways scroll; at 1024 and 1440 px the record beside its timeline, matching mockup D + E; each date link opens the Solar page at its address

## 4. Release and checks (after merging)

- [ ] 4.1 **(owner)** Publish a release; I watch the Deploy run
- [ ] 4.2 On next.teslasolar.report: run `scripts/compare-top-ten.mjs` on onyx with zero mismatches; a `totals` event reloads the rankings in place; side by side with teslasolar.report/top; record the results in the design, committed on the next change's branch rather than a pull request of their own

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On a branch `top-ten-page`: commit the code, then archive this change with spec sync as a second commit, `Archive top-ten-page`, then open the pull request. Group 4 happens after the merge.
