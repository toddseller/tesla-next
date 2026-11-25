# Proposal

## Why

True-Up's Billing cycles list reads poorly on a phone (critique round 9, P2 #3). Below 640px its columns auto-fit at 150px, so a cycle's charge lands alone on a third row, right-aligned in a cell that ends mid-row, and the estimate line under it wraps "kWh" onto a line of its own. At every width a year's row looks like a cycle's row except for a 14px chevron, so an open year's cycles read as more years. And the figures carry no unit: the only "kWh" on the card is in that estimate line.

## What Changes

- Below 640px each row is two columns: its dates (or year) on the left and its charge on the right on the first line, then imported, exported and net below. The charge follows the dates in reading order at every width; from 640px it still sits in the last column, so the five columns stay as they are.
- An open year's cycles are indented by the chevron's width and gap, so their dates line up under the year's name. No tint.
- The heading says the unit once: "BILLING CYCLES" followed by "in kWh" in plain case, since the heading's uppercase would print "KWH". Year rows stay in kWh, as the MWh Rule keeps the cycle rows.

Out of scope: the other round 9 issues, the cycle chart, and the tiles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `true-up-tracker`: the Cycle list states its unit once, puts each row's charge beside its dates on a phone, and indents a year's cycles under it.

## Impact

- `components/true-up/cycle-list.tsx`, `components/true-up/true-up-page.tsx` and their tests.
- No API, data or dependency change.
