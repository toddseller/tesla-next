# Proposal

## Why

anton-tesla-api-ws now stores Tesla's backup history (`grid_outage`, 94 events since October 10, 2021), the island status and storm watch it observes (`site_state`, from November 9, 2026), and sends both live (`island_status`, `storm_mode_active`). The site shows none of it: an outage or a storm watch is invisible, the house's 35 real outages since PTO (157 hours, the longest 52 hours from February 4, 2024) appear nowhere, and the savings card prices outage hours in its what-if cases as power bought from the grid, which could not have happened.

## What Changes

- Every backup event gets a kind: **commissioning** (on or before PTO day, October 22, 2021), **test** (it overlaps an `off_grid_intentional` stretch), **blip** (under a minute), or **outage** (the rest).
- A **Backup** section on the Impact page, with its own year picker (This year, the two true-up years before it, Earlier, All time), opening on the current true-up year: the outages' count, hours, longest and the energy the house ran on during them, and the full list of the year's events, newest first, each with its kind and a link to its day. The page's date range doesn't change it.
- The **top bar** shows an outage ("OFF GRID", since when once known), a test ("OFF GRID TEST") and storm watch ("STORM WATCH") beside the Powerwall pill.
- The **live stream** forwards the new live fields, and tells pages when the outages or the site's state change, so the top bar and the Backup section update without a reload.
- The **Solar day view** shades the day's off-grid and storm watch spans and lists them under the chart, with the energy the Powerwalls took from the grid during storm watch.
- **Top Ten** gets a fourth ranking, the longest outages, in hours. The VPP switch doesn't apply to it.
- The **savings math**: intervals during an outage or blip count as dark (no imports, no exports) in the solar-only and no-system cases, since neither could have powered the house. Storm watch days become a fourth kind of Powerwall day, ahead of held and used days, with their own line on the savings card once a true-up year has any.
- No dollar value is put on outage hours.

## Capabilities

### New Capabilities
- `backup-history`: the backup events, their kinds, the outage summary, the Backup section on the Impact page and its data route.

### Modified Capabilities
- `live-status-stream`: the live status carries `island_status` and `storm_mode_active`; outage and site-state changes reach open pages as events; the server keeps the current site-state stretch.
- `dashboard-shell`: the top bar's live status shows an outage, a test and storm watch.
- `day-intervals`: the day's response includes its off-grid and storm watch spans.
- `solar-day-view`: the day view shades and lists those spans.
- `top-ten`: a longest-outages ranking, on the page and in `/api/top-ten`.
- `true-up-savings`: outage intervals are dark in the solar-only and no-system cases; storm watch days are a fourth kind in the Powerwalls' split.
- `true-up-tracker`: the savings card's key lists storm watch days.

## Impact

- `lib/live.ts`, `app/api/live/route.ts`, `components/use-live-stream.ts`, `lib/live-status.ts`, `components/top-bar.tsx`: two more channels, a current site-state stretch, new top bar pills.
- New `lib/backup.ts`, `app/api/backup/route.ts`, a Backup section in `components/impact/`.
- `lib/top-ten.ts` and `components/top-ten/`: a fourth ranking with an hours unit.
- `lib/intervals/intervals.ts`, `components/solar/day-view.tsx`: spans in the day's data and on its charts.
- `lib/true-up/savings.ts`, `lib/true-up/text.ts`: dark outage intervals, the storm watch kind.
- Read-only queries on `grid_outage` and `site_state`; nothing in anton changes. The app's login already reads both tables (checked November 9, 2026, from the app's container).
- The '24 - '25 savings figures shift by a few tens of dollars (about 85 kWh of house use fell in outages); '25 - '26 by cents.
