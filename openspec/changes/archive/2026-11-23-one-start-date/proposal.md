# Proposal

## Why

Scorecard check 10 (`.impeccable/scorecard.md`): one data start date, stated the same way everywhere. Home says "live and since October 22, 2021" and counts its since-2021 totals, Pick a day and the year chapter from October 22, while Impact's All time, Solar's ranges and calendar, Distribution's replay and the "since Oct 10, 2021" leads start October 10. Both dates are real: the data begins October 10, and the system ran from October 12, powering the house from solar and the Powerwalls (about 262 kWh of solar) with almost nothing sent to the grid, until PG&E's permission to operate on October 22. So Home's totals leave out ten days that Solar and Impact count.

## What Changes

- **Every data figure starts October 10, 2021**, and says so: Home's heading ("live and since October 10, 2021"), the Since 2021 chapter's totals and its chart's description, Pick a day's span and count, and the year chapter's 2021 (from the first day with figures). Home's since-2021 solar grows by about 262 kWh, its share by up to a point, and Pick a day's count by 12.
- **October 22, 2021 stays only where it is the date that matters, named as what it is:** outages ("…since it was approved to run on October 22, 2021", since the house couldn't be off a grid it wasn't yet on), Top Ten's outage note (already so), and the payback timeline, which now says "when the system was approved to run" in place of "when the system went in".
- No layout change, so no mockups.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: "The start date" names October 10, 2021 as the start of the data and keeps October 22, 2021 for outages and payback, named as the day the system was approved to run.
- `home-story`: the heading, the year chapter, Records' never-off-the-grid line, Since 2021's figures and Pick a day use October 10, 2021, outages keep October 22 named as approval.

## Impact

- `components/home/*` and `app/page.tsx` (the start date Home's figures and words use), `lib/home/solar-hours.ts` and `app/api/solar-hours/route.ts`, `components/true-up/payback-card.tsx` (its wording), with their tests.
- Unchanged: `PTO` itself, the payback calculation and the backup events' commissioning rule, which count from October 22 by design; Impact, Solar and Distribution, which already start October 10.
