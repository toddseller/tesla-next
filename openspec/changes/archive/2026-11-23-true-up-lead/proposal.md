# Proposal

## Why

The scorecard round after v2026.11.23.12 (2026-11-23) passed 14 of 15 checks and failed check 11, "every range view opens with a lead sentence carrying a figure, in every preset", on True-Up: All time opens with "Grid energy by PG&E billing cycle", a subtitle with no figure, and so do '21 - '22 to '23 - '24, whose explanation with figures comes only after it, because they have no stored bill to compare and so no headline. Custom ranges open the same way.

## What Changes

- **A true-up year without a headline leads with its explanation**, at the lead size, in place of the subtitle: "In '22 - '23 solar covered 103% of the house's use, yet the house drew 231 kWh more from PG&E than it sent: the Powerwalls lose some of what they store, so solar needs a margin over use to break even." A year with a headline keeps it, the explanation muted under it as now.
- **Every other range gets the same sentence as its lead**, over the billing cycles' days it shows, named from them: All time "Since October 10, 2021 solar has covered 100% of the house's use, yet the house has drawn 4,541 kWh more from PG&E than it sent: …", a past custom range "From March 3 to April 9, 2026 solar covered…", one reaching today "Since November 10, 2026 solar has covered…". The first day named is never before October 10, 2021, the first day of data.
- **The subtitle stays only for a range with nothing to explain yet**: no house use saved, as on the first day of a new true-up year.
- Also records the scorecard round: 14 of 15, check 10 newly passing, check 11 failing on True-Up.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `true-up-tracker`: "The year explained" becomes "The range explained", covering every range and leading where there is no headline; "The headline" gives way to it instead of the subtitle.

## Impact

- `lib/true-up/text.ts` (the explanation takes the range's name rather than a year), `app/true-up/page.tsx` (the share for any range), `components/true-up/true-up-page.tsx` (the lead), with their tests.
- No layout change: the sentence takes the lead's place and size, as the headline does. No mockups.
