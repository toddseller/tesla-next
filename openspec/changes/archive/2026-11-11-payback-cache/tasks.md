# Tasks

## 1. Before starting

- [x] 1.1 Branch `payback-cache` from `sky-now-observed-rollout`, so the `Record the sky-now-observed rollout` commit rides in this change's PR; `git log` shows it under the new branch's first commit

## 2. The day's payback

- [x] 2.1 Test first (`lib/true-up/payback.cache.test.ts`):
  - a second `payback(today)` on the same day doesn't price anything again, and two calls at once share one working-out;
  - a new day prices the current year again;
  - `refreshPayback(today)` keeps answering the old figures until the new ones resolve, then answers the new;
  - a failed refresh keeps the old figures;
  - a rejected working-out isn't kept;
  - clearing `paybackKept` makes the next call work them out.

  Update the existing "a second call prices only the current year again" test, which the kept day replaces. See them fail, then keep the day's payback in `lib/true-up/payback.ts`; the file passes
- [x] 2.2 Test first (`instrumentation.test.ts`): a `totals_updated` notice for today calls `refreshPayback`, one for another day doesn't, and a rewrite clears `paybackKept` with the other kept figures. See it fail, then wire it in `instrumentation.ts`; the whole suite passes
- [x] 2.3 Test first (`lib/true-up/payback.cache.test.ts`): from the moment `refreshPayback` starts, callers get its answer rather than the old one, and a failed refresh falls back to the old one (this replaces 2.1's "keeps answering the old figures until the new ones resolve", see design.md). See it fail, then put the working-out in place at once; the file passes
- [x] 2.4 Test first (`lib/true-up/savings.cache.test.ts`, mocking the database reads as `payback.cache.test.ts` does):
  - a second `trueUpSavings` for a true-up year on the same day works nothing out again, and two at once share one working-out;
  - a range that isn't a true-up year isn't kept;
  - a new day works it out again;
  - a rejected working-out isn't kept;
  - `refreshSavings(today)` is in place the moment it's called: callers wait for its answer, a failed one falls back to the old savings, and it re-works only the kept years still changing (the current one, and one that ended in the last 60 days).

  Then, in `payback.cache.test.ts`, `refreshPayback` calls `refreshSavings(today)` before working the payback out, so the payback reads them fresh. Empty `savingsKept` between tests in the database tests that seed different data. See them fail, then keep the savings in `lib/true-up/savings.ts` and call `refreshSavings` from `refreshPayback`; the whole suite passes
- [x] 2.5 Test first (`instrumentation.test.ts`): a rewrite empties `savingsKept` too. See it fail, then add it to the rewrite hook; the whole suite passes

- [x] 2.6 Test first (`lib/kept.test.ts`): a refresh that fails with nothing kept resolves without rejecting and keeps nothing; one that fails on a new day keeps nothing rather than yesterday's answer. Both already passed, as the code was right; applying review thread 5's two surviving mutations to `lib/kept.ts` made them fail (rethrowing: both; a fallback ignoring the day: the second), and the file was restored
- [x] 2.7 Test first (`lib/true-up/savings.cache.test.ts`): a settled year (ended more than 31 days ago) is kept across days; an unsettled one is worked out again on a new day; `refreshSavings` re-works only today's unsettled kept years ('26 - '27 on 2026-11-11, not '25 - '26), and on 2026-10-20 both. See them fail, then key settled years "settled" (sharing `grid.ts`'s rule) and filter the refresh by today's day; the whole suite passes
- [x] 2.8 Test first (`lib/true-up/payback.cache.test.ts`, `instrumentation.test.ts`): payback prices a finished year through `trueUpSavings` with no store of its own, and the rewrite hook no longer names `paybackYears`. See it fail, then drop `paybackYears` from `payback.ts` and `instrumentation.ts`; the whole suite passes
- [x] 2.9 Test first (`instrumentation.test.ts`): a `totals_updated` notice for yesterday refreshes; one for two days ago doesn't. See it fail, then widen the listener; the whole suite passes

## 3. Verify

- [x] 3.1 The whole suite passes, `tsc` is clean, `openspec validate payback-cache --strict` passes, and `yarn build` succeeds
- [x] 3.2 A throwaway branch container on onyx reading production read-only, through an SSH tunnel:
  - time `/api/payback`, `/api/true-up-savings` for the current year and '25 - '26, and `/true-up` for both years, ten times each, inside onyx's Docker network, against the live container at the same moment;
  - after a `totals` notice, the refresh re-works only the current year (about 0.2 s, not 1.2 s);
  - after a `totals` notice for today, the server logs no error and `/api/payback` still answers at once.

  Record the timings in design.md under Results
- [x] 3.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported to choose from. Second review, after the five-thread changes: both findings chosen and fixed, two comments brought up to the new refresh rule and `settled`'s unused `today` parameter removed (no behaviour change; the suite covers it). First review: both chosen and fixed test first: a totals notice that isn't JSON is skipped instead of thrown into the database client's notice handler (`instrumentation.test.ts`); payback's and the savings' keep-and-refresh rule is one shared helper, `lib/kept.ts` (`lib/kept.test.ts`), with payback's global renamed `paybackKept`

## 4. Rollout

- [x] 4.1 Release (ask first); the deploy's health check passes, and `/api/payback` and `/true-up` on teslasolar.report are timed against the Context table; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its spec synced as a second commit, `Archive payback-cache`. Push and open the PR, which also carries the sky-now-observed rollout record. No page changes how it looks, so there are no screenshots to approve before pushing.
