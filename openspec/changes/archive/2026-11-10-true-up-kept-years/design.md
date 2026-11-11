# Design

## Context

See proposal.md for why. What shapes the approach:

- `cycleGrids(start, end)` (`lib/true-up/grid.ts`) loads a range's PG&E billing cycles, each cycle's days for pricing (`dailyGrid`, Tesla's intervals and PG&E's meter days) and each year's October read, and is wrapped in React's `cache()`, so one render shares one load. Its callers, `cycleRows`, `trueUpSavings` and `comparableYears`, only read the grids and build new arrays from them.
- `comparableYears` (`lib/true-up/cost.ts`) asks for every true-up year ending from 2025 (`COMPARABLE_FROM_END_YEAR`) up to the year before the current one: now 2024-25 and 2025-26. Each took about 88 ms on production, about 240 ms side by side.
- `payback(today)` prices every year from 2023-24 (`FIRST_PRICED`) through `trueUpSavings`, keeping finished years' results in `globalThis.paybackYears`. Its boot warm-up therefore loads those years' grids, and its refill after a rewrite does again.
- A true-up year's last cycle runs to PG&E's October read, which can fall after September 30, and anton's scheduler adds PG&E's meter days through Home Assistant's Opower about a day and a half late, every morning, without a `data_rewritten` notice. CSV imports and backfills do announce.
- `trueUpSavings(start, end)` isn't wrapped in `cache()`; the page calls it for the savings card and `payback` calls it again for the current year.

## Goals / Non-Goals

**Goals:**
- No finished true-up year's days loaded twice in a server's life, unless anton rewrites stored data.
- The current year's savings worked out once per render.

**Non-Goals:**
- Keeping the current year's grids or savings across requests: its days change every 5 minutes.
- Making `caseDays` itself faster (about 116 ms for the current year's 41 days); that's per-day work a later change could keep by day, as `chargingDays` does.

## Decisions

### A year is kept from a month after it ends

`cycleGrids` keeps its result in `globalThis.trueUpGrids`, a `Map` keyed by `start..end`, when the range is a whole true-up year (October 1 to September 30, what the cost comparison and Payback ask for; a range from an address could be anything, and keeping each would let anyone grow the memory without end, a review finding) and `end` is more than 31 days before today (site time): by then the October read is in and the scheduler's late meter days have arrived. A range ending later is loaded on each call, as now. `cache()` still wraps the whole, so a render asks the memory once.

Alternative: keep a year as soon as the October read starts the next one, as `payback` treats it. A meter day arriving through the scheduler after that would stay out of the kept grid until a deploy or a rewrite notice, which the scheduler doesn't send.

### Warmed by the Payback warm-up, emptied by the rewrite hook

No new warm-up: `payback(today)` at start and after a rewrite loads 2023-24 to 2025-26 through `trueUpSavings`, filling `trueUpGrids` with the years `comparableYears` asks for. `instrumentation.ts`' rewrite hook clears `globalThis.trueUpGrids` before the warm-ups, beside the other three memories.

### `trueUpSavings` shared within a render

`trueUpSavings` becomes `cache(async (start, end) => ...)`, as `cycleGrids` and `loadPricing` are. Outside a render (the `/api/true-up-savings` route, tests) `cache()` calls it through, so nothing else changes.

## Risks / Trade-offs

- [A kept grid shared between requests could be changed by a caller] → None changes them today (they only build new arrays from them); a test asserts a kept range comes back equal on a second call, and the branch run's word-for-word match covers the page's uses.
- [A meter day for a year more than a month past arrives late without a notice] → It would show only after a deploy or a rewrite notice; PG&E's late days come by CSV import, which announces.
- [The current year stays at about 130 ms, mostly `caseDays`] → Recorded above as a later change.

## Migration Plan

Release as usual (ask first); nothing else is needed. Rollback is the previous release.

## Results

A throwaway branch container on onyx against production, read-only, 2026-11-10:

- **Boot:** the warm-ups logged "caches warmed in 4.0s".
- **Same figures:** the True-Up page's text matched the live release's word for word, for the current year (439 words) and for '24 - '25 (`?start=2024-10-01&end=2025-09-30`, 670 words).
- **Server time:** the True-Up page, fetched with `Accept-Encoding: gzip` inside each container, took 225 to 235 ms on the branch and 308 to 357 ms on the live release, about 100 ms less. That's short of the 130 to 150 ms the proposal estimated: what remains is the current year's own work, mostly `caseDays`, noted above as a later change.

## Rollout

Released as v2026.11.10.11 on 2026-11-10. Its Deploy run passed, connected throughout; onyx kept the result 0 and runs the merge commit, and the server logged "caches warmed in 4.3s" at start. The True-Up page then took 222 to 313 ms inside the container, and its first byte came in 0.28 to 0.34 s through Cloudflare from the Mac over six requests, against 0.43 s before (one earlier request, the first after the restart, took 0.68 s).
