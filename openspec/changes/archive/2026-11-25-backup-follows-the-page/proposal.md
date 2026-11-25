# Proposal

## Why

Critique round 8 (2026-11-24, P2) found the Impact page at All time, counting 35 outages, above a Backup section that says "No outages, only a Go Off-Grid test" because it keeps its own year, '26 - '27. The heading names that year (PR #87), but two answers to the same question on one page still read as a contradiction. The same critique found that test's one-minute bar filling the whole width, as each bar is measured against the year's longest event, here the test itself.

## What Changes

- When the page shows All time or a true-up year (October 1 to September 30, the current one included), the Backup section shows the same span: its picker and arrows are hidden, its heading still names the span, and `backup` in the address is ignored and left out of every address the page makes. This reverses part of PR #93's choice that the section always keeps its own year.
- Any other page range (Today, This week, This month, This year, a custom range) leaves the section as it is: its own picker, its own `backup` in the address.
- Each event's bar is its length against one day, an event of a day or longer filling it, rather than against the year's longest event.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backup-history`: the section follows the page at All time and on a true-up year, hiding its picker; `backup` is ignored then; a new requirement for the bar's one-day scale. "The Backup section names its year" is replaced by "The Backup heading names its span", since its All time scenario turns around and a MODIFIED block can't drop a scenario.

## Impact

- `lib/backup-years.ts`, `app/impact/page.tsx`, `components/impact/impact-page.tsx`, `components/impact/backup-section.tsx` and their tests.
- `/api/backup` is unchanged; `backup` in the address keeps its values and still works on the other ranges.
