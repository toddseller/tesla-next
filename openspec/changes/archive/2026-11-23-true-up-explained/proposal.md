# Proposal

## Why

Scorecard checks 12 and 13 (`.impeccable/scorecard.md`). Home says "Solar has generated as much as the house used: 75,393 kWh, 100%" beside "671.3 kWh more imported than sent this true-up year", and True-Up says the year is "on track to owe $X to $Y", without either page saying why. The 100% is a since-2021 total held up by the early years: solar covered 110%, 103% and 109% of the house's use in '21 - '22 to '23 - '24, then 95%, 89% and 73% so far as use grew, and the years that owed money ('24 - '25, '25 - '26) are the ones that drew more from PG&E than they sent. Home's one sentence on the true-up ("Most of it comes at midday…") is true but doesn't explain a bill, and Home gives PG&E's standing only in kWh.

## What Changes

- **True-Up explains each year from its own figures.** Under the lead, for a true-up year: how much of the house's use solar covered, and what that left with PG&E. Short of 100%: "In '25 - '26 solar covered 89% of the house's use, so the house drew 2,423 kWh more from PG&E than it sent." Above 100% yet still importing: "…covered 103%…, yet the house drew 231 kWh more…: the Powerwalls lose some of what they store, so solar needs a margin over use to break even." Sending more than drawn: "…covered 109%…, and the house sent 412 kWh more to PG&E than it drew." The year under way says "This true-up year… so far" in the present perfect.
- **Home explains the same.** The Since 2021 chapter's midday sentence gives way to the current year's explanation, opened, when the since-2021 share is 100% or more and this year's is below it, by "That 100% rests on the early years, when solar covered more than the house used."
- **Home gives the dollar estimate.** Under the true-up net, True-Up's estimate for the current year: "$X to $Y, on track to owe at the October 2027 true-up", when True-Up has dollar projections.
- **"No costs on the home page" covers the system's costs only** (what it cost, net cost, amount left, share recovered), which stay private; PG&E's bill estimate, already public on True-Up, may appear.
- Mockups: "True-Up explained mockups" (https://claude.ai/artifact/2hknwZ1sWZvXcDTzkjX4dF).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `true-up-tracker`: adds the year's explanation under the lead.
- `home-story`: the Since 2021 chapter explains the true-up from this year's figures, gives the dollar estimate, and the no-costs rule narrows to the system's costs.

## Impact

- `lib/true-up/text.ts` (the explanation sentence), `app/true-up/page.tsx` and `components/true-up/true-up-page.tsx` (the year's share, the sentence), `app/page.tsx` and `components/home/since.tsx` (this year's share, the estimate, the sentence), with their tests.
- Out of scope: hour-of-day pricing and the non-bypassable charges as reasons (not statable from a year's own figures), All time and custom ranges on True-Up (no single year to explain), and the other scorecard checks.
