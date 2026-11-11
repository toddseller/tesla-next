# Proposal

## Why

The Patterns page takes about 650 ms on the server, against about 150 to 250 ms for the other pages: on every visit it works out its three figures from all history since 2021 (the hour grid about 305 ms, the always-on load about 250 ms, the Powerwall years about 88 ms on production), though only the current month changes. The server already keeps finished figures in memory for Impact and True-Up (`warm-caches`), but those memories only empty on a deploy, so a backfill or import in anton shows only after tesla-next's next release. anton now announces each run that rewrites stored data on `data_rewritten` (anton change `announce-data-rewrites`, deployed).

## What Changes

- Patterns keeps its finished months' always-on loads and hour grids, and their Powerwall energy, in memory, and works out only the month that is still changing on each visit. The page shows the same figures.
- The server fills that memory at start, beside the charging and payback warm-ups.
- The server listens on `data_rewritten`. On a notice it forgets every finished figure it keeps, charging days, payback years and Patterns months, and works them out again in the background, so a backfill shows without a deploy. It does the same after its notification connection comes back, since a notice may have been sent while it was down.
- `data_rewritten` stays on the server: open pages' streams don't receive it.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `live-status-stream`: the server refreshes what it worked out from stored data when anton announces a rewrite or the connection comes back, and keeps those notices off the streams.

## Impact

- `lib/patterns.ts` (the split between finished months and the changing one, and the memory), `lib/live.ts` (the new channel, a rewrite hook, and the hook on reconnect), `instrumentation.ts` (the Patterns warm-up and the rewrite hook that empties and refills every memory), their tests.
- One more boot warm-up query batch, Patterns' over all history, the same work a first visit does now.
- No new table, timer or setting; anton must be on `announce-data-rewrites`, which it is.
