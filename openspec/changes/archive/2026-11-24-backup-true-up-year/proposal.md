# Proposal

## Why

Critique round 5 (2026-11-24, P1) found two meanings of "This year" on the Impact page: the page's preset means January to December 2026, while the Backup section's picker, a few hundred pixels below, uses the same words for the true-up year '26 - '27.

## What Changes

- The Backup section's preset for the current true-up year reads "True-up year", the words the page's own presets use for the same October to September span. Stepped back, the button still names the year shown ("'25 - '26"), and All time is unchanged.
- Nothing else moves: the section keeps its own picker, and the page's header row of controls stays as it is.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backup-history`: the section's picker reads True-up year and All time.

## Impact

- `lib/backup-years.ts`, `components/impact/backup-section.tsx` and their tests (`lib/backup-years.test.ts`, `components/impact/backup-section.test.tsx`, `components/impact/impact-page.test.tsx`).
- No API, address, data or dependency changes; `backup` in the address keeps its values.
