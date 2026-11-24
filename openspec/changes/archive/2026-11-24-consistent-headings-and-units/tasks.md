# Tasks

## 1. The energy helper

- [x] 1.1 In `lib/units.test.ts`, test `energy`: 999.9 at 1 digit is `["999.9", "kWh"]`, 1,000 is `["1.0", "MWh"]`, 75,660 is `["75.7", "MWh"]`, 1,086.2 at 0 digits is `["1.1", "MWh"]`, 556.1 at 0 digits is `["556", "kWh"]`, and 987.6 with `top` 1,204.3 is `["1.0", "MWh"]`. See them fail.
- [x] 1.2 Add `energy(kwh, digits, top = kwh)` to `lib/units.ts`; 1.1 passes.

## 2. Impact

- [x] 2.1 In `components/impact/impact-page.test.tsx` (or the sections' test), change the expectations to "Where the house's energy came from", "House use met by solar and Powerwall", "Solar generated against house use" and the bar "House, car included", keeping 12.3 MWh and 15.2 MWh. See them fail.
- [x] 2.2 Change the wording in `components/impact/{impact-page,sections}.tsx` and replace the local `energy` with `lib/units.ts`'s; 2.1 passes.

## 3. Totals across the site in MWh

- [x] 3.1 `lib/lead.test.ts`: All time with 75,643 kWh reads "Solar has generated {75.6} MWh since Oct 10, 2021." and October 2026's 1,086.2 kWh reads "Solar generated {1.1} MWh in October 2026"; 556 kWh is unchanged. See them fail; switch `lib/lead.ts` to `energy`; pass.
- [x] 3.2 Solar range chart: test that a year's totals and tooltips over 1,000 kWh read in MWh and that an axis whose top tick is 1,000 kWh or more reads its ticks in MWh, a month of days staying in kWh. See them fail; change `components/solar/range-chart.tsx`; pass.
- [x] 3.3 Home: Since 2021 gives 75.6 MWh (figure, tooltip rows and screen reader label) and its axis reads in MWh with the unit on the top tick; the year chapter's label reads a year's total in MWh; Habits' Powerwall total reads in MWh past 1,000 kWh; Records' sent-month figures and axis follow the list rule. See them fail; change `components/home/{since,year,habits,records}.tsx`; pass.
- [x] 3.4 Top Ten: a ranking whose first entry is 1,204.3 kWh reads every row and the head's unit in MWh; one under 1,000 kWh stays in kWh; the timeline's axis follows the axis rule. See them fail; change `components/top-ten/entries.ts` and the timeline; pass.
- [x] 3.5 Patterns: the Powerwall rows read in MWh when the largest row is 1,000 kWh or more (2025's 3,030 kWh as 3.0 MWh), and the figures above them read 4.4 MWh in 2026 and 20.7 MWh since 2021. See them fail; change `components/patterns/powerwall-use.tsx`; pass.
- [x] 3.6 True-Up: the Net tile and Imported and Exported read in MWh past 1,000 kWh, each with its own unit; the headline's projection reads "Year-end 2.1 to 2.4 MWh imported" and "with 2.1 to 2.4 MWh imported."; the range sentence reads "drew 2.4 MWh more" and "has drawn 4.5 MWh more"; the NSC line's exported kWh and the cycle chart's axis follow the rules. See them fail; change `lib/true-up/text.ts`, `components/true-up/{tiles,cycle-chart}.tsx`; pass.
- [x] 3.7 Grep for remaining energy formatters that can pass 1,000 kWh (`toLocaleString`, `toFixed`, `" kWh"`) outside daily figures and route any found through `energy`.

## 4. One heading style and mono dollars

- [x] 4.1 Test that the headings of Backup, Payback, the cycle chart, Billing cycles, What the system saved, True-Up's tiles, Top Ten's rankings and admin's three sections carry the section label classes, Backup's year still after its middle dot; and that the savings card's Powerwalls figure, its breakdown values and the what-if figure are `font-mono`. See them fail.
- [x] 4.2 Apply the section label classes in `components/impact/backup-section.tsx`, `components/true-up/{payback-card,true-up-page,savings-card,tiles}.tsx`, `components/top-ten/ranking.tsx` and `components/admin/{bill,payout,vpp}-section.tsx`, 4.1 passes. (The savings card's dollars were already mono through `Measured`; nothing to change there.)

## 5. Docs and verify

- [x] 5.1 DESIGN.md: add the MWh rule beside the Mono Means Measured rule, and say the section label heads every card.
- [x] 5.2 `yarn test` and `yarn build` pass.
- [x] 5.3 On an onyx branch container against live data: Home, Solar All time, Impact All time, Top Ten, Patterns and True-Up All time read large totals in MWh with no axis or list mixing units, every card heading is a section label, the savings card's dollars are mono, and a 390-pixel phone shows no wrapping heading or sideways scroll; then the server's address for the OK before pushing.

## Workflow follow-up

- Fresh ponytail review of the diff, then the code commit, then `Archive consistent-headings-and-units` with specs synced, then the PR.
- Update the `critique-round-4` memory with the PR number.
