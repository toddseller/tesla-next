# Tasks

## 1. Patterns keeps its finished months

- [x] 1.1 Test first (`lib/patterns.db.test.ts`): with nights, Powerwall days and house use on both sides of the split (the month holding yesterday), `patterns(today)` gives the same months, years and hours as before, the split year's energy added up from both parts and its first day the earlier; on the 1st, the month just ended is still worked out live; then split the three queries into a kept part before the split and a live part from it; the tests pass
- [x] 1.2 Test first: a second call works out only the live part (the kept part's rows come from `globalThis.patternsMonths`, a stored change to a kept month doesn't show), a new split replaces the kept entry, and clearing `globalThis.patternsMonths` makes the next call read the kept months again; then add the memory; the tests pass

## 2. The rewrite hook

- [x] 2.1 Test first (`lib/live.test.ts`): a `data_rewritten` notification calls each hook registered with `onRewrite` and reaches no subscriber; a reconnect calls the hooks once listening again, the first connect doesn't; the existing channels behave as before; then add the channel, `onRewrite` and the reconnect call; the tests pass

## 3. Empty and refill

- [x] 3.1 Test first (`instrumentation.test.ts`): `register()` also warms `patterns(today)`; its rewrite hook clears `chargingDays`, `paybackYears` and `patternsMonths` and runs the same three warm-ups without waiting, a failed one logged and the others still run; then move the warm-ups into one function used at boot and by the hook; the tests pass

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, `openspec validate cache-rewrites --strict` passes
- [x] 4.2 A throwaway branch container on onyx reading production read-only: the Patterns page's figures match the live release's (same HTML for the figures), its server time with `Accept-Encoding: gzip` drops from about 650 ms to near the other pages' after the boot warm-up, and the log shows "caches warmed"; with a `data_rewritten` notification heard by the container (from anton's next run, or by stopping and starting the container's listener connection), the log shows the refill; record in design.md under Results
- [x] 4.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose; the owner chose its one finding: a watchdog reconnect (anton quiet, not a broken connection) counted as a rewrite and would refill every cache each minute of a Tesla outage, and now doesn't (test first)

## 5. Rollout

- [x] 5.1 With the owner's go-ahead, release; the deploy's health check passes, and teslasolar.report's Patterns page answers in about the other pages' time
- [x] 5.2 After anton's next rewrite notice, the server log on onyx shows the refill, and the Patterns, Impact and True-Up pages answer as before; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive cache-rewrites`, before opening the PR, which also carries the day-expected-solar rollout record (0ac5fab) and deploy-status' first dropped connection (8acc426).
