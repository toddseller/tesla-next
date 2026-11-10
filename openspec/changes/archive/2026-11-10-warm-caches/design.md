## Context

See proposal.md for why. What shapes the approach:

- `carCharging(start, end, today)` keeps each finished day (before yesterday) in `globalThis.chargingDays`, and `payback(today)` keeps each finished true-up year in `globalThis.paybackYears` (`priceYear`). Both maps start empty in a new server process. `lib/car-charging.cache.test.ts` and `lib/true-up/payback.cache.test.ts` already check that a kept day or year isn't worked out again.
- Next.js gives `instrumentation.ts`, pages and route handlers each their own copy of a module (project CLAUDE.md). The two caches live on `globalThis`, so days a copy loaded by `instrumentation.ts` fills are the days the Impact page's copy reads; the same reason `lib/live.ts` keeps its state there.
- Next.js waits for `register()` before it serves requests.
- The Impact page asks for All time as `FIRST_DAY` (`lib/scene/replay.ts`) to today; `carCharging` starts from the first day with charging data whatever the range's start.
- Measured on onyx before this change: a kept day costs nothing, a day worked out costs about 10 to 30 ms, and All time with every day kept loads in about 0.27s. How long the Payback card takes with empty caches isn't known; it can only be seen after a restart.

## Goals / Non-Goals

**Goals:**
- The first All time Impact page and the first True-Up page after a deploy load as fast as later ones, once the warm-up has finished.

**Non-Goals:**
- Making a cold day or year faster to work out (the per-day queries, the sequential loop).
- Keeping the caches across deploys (on disk or in the database). A deploy starting afresh is what takes in anton's corrections to past days.
- Warming any other page or range; only these two have caches.

## Decisions

### Warm from `instrumentation.ts`, without waiting

`register()` starts both warm-ups and returns without awaiting them, so a deploy doesn't hold requests back for the length of the warm-up. Each is `import()`ed the way `lib/live` is, inside the `nodejs` check, so the Edge runtime never loads `pg`.

Alternatives: awaiting them in `register()` would block every page, the Distribution page included, for seconds after each deploy; a request to the page from `bin/deploy` after the health check would warm only through HTTP and tie the deploy script to one page's address.

### Call the public functions, not the caches

The warm-ups call `carCharging(FIRST_DAY, today, today)` and `payback(today)`, with `today` from `siteToday()`, exactly as the Impact page's All time range and the True-Up page do, so they fill exactly what those pages read and need no new export. Their results are thrown away.

### Errors are logged and dropped

Each warm-up has its own `.catch` that logs `cache warm-up failed:` with the error's message, so a failed charging warm-up still lets the payback one run, and neither can become an unhandled rejection that ends the process. Without `SYSTEM_COSTS_FILE`, `payback` returns null at once and warms nothing, which is right.

### One log line when both are done

`register()` logs `caches warmed in <N>s` once both have settled. It's how the rollout check knows the warm-up finished before timing a page, and how a later slow first load can be told apart from a warm-up that hadn't finished yet.

### Requests racing the warm-up

A visit that arrives mid warm-up works out any day not yet kept, as now. Both may work out the same day; the second `set` writes the same figures, so nothing is wrong, only repeated. Not worth a lock.

### How it's tested

`instrumentation.test.ts` mocks `lib/live`, `lib/car-charging` and `lib/true-up/payback`, sets `NEXT_RUNTIME` to `nodejs` and calls `register()`. It checks that:

- the listener starts and both warm-ups are called with `FIRST_DAY`, today and today, and today;
- `register()` resolves while the warm-ups are still pending;
- a warm-up that rejects is logged, the other still runs, and `register()` doesn't throw.

That a warmed day or year isn't worked out again is the existing cache tests' job. That the instrumentation copy and the page copy share the caches can only be seen in a real server, so it's checked by timing the pages after the release.

## Risks / Trade-offs

- [The warm-up's queries run against production at boot, alongside the first visits] → They are the same read-only queries the first All time and True-Up visits run today, one day at a time; nothing new is asked of the database.
- [`instrumentation.ts`'s copy of `lib/db` is its own pool, so boot opens a few more connections] → One at a time for the charging days, a handful for payback; `lib/live` already holds one from the same copy.
- [The warm-up takes longer than expected and the first visit still lands cold] → That visit is no slower than today; the log line shows how long the warm-up took.
- [Midnight passes during the warm-up] → Nothing goes stale: it keeps only days before the boot's yesterday, which are finished whatever the date becomes, and the pages work out their own yesterday and today.

## Migration Plan

Ship as a normal release. After the deploy, wait for `caches warmed in` in `docker logs`, then time the Impact page with All time and the True-Up page, and record both and the warm-up time in this design. Rollback is the previous release; nothing persists.
