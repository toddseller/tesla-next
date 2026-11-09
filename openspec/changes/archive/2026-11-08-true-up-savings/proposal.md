# Proposal

## Why

The True-Up Tracker shows what the house pays PG&E, never what it would have paid without the system, which is the number a visitor most wants. The pricing that bills the true-up (`lib/true-up/pricing.ts`) can price any day's grid energy, so the same rates can price the house's own use as if it all came from the grid, and as if the solar panels ran without the Powerwalls. Since September 2026 the bills show WestLight Energy (Peninsula Clean Energy renamed) nets its generation by peak and off-peak like PG&E. Most of the peak and off-peak gap is in generation, so the Powerwalls' share can only be priced honestly with WestLight's rates included.

## What Changes

- **A true-up year's savings, from '24 - '25 on** (the first year with both PG&E's and WestLight's rates known). Its bill is estimated in three cases, each with PG&E's NEM charges and WestLight's generation charges:
  - **actual:** the grid as metered.
  - **solar only:** the house's use less solar, interval by interval, with nothing the Powerwalls did.
  - **no system:** all of the house's use from the grid.

  Solar saved = no system less solar only; the Powerwalls added = solar only less actual. Tesla's VPP credit stays in its own tile.
- **Days before April 27, 2026 are rebuilt from PG&E's meter.** On days with PG&E's reading, the intervals' grid flows are scaled to PG&E's peak and off-peak imports and exports, and the house's use is rebuilt from them. They count as estimates, like the page's other figures for those days.
- **WestLight's E-TOU-C generation rates** since August 2024, from its dated rate sheets and board decisions, kept as a dated table in this app, with each revision's ECO100 premium (1¢, 1.5¢ through 2025) and Net Generation Bonus (1¢).
- **A savings card** on the True-Up Tracker below the tiles, for each true-up year from '24 - '25, current year included ("so far"): the saving, and a bar of the no-system cost split into paid, Powerwalls saved and solar saved. It reloads with the page's other data.
- **`GET /api/true-up-savings?start_date=&end_date=`** answers the same figures for the page's reloads.

## Capabilities

### New Capabilities
- `true-up-savings`: a true-up year's estimated bill in the actual, solar-only and no-system cases, the rebuilding of days before the meter fix, WestLight's generation pricing, and the savings route.

### Modified Capabilities
- `true-up-tracker`: a savings card with a bar for true-up years from '24 - '25, which reloads with the rest of the page.

## Impact

- **Code:** new `lib/true-up/savings.ts` (the three cases, priced) and `lib/true-up/westlight.ts` (the rate table and generation pricing); `app/api/true-up-savings/route.ts`; `app/true-up/page.tsx` and `components/true-up/` (the card and its reload); `lib/true-up/text.ts` (the card's text).
- **Database (read-only, unchanged):** `energy_interval`, `meter_day`, `rate_revision`, `meter_read`, all already in `test/schema.sql`.
- **Docs:** `README.md`'s true-up entry names the route and where WestLight's rates come from, and how to add one.
- **Unchanged:** `/api/true-up-cost`, `/api/cycles` and `scripts/compare-true-up.mjs` (the savings are a separate answer, so Flask's comparison still holds), the existing tiles, anton-tesla-api-ws.
- **Upkeep:** WestLight's rates change a few times a year. Until a new rate is added, the newest one keeps pricing, and the card says which rates it used.
