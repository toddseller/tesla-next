# Proposal

## Why

The round 4 critique (2026-11-23, 28/40, P1) found Impact's Backup card reading as if it disagreed with its own page: on All time it said "No outages, only a Go Off-Grid test", while Top Ten and True-Up count 35 outages. The card was right about what it shows, this true-up year from its own picker, but nothing on it said so; its picker's "This year" button was the only hint. The picker stays independent, since looking at backups by true-up year apart from the energy range is useful, and outages are too rare for a day or week to say much.

## What Changes

- **The Backup section's picker works as the page's presets do**: This year and All time, with previous and next arrows stepping one true-up year, in place of three year buttons and an Earlier menu, the same shape as True-Up's True-up year and All time.
- **Its heading names what it shows**: "Backup · '26 - '27" for a true-up year (This year included), "Backup · All time" for every year. The `backup` address parameter and everything the section shows stay as they are.
- **Rides along:** Home's "The year on Impact" link ends on December 31, so Impact opens on This year rather than a custom range ending today (pending from round 4). The scorecard round on v2026.11.26.15 (15 of 15) is written into `.impeccable/scorecard.md`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backup-history`: the section's picker steps true-up years with arrows, and its heading names its year.
- `home-story`: the year's link to Impact opens that calendar year.
- `dashboard-shell`: the phone presets menu no longer mentions Earlier years, since no picker has an Earlier menu now.

## Impact

- `components/impact/backup-section.tsx`, `lib/backup-years.ts` (presets), `components/solar/range-controls.tsx` (the Earlier menu, now unused, deleted), `components/home/year.tsx`, with their tests and `components/impact/impact-page.test.tsx` (the section's accessible name).
- No new layout: the picker becomes the shared one the page above uses, and the heading gains a few words. No mockups.
