# Tasks

Code tasks are test-first: write the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Tasks marked **(owner)** are done by you; I check each where I can.

## 1. Before the switch

- [x] 1.1 `next.config.ts` redirects `/numbers` permanently to `/true-up`, test-first against the config's `redirects()`; the whole suite and `yarn tsc --noEmit` pass
- [x] 1.2 `README.md` describes this app as teslasolar.report, served from onyx with anton-tesla-api-ws writing the database, without "being moved", "until the cutover" or pages not moved yet; the compare instructions and the deploy notes on next.teslasolar.report stay, as the design says
- [x] 1.3 Under `yarn build && yarn start`: `curl -I /numbers` answers 308 with `Location: /true-up`, and `/numbers` in headless Chromium opens the True-Up Tracker with "True-Up" marked as the current page

## 2. Release and switch (after merging)

- [ ] 2.1 **(owner)** Publish a release; I watch the Deploy run
- [ ] 2.2 **(owner)** In Cloudflare, move teslasolar.report's public hostname from `tsr-tunnel` to `tesla-next-tunnel`, service `http://next:3000`
- [ ] 2.3 On teslasolar.report: the five pages answer 200 from tesla-next with no console message, `/numbers` lands on `/true-up`, a `/distribution?at=` replay link opens paused, a `totals` event reloads the Solar page in place, and the compare scripts still find no mismatch against Flask on onyx; record the results in the design

## 3. Soak (one week after the switch)

- [ ] 3.1 After midnight's `finish_yesterday`, a `totals` event for yesterday reaches the open Solar page on teslasolar.report, and on the first day of a month This month shows the new month; record what the week showed in the design, with the date the soak ended

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On the branch `cutover` (it already carries "Record the month-drill-down rollout"): commit the code, then archive this change with spec sync as a second commit, `Archive cutover`, then open the pull request, mentioning the rollout record. Groups 2 and 3 happen after the merge; their results go on the next change's branch.
- After the soak: anton-tesla-api-ws's companion change retiring Flask's HTTP, then change 7b here.
