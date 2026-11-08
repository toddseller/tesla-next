# Proposal

## Why

On the Solar page a daily bar opens its day's 5-minute view, but a range longer than 31 days (This year, True-up year, or a custom range) shows one bar per month and clicking one does nothing. The only way from a year to a month's days is to pick that month again by hand. This is a small fix to make before the cutover retires teslasolar.report, so the new site is the better one to land on.

## What Changes

- **Clicking a period bar opens its days:** the period's first and last day become the range in the address (`/?start=2026-10-01&end=2026-10-31`), so the page shows that month's daily bars, and a daily bar opens the day's 5-minute view as it does now.
- **Back is the browser's back button:** clicking pushes a new address, so back returns to the year. The presets still work, and the day view's back link returns to the month. No link back to the year is added and no new address parameter is introduced.
- **Month-long periods open as they are cut:** a custom range like January 15 to June 14 has 15th-to-14th periods, and clicking one opens that span (for example February 15 to March 14), which is at most 31 days and so shows daily bars.
- **The wording says so:** a period bar's details say that clicking shows its days, and the chart's subtitle for a long range says a month can be selected.
- `/api/range` and its parity with Flask's `/api/v2/formatted` are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `solar-range-chart`: "Opening a day" gains clicking a period bar to show its days, replacing the scenario where it does nothing; "Bar details" says what clicking a period bar does.

## Impact

- **Code:** `components/solar/range-chart.tsx` (period bars become clickable), `components/solar/solar-page.tsx` (pushes the period's range, subtitle), and `periods()` moving from `lib/range.ts` to the client-safe `lib/solar/ranges.ts` with its tests, so the chart can tell which days a bar covers.
- **Unchanged:** `/api/range`, `scripts/compare-range.mjs`, the day view, and the other pages, including the True-Up Tracker's billing-cycle bars.
- **Dependencies, database and env vars:** none.
