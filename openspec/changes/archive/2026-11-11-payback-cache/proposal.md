# Proposal

## Why

True-Up is the site's slowest page: 0.29 to 0.37 s to first byte from near the server, against 0.13 s for a route that does almost no work, so about 0.17 to 0.24 s of server work. The page sends nothing until every card's data is ready, so its slowest part sets the wait. That part is payback, about 0.15 s (`/api/payback` answers in 0.28 s).
- **What's already kept:** finished true-up years' prices.
- **What every call still does again:** prices the current year, sums solar output since PTO, and reads the outage history.

The result changes only when today's totals or a data rewrite do. Timing a first build on onyx (2026-11-11) showed that payback alone isn't the long pole:
- Payback and the savings card both price the current true-up year's savings, about 120 ms, and share that work within a page render.
- Keeping payback took `/api/payback` from 155 to 6 ms, but `/true-up` only from 169 to 146 ms.
- The current year's savings (`/api/true-up-savings`, 123 ms) are the rest.

So this change keeps both. It is the part of the True-Up speed work that removes real server time; streaming the page (`true-up-streaming`, planned after this) changes how the wait looks, not how long the data takes.

## What Changes

- **The server keeps the payback figures for the current site day** and answers the Payback card and `/api/payback` from them.
- **It keeps each true-up year's savings too,** answering the savings card, the Payback card and `/api/true-up-savings` from them:
  - A settled year, one that ended more than 31 days ago (the rule the kept cycle grids already use), is kept until a rewrite or restart.
  - Any other year is kept for the site day.
  - Ranges that aren't a true-up year aren't kept.
  - Payback reads finished years from these, and drops its own finished-years store.
- **When a `totals` event arrives for today or yesterday,** it works the unsettled years' savings out again, then the payback from them, and answers from the new figures once they're ready. So both cards still update in place on today's totals.
- **A new site day, a server start or a data rewrite** anton announces starts them afresh. The rewrite drops them with the other kept figures and the existing warm-up fills them again.
- **Unchanged:** every figure, the Payback card, `/api/payback`'s answer, and the page's reloads.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `system-payback`: the payback figures are kept for the day and worked out again when today's totals or a data rewrite arrive.
- `true-up-savings`: a true-up year's savings are kept, a settled year's until a rewrite and any other's for the day; the unsettled ones are worked out again on today's or yesterday's totals, before the payback.

## Impact

- **Code:** `lib/true-up/payback.ts` (the day's payback in memory, and `refreshPayback`), `lib/true-up/savings.ts` (the day's savings in memory, and `refreshSavings`), `instrumentation.ts` (refresh on today's totals, clear on a rewrite), and their tests.
- **Memory:** one payback answer and one savings answer per true-up year, a few kilobytes.
- **Database, anton and the API routes:** unchanged.
