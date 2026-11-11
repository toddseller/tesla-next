# Tasks

## 1. Kept finished years

- [x] 1.1 Test first (`lib/true-up/grid.db.test.ts`): a true-up year ending more than 31 days before today is loaded once (a second call doesn't read a stored change to one of its days) and comes back equal; a year ending within 31 days is loaded on each call; clearing `globalThis.trueUpGrids` makes the next call load it again; see the kept-year case fail, then add the memory in `cycleGrids`; the tests pass, and `cost.db.test.ts`, `savings.db.test.ts` and `payback.db.test.ts` still pass, clearing the memory between tests where they change stored days

## 2. Shared savings and the hook

- [x] 2.1 Wrap `trueUpSavings` in `cache()`, so within one render the page's savings card and `payback` share the current year; the existing tests pass. React's `cache()` only shares results inside a server-component render, and the tests run React's client build, where it calls through (as for `cycleGrids` and `loadPricing`, which have no test of it either); the sharing shows in task 3.2's page timing instead
- [x] 2.2 Test first (`instrumentation.test.ts`): the rewrite hook also clears `globalThis.trueUpGrids`; then add it; the test passes

## 3. Verify

- [x] 3.1 The whole suite passes, `tsc` is clean, `openspec validate true-up-kept-years --strict` passes
- [x] 3.2 A throwaway branch container on onyx reading production read-only: the True-Up page's text matches the live release's word for word (once it has a live status), and its server time with `Accept-Encoding: gzip` drops from about 250 to 300 ms after the boot warm-up; record in design.md under Results
- [x] 3.3 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose; the owner chose its one finding: any past range from an address was kept, so anyone could grow the memory without end, and now only whole true-up years are (test first)

## 4. Rollout

- [x] 4.1 With the owner's go-ahead, release; the deploy's health check passes, and teslasolar.report's True-Up page answers faster than its 0.43 s to first byte; record in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change as a second commit, `Archive true-up-kept-years`, before opening the PR, which also carries the cache-rewrites rollout record (9f131e7).
