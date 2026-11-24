# Proposal

## Why

Critique round 5 (2026-11-24, P2) found that a shared or hand-typed All time address marks the dates button, not All time. True-Up's All time runs from October 1, 2021, so `/true-up?start=2021-10-10&end=2027-09-30` shows exactly what All time shows, from the site's first day of service, yet reads as a custom range; the same holds on Solar and Impact for a range from October 1 to 9, 2021 (the earliest an address may start) or ending after today.

## What Changes

- A range that starts on or before the first day of service (2021-10-10) and ends on or after All time's own end marks the All time preset, on every page with one, desktop buttons and phone menu alike, and the dates button is no longer marked for it.
- True-Up names such a range "All time" in its document title and above its billing cycle chart, as it does for its own All time.
- Ranges that leave out some of the data (starting after the first day of service, or ending before All time's end) are unchanged: still custom, still marking the dates button.
- The address is left as typed; the page isn't redirected to All time's own dates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: which range marks All time, and True-Up's All time title.

## Impact

- `lib/solar/ranges.ts` (the preset match moves here, beside `isTrueUpAllTime`), `components/solar/range-controls.tsx`, and their tests.
- No API, data or dependency changes. Impact's Backup section keeps its own `backup=all` address and is unaffected.
