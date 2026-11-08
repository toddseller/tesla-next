# Tasks

Code tasks are test-first: write the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Tasks marked **(owner)** are done by you; I check each where I can.

## 1. The mockup

- [x] 1.1 A mockup of `/top` with the switch, Without VPP events chosen, at phone and desktop width, published as an artifact with two or three placements (above the export rankings, in the page header, beside the footnote) and both footnote sentences; **(owner)** pick one, and the choice is recorded in the design

## 2. The rankings and `/api/top-ten`

- [x] 2.1 `topTen()` in `lib/top-ten.db.test.ts` test-first, seeded with a VPP day that would be #1: leaving VPP days out drops it from the export days, ranks the next day #1, takes the 10th-place tie from non-VPP days only, sums its month without it, and drops a month whose every day is a VPP day; including them answers as today (the existing tests unchanged); the solar ranking is the same both ways
- [x] 2.2 `app/api/top-ten/route.ts` test-first: `?vpp=without` answers the rankings without VPP days, and no parameter answers as Flask's (the existing test unchanged); `README.md`'s top-ten entry names `?vpp=without` and says the page's default is the opposite of the route's until 7b

## 3. The page

- [x] 3.1 `app/top/page.tsx` test-first: `/top` and an unknown `vpp` are served without VPP days, `/top?vpp=with` with them
- [x] 3.2 `TopTenPage` test-first: the switch's two buttons with the chosen one pressed, choosing With VPP events replacing the address with `/top?vpp=with` (and Without with `/top`), the footnote's sentence for each, and a `totals` event reloading `/api/top-ten?vpp=without` or `/api/top-ten` to match the address; placed and styled as the chosen mockup, with the design system's tokens
- [x] 3.3 Under `yarn build && yarn start` locally on a throwaway database seeded with top-ten days, a VPP day at #1 and a month with VPP days: no CSP violation or console message on `/top`; the switch flips the export rankings and the footnote while the solar ranking stays; back leaves the page rather than flipping the switch; at 375 px nothing scrolls sideways; record the results in the design

## 4. Release and checks (after merging)

- [ ] 4.1 **(owner)** Publish a release; I watch the Deploy run
- [ ] 4.2 On teslasolar.report: `/top` leads its export days without May 30 and July 23, 2024, `/top?vpp=with` leads with May 30, 2024 at 60.0 kWh, the footnote follows the switch, no console message, and `scripts/compare-top-ten.mjs` still finds no mismatch against Flask on onyx; record the results in the design, committed on the next change's branch

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On the branch `top-ten-without-vpp` (started from `cutover-soak`, so "Record the cutover switch" rides along): commit the code, then archive this change with spec sync as a second commit, `Archive top-ten-without-vpp`, then open the pull request, mentioning the rollout record.
