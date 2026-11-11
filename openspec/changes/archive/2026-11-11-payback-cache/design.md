# Design

## Context

- **Timings,** first byte from near the server, 2026-11-11, three runs each:

  | Address | Time |
  |---|---|
  | `/api/true-up-years` (almost no work) | 0.13 s |
  | `/api/cycles` | 0.21 to 0.24 s |
  | `/api/payback` | 0.28 to 0.29 s |
  | `/true-up` | 0.29 to 0.37 s |

- **`payback(today)`** (`lib/true-up/payback.ts`):
  - It keeps finished years' prices in `globalThis.paybackYears`.
  - On every call it still prices the current year (`trueUpSavings`), sums solar output since PTO, and reads the outage history (`backupHistory`).
  - Its callers are `app/true-up/page.tsx`, `app/api/payback/route.ts` and the warm-up.
- **`instrumentation.ts`:**
  - It warms `payback(today)` at start, with the other caches.
  - On anton's `data_rewritten` notice it clears the kept figures and warms them again.
- **`lib/live.ts`** hands every other notice to `subscribe` listeners, `totals_updated` among them, with the day's date in its payload.
- **The page reloads the payback** from `/api/payback` on a `totals` event for today (`true-up-tracker`, "The Payback card on the page").
- **`trueUpSavings(start, end)`** (`lib/true-up/savings.ts`) is wrapped in React's `cache()`, so the savings card and the Payback card share it within one render, but nothing keeps it between requests. Finished years' cycle grids are kept (`true-up-kept-years`), but the cases worked out from them (`caseDays`) aren't.
- **A first build kept only the payback.** Timed inside onyx's Docker network, five runs each, medians:

  | Route | Live | Payback kept |
  |---|---|---|
  | `/api/payback` | 155 ms | 6 ms |
  | `/true-up` | 169 ms | 146 ms |
  | `/api/true-up-savings` (current year) | | 123 ms |
  | `/api/cycles` | | 18 ms |
  | `/api/true-up-cost` | | 21 ms |

  The current year's savings are the page's long pole, shared with payback within a render.

## Goals / Non-Goals

**Goals:**
- `payback(today)` and `trueUpSavings(start, end)` answer from memory on almost every request, without falling behind today's totals.

**Non-Goals:**
- Streaming the page, and anything the Payback card shows (both are `true-up-streaming`'s).
- Other routes' speed, beyond the savings route that shares the kept savings.

## Decisions

**Keep one day's payback, as a promise.**
- `lib/kept.ts` holds the rule both caches share: a map of `{ day, value }` by key, `value` being the promise of that day's answer (`keptFor`), and a refresh that takes effect at once (`refreshKept`).
- Payback keeps its one answer in `globalThis.paybackKept`.
- `payback(today)` returns `value` when `day` matches. Otherwise it starts working the answer out, stores it, and returns it.
- Two requests at once share the one promise.
- A rejected promise isn't kept, so the next request tries again.
- Kept on `globalThis`, as the other caches are, because Next.js gives route handlers, pages and `instrumentation.ts` their own copies of a module.

**Refresh in the background on today's totals.**
- `refreshPayback(today)` starts working the answer out again and puts that working-out in place at once, falling back to the previous answer if it fails (logged, as the warm-up is). Requests during the refresh wait for the new answer instead of getting the old one.
- `instrumentation.ts` subscribes to `totals_updated` and calls it when the notice's date is the site's today or yesterday. A payload that isn't JSON is skipped: the listener runs inside the database client's notice handler, where a throw would stop every page's stream, or the server. It subscribes at server start, before any page's stream, so `lib/live.ts` starts the refresh before it passes the notice to the pages. The Payback card's reload, sent on that notice, then gets the new answer, as it does today.

Alternative: answer the previous figures until the new ones resolve. Then the reload sent on the same notice would get the old figures, and the card would lag a notice behind.

Alternative: drop the kept answer on today's totals and work it out on the next request. Totals arrive every few minutes, so most visits would find it cold.

**Keep each true-up year's savings: a settled year until a rewrite, any other for the day.**
- `trueUpSavings(start, end)` keeps its answer in `globalThis.savingsKept`, keyed by the range, through `lib/kept.ts`. It replaces React's `cache()`, which the kept promise makes redundant.
- **The day a year is kept under** is "settled" for a year that ended more than 31 days ago, and the site day otherwise.
  - "Settled" is `lib/true-up/grid.ts`'s existing rule for keeping cycle grids. By then PG&E's October read is in, and so are the meter days anton adds late with no notice.
  - A settled year is kept until a rewrite or a server start. Other years are kept for the day.
  - With no new date in its key, a settled year never expires by day, and `lib/kept.ts` needs nothing new.
- Only a true-up year's range is kept, so arbitrary dates in `/api/true-up-savings`'s address can't grow it.
- **Payback reads finished years from these,** and drops its own `globalThis.paybackYears`. That store kept a year's price from the October read on, so it missed the year's late meter days. It was also written when a working-out finished, so a rewrite during one left a pre-rewrite price until restart (review thread 1). Entries in `savingsKept` are written when the working-out starts, so a rewrite's clear removes them.

**Refresh only the unsettled years, with no lookup.**
- A new `refreshSavings(today)` re-works the kept entries kept under today's date. Those are exactly the unsettled years worked out today.
- Each is put in place at once, falling back to its previous answer if it fails, as `refreshPayback` does.
- A year not kept yet needs nothing: its next request works it out fresh.
- `refreshPayback(today)` calls it before working the payback out, so the payback reads the fresh savings. One notice so refreshes both cards' data.
- The years come from what's kept, not from `trueUpYears`, so the refresh is in place synchronously, before the notice reaches any page. A first build looked the current year up first. On the branch container, a savings request sent the instant the notice arrived got the old kept answer (4 ms) while the payback waited for the new one (228 ms).
- A second build re-worked any kept year that ended in the last 60 days. Notices for today arrive every 5 minutes, so it re-worked '25 - '26 (about 1 s) every 5 minutes, long after its October read: about 14 s of database work an hour (review threads 3 and 4).

**Refresh on today's and yesterday's notices.** anton's 00:15 notice finishes yesterday. A notice for an older day comes from a backfill, whose own `data_rewritten` notice empties everything, so it starts nothing.

**A rewrite starts it afresh.** `instrumentation.ts`'s rewrite hook empties `paybackKept` and `savingsKept` with the other kept figures, and the existing re-warm (`payback(today)`, which prices every year's savings) fills them.

**The day comes from the caller.** `payback(today)` already takes the site day, so a request on a new site day doesn't find the old day's answer. There's no timer.

## Risks / Trade-offs

- [A visit during a refresh waits for it, about 120 ms, as every visit does today.] → Refreshes run only on today's totals notices, every few minutes.
- [A new site day's first request pays the full cost.] → Once a day; the first totals notice after midnight refreshes it anyway.
- [One more `subscribe` listener on the server's notice connection.] → Listeners already run for every stream; this one only compares a date.

## Migration Plan

Merging to `main` deploys nothing. After the merge, a `v*` release (with the user's go-ahead) deploys it. Time `/api/payback` and `/true-up` on the live site against the Context table, then decide whether `true-up-streaming` is still worth doing.

## Results

- **Branch container (task 3.2), 2026-11-11, about 11:30 AM PST:** onyx, reading production read-only. Each route was timed from inside the branch container, against the live `next` container over the same Docker network, five runs each, medians:

  | Route | Live | This branch |
  |---|---|---|
  | `/api/payback` | 155 ms | 5 ms |
  | `/api/true-up-savings` (current year) | 120 ms | 4 ms |
  | `/true-up` | 164 ms | 43 ms |

- **Today's totals:** a request sent the instant a `totals` notice for today arrived on the branch's stream (19:30:30 UTC) waited for the fresh answers: savings 282 ms and payback 281 ms, while the current year and '25 - '26 (ended September 30) were re-worked. The next request answered from memory in 3 ms, and the server logged no error.
- **The first build** looked the current year up before refreshing the savings. A savings request sent at the same instant then got the old kept answer in 4 ms, the stale reload this design rules out. See Decisions.

- **Five-thread review, 2026-11-11:** five checks ran in parallel on the change as it stood after the review fixes.
  - **Concurrency:** sound, proven with throwaway tests.
  - **Alternatives:** ours is the best fit. Next.js's data cache can't be revalidated from the notice listener; a database cache is blocked by the read-only rule.
  - **Speed:** past years went from 1,071 to 29 ms, and the current year from 163 to 38 ms. But the 60-day window re-worked '25 - '26 every 5 minutes, and past years expired daily (about 1.05 s on each one's first visit of the day).
  - **Failure modes:** sound (memory, unhandled rejections, Next.js's module copies).
  - **Mutation testing:** 18 of 23 breaks caught. Two `refreshKept` failure paths were untested.
  - **Fixes:** all four were taken: settled years kept until a rewrite; only unsettled years refreshed; refresh on yesterday's notice too; the two missing tests.
- **Branch container after the four changes, 2026-11-11, about 12:00 PM PST:** ten runs each, inside onyx's Docker network, median / p90 in ms, timed straight after the container started and warmed up:

  | Route | Live | This branch |
  |---|---|---|
  | `/api/payback` | 152 / 171 | 4 / 8 |
  | `/api/true-up-savings`, '26 - '27 | 121 / 122 | 3 / 3 |
  | `/api/true-up-savings`, '25 - '26 | 1033 / 1042 | 3 / 4 |
  | `/true-up`, '26 - '27 | 163 / 172 | 39 / 50 |
  | `/true-up`, '25 - '26 | 1080 / 1095 | 30 / 32 |

  At today's next `totals` notice (20:05:30 UTC), requests sent at once waited 238 ms for '26 - '27's fresh savings and for the payback, while '25 - '26, settled, answered in 9 ms. The next request was answered from memory in 3 ms, and nothing was logged as failed.

## Rollout

- **Release v2026.11.11.7, 2026-11-11:** PR #48 merged, and the Deploy run passed in about 3 minutes. The warm-up took 5.1 s.
- **From outside,** first byte through Cloudflare, five runs:
  - `/true-up`: 0.16 to 0.29 s, about 0.20 typical (was 0.29 to 0.37 s);
  - `/true-up` for '25 - '26: 0.15 to 0.19 s (was about 1.2 s);
  - `/api/payback`: 0.11 to 0.14 s (was 0.28 to 0.29 s), the same as `/api/true-up-years`' round trip.
- **Inside onyx's network,** median / p90 of ten:
  - `/true-up`: 35 / 43 ms (was 163 / 172);
  - '25 - '26: 27 / 30 ms;
  - `/api/payback` and the current year's savings: 3 ms.
- What's left of an outside load is mostly the round trip to onyx.
