# Tasks

Code tasks are test-first: write the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Tests that need a database use the throwaway PostgreSQL (`inject("pg")`). Tasks marked **(owner)** are done by you; I check each where I can.

## 1. Before building

- [x] 1.1 **(owner)** Confirm how many Powerwalls the house has (the data suggests about 40 kWh usable, three Powerwall 2s); record it in the design's Open Questions as answered

## 2. The days

- [x] 2.1 `caseDays` test-first against the throwaway database: each day also gives the solar-only case's imports and exports from 4 to 9 p.m., the Powerwalls' discharge from 4 to 9 p.m., and their charge and discharge over the day; a day before the fix has its shortfall from the rebuilt house use; the existing tests stay green
- [x] 2.2 Used and held test-first (pure function over a day's figures): the spec's three scenarios, and the thresholds at exactly 1 kWh
- [x] 2.3 The peak-only day test-first (pure function from a solar-only day, its 4 to 9 p.m. figures and an efficiency): the spec's summer day (14.44 kWh exported) and not-enough-to-refill day (2.56 kWh imported off-peak), and a day with no shortfall unchanged

## 3. The year

- [x] 3.1 `trueUpSavings` test-first: held and used day counts; the held-as-solar-only case priced and floored like the NEM cases; the held and used parts summing to what the Powerwalls added; the peak-only case's cost with held days as they were; the efficiency as the year's discharge over charge; no used days giving no peak-only figures; the existing tests stay green
- [x] 3.2 `/api/true-up-savings` answers the new fields (its test's fixture gains them); `README.md`'s savings entry names the split and that peak-only is a simulation
- [x] 3.3 On onyx, with your approval for a read-only run as task 3.4 of true-up-savings ran: the split, the day counts, the peak-only cost and the efficiency for '24 - '25, '25 - '26 and the current year, with the year's largest 4 to 9 p.m. shortfall and the number of days within 0.5 kWh of the thresholds; record the results in the design, and stop to talk them over if any looks unbelievable
- [x] 3.4 VPP event days (`data.is_vpp`) as a third kind, test-first: `caseDays` marks them; they are neither held nor used, a third part of the split between the held and used parts, kept as they were in peak-only and left out of the efficiency, which is measured on used days only (ponytail-review finding); the card and its text give the third part; then rerun 3.3's read-only query on onyx (approved November 8, 2026) and replace the figures in the design, the spec scenarios, the fixtures and the mockup

## 4. The card

- [x] 4.1 Update the what-if boards on the mockup canvas (https://claude.ai/artifact/Hri55pw2tcBD9dEY6NvbGJ; layout B, the Powerwalls' own row, chosen November 8, 2026 and recorded in the design) with 3.3's figures in place of the placeholders, at desktop and phone width; **(owner)** approve the wording with real numbers
- [x] 4.2 `savingsText` test-first: the two parts with their day counts ("cost"/"saved"), the peak-only line ("less"/"more", "about", "simulation"), no peak-only line without used days, from the spec's scenarios
- [x] 4.3 `SavingsCard` test-first: the two lines and the sentence under the Powerwalls' bill effect, laid out as mockup B (a divider, the three columns, the dashed what-if panel; stacked on a phone) with the design system's tokens; the page tests stay green
- [x] 4.4 Under `yarn build && yarn start` locally on the throwaway database seeded with used and held days: no CSP violation or console message on `/true-up`; the entry shows its parts and the peak-only line; at 375 px nothing scrolls sideways; record the results in the design

## 5. Release and checks (after merging)

- [x] 5.1 **(owner)** Publish a release; I watch the Deploy run
- [x] 5.2 On teslasolar.report: the card's Powerwalls entry on '25 - '26 and the current year matches 3.3's figures, no console message, and `scripts/compare-true-up.mjs` still finds no mismatch against Flask on onyx; record the results in the design, committed on the next change's branch

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On the branch `true-up-savings-rollout` (so "Record the true-up-savings rollout" rides along), renamed for this change if you like: commit the code, then archive this change with spec sync as a second commit, `Archive powerwall-what-if`, then open the pull request, mentioning the riding commit.
