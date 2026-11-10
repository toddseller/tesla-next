## Why

The Backup section now gives long times off the grid in days and hours (backup-days), but the Payback card's outage record, which links to it, still reads "35 outages, 156.9 h off the grid, the longest 52.3 h". The two should say the same thing in the same form.

## What Changes

- The Payback card's outage record reads its time off the grid and its longest outage as the Backup section does: "35 outages, 6 d 12 h off the grid, the longest 2 d 4 h".
- The payback data gives the outage record in whole seconds (`seconds`, `longest_seconds`) instead of hours rounded to a tenth (`hours`, `longest_hours`), so the card works from the same figures as the Backup section and the two can't disagree. A total rounded to 48.0 h would read "2 d 0 h" where the Backup section reads "1 d 23 h".
- `/api/payback` serves those fields the same way; the True-Up page, which reloads the card through it, is its only consumer.
- `duration()` moves from the Backup section's component to `lib/backup-figures.ts`, beside the section's other helpers, so the True-Up card doesn't import from the Impact page's component.
- The Top Ten's longest outages stay in hours, the owner's choice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `system-payback`: the outage record's scenario gives the time off the grid and the longest as the Backup section gives them.

## Impact

- `lib/true-up/payback.ts`, `lib/backup-figures.ts`, `components/true-up/payback-card.tsx`, `components/impact/backup-section.tsx`, and their tests (`payback.db.test.ts`, `payback-card.test.tsx`, `true-up-page.test.tsx`, `app/true-up/page.test.tsx`, `backup-section.test.tsx`, `backup-figures.test.ts`).
- `/api/payback`'s `outages` changes from `{count, hours, longest_hours}` to `{count, seconds, longest_seconds}`. No costs or other figures change; the route still answers years only otherwise.
- No data, dependency or setting changes.
