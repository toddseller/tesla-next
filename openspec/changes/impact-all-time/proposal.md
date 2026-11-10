## Why

Impact's range row stops at True-up year, so the whole of the system's life, and the Home car charging section's full history since Oct 20, 2025, can only be reached by picking dates or typing the address. The True-Up Tracker and Impact's own Backup section both offer All time; Impact's range row should too.

## What Changes

- Impact's presets gain **All time**, last in the row: from the site's first day of service (2021-10-10, the date picker's earliest day) through today. The whole page follows it: Self Powered, Solar Offset and Home car charging.
- It ends today rather than at the end of a year, so it always counts everything so far.
- Impact only: the Solar page's presets stay as they are.
- No mockup: one more button in the existing row, which on a phone becomes two rows of three.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `impact-report`: "Range presets" offers six presets instead of five, the sixth All time.

## Impact

- `lib/solar/ranges.ts` (`impactPresets`) and its test; the Impact page's preset test.
- No new route or data: the range is an ordinary one that `/api/impact`, `/api/car-charging` and the page already accept.
