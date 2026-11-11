# Design

## Context

See proposal.md for why and specs/live-status-stream/spec.md for the behavior. What shapes the approach:

- `lib/patterns.ts`' `patterns(today)` runs three queries over `energy_interval`: each month's always-on load (the lower middle of its nights' lowest 5 minutes, 1 to 4:55 AM), each calendar year's Powerwall energy out and in with its first day, and each month's house use by site hour from 23 months before this one. On production on 2026-11-10 they took about 250, 88 and 305 ms, about 640 ms together, the page's server time.
- `warm-caches` keeps `globalThis.chargingDays` (Impact's charging, every day before yesterday) and `globalThis.paybackYears` (True-Up's finished years) and fills both at start from `instrumentation.ts`, in the background. They empty only on restart.
- `lib/live.ts` holds one notification connection on `globalThis.liveStatus`, `LISTEN`s on four channels, forwards each notice to its subscribers, and reconnects after an error, an end or a minute without a live status. `/api/live` forwards a channel it has no event name for as a bare `data:` line, which pages read as a live status.
- anton's `data_rewritten` (`announce-data-rewrites`): `{"script", "start", "end"}`, one per run that committed writes, sent after the commit, best effort.

## Goals / Non-Goals

**Goals:**
- Patterns' server time near the other pages', with the same figures.
- Every kept figure refreshed after any rewrite anton announces, and after a reconnect.

**Non-Goals:**
- Forgetting only the days a notice names. Rewrites are rare and run by hand; refilling everything costs what a deploy's warm-up does.
- Caching True-Up's other figures or any other page.

## Decisions

### Patterns splits at the month yesterday is in

`patterns(today)` works out the months before the month holding yesterday once, and the rest on every visit. Yesterday's last intervals arrive after midnight (anton's `finish_yesterday`), so on the 1st the month just ended stays live until the 2nd, as `chargingDays` leaves yesterday out. Each of the three queries takes a `[from, to)` range of days; the kept part runs with `to` at the split, the live part from it:

- Always-on months and hour grids: a month falls wholly in one part, so the parts' rows are joined.
- Powerwall years: the year holding the split falls in both, so its two rows are added up (energy out and in) and the earlier first day kept.

The kept part sits in `globalThis.patternsMonths`, a `Map` from the hour grid's window and the split (`2025-01-01..2026-12-01`) to its rows; a new key clears the old entry first, so it holds one. The window is in the key because on the 1st it moves on a month while the split stays, and memory kept the day before would still hold the window's oldest month. The hour grid's window still starts 23 months before this month, so the kept part covers the window's finished months.

Alternative: keep each night's lowest load and each month-hour's sums instead of the query rows, and work the medians out in JS. More code for the same result, since a finished month's figures never change but by a rewrite.

### One hook for rewrites, kept off the streams

`lib/live.ts` adds `data_rewritten` to its channels but doesn't forward it: it calls the functions registered with a new `onRewrite(hook)`, kept in `globalThis.liveStatus` beside the subscribers. It calls them again when the connection is listening after a reconnect from a break, an error or an end (not on the first connect, when nothing is kept yet, and not after the watchdog's minute of silence: anton goes quiet while Tesla's API fails or its worker is down, sends no notices then, and refilling every minute of such an outage would load the shared database for nothing; review finding). Streams never see the notice, so a page's live status can't be overwritten by one.

Alternative: forward it as a named event and let `instrumentation.ts` subscribe like a stream. It would reach every open browser for nothing, and the reconnect case would need a made-up notice.

### instrumentation.ts empties and refills

`register()` adds `patterns(today)` to its warm-ups and registers one rewrite hook: clear `globalThis.chargingDays`, `globalThis.paybackYears` and `globalThis.patternsMonths`, then run the same warm-ups for the current day, not awaited, each failure logged. The warm-ups move into one function both use, so a hook can't warm a different set from boot.

## Risks / Trade-offs

- [A warm-up already running when a notice arrives can store a figure from the old data after the clear] → It needs a rewrite to land during a warm-up of a few seconds; the next notice, reconnect or deploy corrects it. A generation counter could close it if it ever matters.
- [Several notices in a row, e.g. a script per year] → Each clears and refills; refills of a few seconds overlap but don't change the figures. Debouncing can come later.
- [The first visit after a notice is slow while the refill runs] → It does the work itself, as the first visit after a deploy does today.
- [A rewrite of the current month] → Not kept, so always fresh; only finished months need the notice.

## Migration Plan

Release as usual (ask first). anton already sends `data_rewritten`. After the deploy: time the Patterns page as before, and, with anton's next backfill (or a one-day `backfill_solar_forecast`), check the server log shows the refill and the page answers as before. Rollback is the previous release.

## Results

A throwaway branch container on onyx against production, read-only, 2026-11-10:

- **Boot:** the warm-ups, now with Patterns', logged "caches warmed in 3.3s".
- **Same figures:** once the container had its first live status, the Patterns page's text matched the live release's word for word (before it, only the top bar's live-status time differed).
- **Server time:** the Patterns page, fetched with `Accept-Encoding: gzip` inside each container, took 103 to 125 ms on the branch and 642 to 650 ms on the live release.
- **A rewrite:** anton's one-day `backfill_solar_forecast` (2026-11-01, every row kept) sent `data_rewritten`; the branch logged "stored data rewritten; warming the caches again", then "caches warmed in 2.8s", and Patterns then took 113 to 138 ms. The live release, which doesn't listen on the channel, was untouched. The reconnect path is covered by `lib/live.test.ts`, which kills the listener's connection; it wasn't repeated on onyx.
- Not measured on onyx: the Impact and True-Up pages after the refill (a quoting slip in the timing command); their code is unchanged and their memories refill as at boot.
