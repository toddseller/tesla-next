# Proposal

## Why

The True-Up page is now the slowest, about 250 to 270 ms of server work and 0.43 s to first byte through Cloudflare. A profile on onyx on 2026-11-10 found two causes. The cost card compares the current year with earlier ones (`comparableYears`), and on every visit it prices the 2024-25 and 2025-26 true-up years' days again through `cycleGrids`, about 88 ms each and about 240 ms side by side, though finished years never change but by a rewrite anton now announces. And the current year's savings are worked out twice per visit, once for the savings card and once inside the Payback card (`caseDays` alone about 116 ms), because `trueUpSavings`, unlike `cycleGrids` and `loadPricing`, isn't shared within a render.

## What Changes

- `cycleGrids` keeps a finished true-up year's cycles and days in memory, `globalThis.trueUpGrids`, like the Payback and Patterns memories; the current year is loaded on each visit as now.
- It fills at server start through the Payback warm-up, which already prices every finished year from 2023-24, and the rewrite hook (`cache-rewrites`) empties it with the others, so a rewrite anton announces still shows without a deploy.
- `trueUpSavings` is shared within a page render (`cache()`, as `cycleGrids` and `loadPricing` are), so the savings card and the Payback card work out the current year once.
- The page shows the same figures.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. No figure, page or route changes; `live-status-stream` already requires every figure the server keeps for finished years to be worked out again after a rewrite, which this memory follows (`skip_specs`).

## Impact

- `lib/true-up/grid.ts` (the memory), `lib/true-up/savings.ts` (`cache()`), `instrumentation.ts` (the hook clears `trueUpGrids`), their tests.
- A few megabytes of memory at most, one entry per finished true-up year the pages ask for.
