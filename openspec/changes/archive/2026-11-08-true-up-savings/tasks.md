# Tasks

Code tasks are test-first: write the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Tests that need a database use the throwaway PostgreSQL (`inject("pg")`). Tasks marked **(owner)** are done by you; I check each where I can.

## 1. Checks before building

- [x] 1.1 Find the WestLight/PCE rate sheet in effect for 2026-09-03 to 10-04 and compare its E-TOU-C "generation rate" column with the October 2026 bill's rates (0.15036, 0.05251, 0.08318, 0.05783); record in the design which column the bill uses, and stop to ask if neither matches
- [x] 1.2 Collect every WestLight/PCE residential rate sheet from the one in effect on 2023-10-01 on, from westlightenergy.org's archive (old peninsulacleanenergy.com links redirect there), and record in the design each revision's effective date, four E-TOU-C rates from the column 1.1 chose, and URL; a period with no sheet found is listed for 1.3
- [x] 1.3 **(owner)** For any period 1.2 couldn't cover, and for one bill in each of '23 - '24 and '24 - '25, read the WestLight lines (rates, and whether ECO100 and the Net Generation Bonus appear); record in the design when ECO100 started, and each bill's rates matching 1.2's table or the correction
- [x] 1.4 Read the delivery-only peak and off-peak gap (total less generation less bundled PCIA) for each `rate_revision` row from PG&E's advice letters already cited in anton's `seed_rates.py`, without reading production, and record it in the design next to WestLight's gap, so the Powerwalls' expected size is known before the figures exist

## 2. WestLight's generation pricing

- [x] 2.1 `lib/true-up/westlight.ts` test-first: the rate table from 1.2 and 1.3, newest revision on or before a day, past the newest; a cycle's charges split at October 1 and at a revision, each line rounded with `cents`; the October 2026 bill's cycle at its rates gives $16.60 ($13.08 of generation, $4.11 of ECO100, -$0.59 of Net Generation Bonus); the November 2024 bill ($21.84) and the June 2025 bill (-$70.17, ECO100 1.5¢ with the bonus at 1¢), as the spec's scenarios. `seasonOf` and `inEffect` are exported from `lib/true-up/pricing.ts` for it, and its tests stay green
- [x] 2.2 `README.md`'s true-up entry says where WestLight's rates come from and how to add a revision (one row, then a release)

## 3. The three cases

- [x] 3.1 The year's days in three cases (`lib/true-up/savings.ts`, one query) test-first against the throwaway database, with `energy_interval` and `meter_day` seeded: the spec's sunny and evening intervals; a day before the fix scaled per period, its actual case equal to `meter_day` (imports, exports, peak net); a period with nothing to scale spread evenly; a day before the fix with no PG&E reading used as stored and counted as estimated; a day from April 27, 2026 unscaled; the actual case equal to `dailyGrid`'s days for the same span
- [x] 3.2 `trueUpSavings(start, end)` test-first: each case's PG&E charges per cycle with `priceDays`; the NEM cases floored at `minimumDelivery` to the last counted day (both spec scenarios); no-system charges as they are; WestLight's charges added per cycle; solar saved and Powerwalls added, a negative Powerwalls figure kept; estimated days, last day counted, and the newest PG&E and WestLight rate dates; null for '23 - '24, a range that isn't a true-up year, and All time; the current year counting days so far
- [x] 3.3 `app/api/true-up-savings/route.ts` test-first as `/api/true-up-cost`'s route: 200 with the savings or null, 400 with a message naming the field for a missing, malformed or out-of-window date, no query on a 400; `README.md`'s true-up entry names the route and says `/api/true-up-cost` is unchanged
- [x] 3.4 On onyx, with your approval for a read-only run against production (a throwaway container as the README's compare recipe, `default_transaction_read_only`): `trueUpSavings` for '24 - '25, '25 - '26 and the current year, with its time per year, the number of scaled intervals whose house use went below zero, and, for '25 - '26, the Powerwalls' figure for the days before and after April 27, 2026 on their own; record the results in the design, and stop to talk them over if any looks unbelievable

- [x] 3.5 `lib/impact.db.test.ts` gets a database of its own (`ownDatabase`), since `range.db.test.ts` clears the same tables in the shared one and the two raced: it failed once in four full runs; five full runs pass after
## 4. The savings card

- [x] 4.1 Update the mockup canvas (https://claude.ai/artifact/Hri55pw2tcBD9dEY6NvbGJ; option B, the full-width card with a bar, chosen on November 8, 2026 and recorded in the design) with 3.4's real figures for '25 - '26 and the current year in place of the illustrative ones; **(owner)** approve the wording with real numbers (approved November 8, 2026, with the Powerwalls' VPP credit beside their bill effect and the NEM2 sentence)
- [x] 4.2 The card's text in `lib/true-up/text.ts` test-first, with the spec's '25 - '26 and '24 - '25 figures: saved in whole dollars ("so far" for the current year) and the no-system cost; the bar's parts and its spoken label; the key's paid (PG&E and WestLight) and solar saved; the Powerwalls' bill effect (saved, or cost with the NEM2 sentence and the bar reduced to paid and saved) beside the year's VPP credit (payout, estimate, none); the estimates line with the rebuilt and uncorrected days, and the WestLight rate date once more than 12 months old
- [x] 4.3 The savings card and the page test-first: the card below the tiles for one true-up year from '24 - '25 (finished and current), none for '23 - '24, All time or a custom range; the bar's parts sized by dollars in the grid, Powerwall and solar colors; `app/true-up/page.tsx` loads the savings with the cost; a `totals` event reloads `/api/true-up-savings` with the cost, and a failed reload keeps the shown card; laid out as mockup B with the design system's tokens
- [x] 4.4 Under `yarn build && yarn start` locally on a throwaway database seeded with a year of intervals and PG&E readings: no CSP violation or console message on `/true-up`; the card shows for a true-up year and not for All time; at 375 px nothing scrolls sideways; record the results in the design

## 5. Release and checks (after merging)

- [x] 5.1 **(owner)** Publish a release; I watch the Deploy run
- [x] 5.2 On teslasolar.report: the savings card on '24 - '25 and the current year matches 3.4's figures, no console message, and `scripts/compare-true-up.mjs` still finds no mismatch against Flask on onyx (while Flask still serves); record the results in the design, committed on the next change's branch

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On a branch `true-up-savings` started from `top-ten-without-vpp-soak` (so "Record the top-ten-without-vpp rollout" and "Shorten the cutover soak to one night" ride along): commit the code, then archive this change with spec sync as a second commit, `Archive true-up-savings`, then open the pull request, mentioning the two riding commits.
