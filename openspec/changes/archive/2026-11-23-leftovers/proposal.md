# Proposal

## Why

The last step of the 2026-11-22 design check (round 2, step 6): small things that read wrong or break the design system. Each was settled in questions on 2026-11-23.

## What Changes

- **Impact's Backup section** says "No outages." right above a listed Go Off-Grid test. When the list isn't empty, it names what's there instead: "No outages, only a Go Off-Grid test."
- **Backup event lengths** ("1 m 4 s") set their figures in mono and their units in the row's sans, as Mono Means Measured does elsewhere, instead of spaced-out mono.
- **Payback's timeline story** plays at half its pace: the line crosses the card in 3 s, stopping 600 ms at each mark, so it lands in about 4 s instead of 7 to 9.
- **The start date** reads one way. A sentence says "October 22, 2021", the day the system was approved to run; a heading or subtitle may shorten it to "October 2021" or "2021". Top Ten's note drops its "October 23, 2021".
- **Today's forecast units** get an 11px floor, DESIGN.md's smallest size; at 0.6em of the days-ahead figures they were 9 to 10.8px.
- **Top Ten's note** runs about 75 characters a line instead of the page's full width.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backup-history`: the outage summary of a year without outages, and how an event's length is set.
- `site-motion`: the Payback card's pace.
- `home-story`: the Records tab with no outages gives the full start date.
- `dashboard-shell`: adds the start date's wording.

## Impact

- `components/impact/backup-section.tsx`, `components/true-up/payback-card.tsx`, `components/home/today.tsx`, `components/home/records.tsx`, `components/home/since.tsx`, `components/top-ten/top-ten-page.tsx`, with their tests.
- No data, route or layout change.
