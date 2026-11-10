## Why

After each deploy, the first visit to the Impact page with All time takes several seconds. `carCharging` works out each day from 2025-10-20 one at a time (about 385 days, several queries each) before it keeps them in `globalThis.chargingDays`, and a deploy starts that cache empty. The Payback card has the same kind of cache (`globalThis.paybackYears`, its finished true-up years), so the first True-Up visit after a deploy prices those years too. Once the caches are filled, the same pages load in about a quarter of a second.

## What Changes

- At server start, `instrumentation.ts` also fills both caches in the background: `carCharging` over All time (from `FIRST_DAY` to today) and `payback(today)`. The live listener starts as it does now.
- The server doesn't wait for them, so it takes requests while they run. A request that arrives before they finish works the days or years out itself, as it does now.
- A warm-up that fails logs the error and stops; the server and the live listener carry on, and pages load cold, as they do today.
- What pages show doesn't change: yesterday, today and the current true-up year are still worked out on every request, and a deploy still takes in anton's corrections to past days.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Only when the caches fill changes; no spec mentions the caches, and every page, route and figure behaves as before (`skip_specs`).

## Impact

- `instrumentation.ts` gains the two warm-ups, with a new `instrumentation.test.ts` beside it.
- On onyx, each deploy runs one All time charging pass and one payback pass against the read-only production database at boot, the same queries the first visits run now.
- No dependencies, env vars, version pins, specs or docs change.
