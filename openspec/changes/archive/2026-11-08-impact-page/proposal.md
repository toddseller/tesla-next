# Proposal

## Why

The Impact page shows how much of the home's energy over a range came from solar and the Powerwall rather than the grid, and how solar generation compares with home use. It still runs on anton-tesla-api-ws's React app and Flask's `/api/v2/impact`. It is the fourth page in the migration series, redesigned from mockups (https://claude.ai/artifact/SDMZcH1qhX5EuUbVcsF3j2, direction A with each section's explanation under its title).

## What Changes

- **`/impact` moves to tesla-next**, replacing its "not moved yet" placeholder, with the same two sections as anton's page: Self Powered (a ring of the solar, Powerwall and grid shares of home use, the self-powered percentage in its middle, and a legend) and Solar Offset (the energy offset percentage, and bars of solar generated and home use labeled with their energy).
- **Each section explains its number under its title:** "Home use met by solar and Powerwall" and "Solar generated against home use". anton's page had only the titles.
- **The range lives in the address** (`/impact?start=2026-10-18&end=2026-10-18`), rendered on the server with its data, as the Solar page's does. A missing or invalid range shows today in the site's time zone, as anton's page opens on today.
- **The range controls are the Solar page's** (presets beside the shared date-range picker), with five presets: Today, This week (Sunday to Saturday), This month, This year and True-up year (October 1 to September 30), all from the site's today. anton's Today, Week, Month and Year came from the browser's clock, and it had no true-up year.
- **The charts are drawn without a chart library**: the ring is an SVG and the bars are plain boxes on one scale, since neither has tooltips or axes. anton used Chart.js.
- **The flows take the dashboard's colors** (solar, Powerwall, grid and home), replacing anton's own orange, lime, gray and blue.
- **Energy shows one decimal place**, in MWh from 1,000 kWh, as anton's labels do; anton dropped the decimal on whole numbers ("24 kWh"), this shows "24.0 kWh".
- **The page stays current:** a `totals` event for a day in the range reloads its data, and a stream that opens again after being lost reloads it when the range includes today, as on the Solar page.
- **`/api/impact`** answers with the same impact figures as Flask's `/api/v2/impact` for the same range, so a script can check the port against Flask. The page reads the same function directly. Flask's answer also carries the live battery level and status, which this route leaves out: the top bar already has them from the live stream. Change 7 (cutover) retires the route with Flask.

## Capabilities

### New Capabilities
- `impact-report`: the Impact page's range (address, defaults, presets and picker), its Self Powered and Solar Offset sections and their figures, staying current, its layout on phones and wide screens, and `/api/impact`. Taken from anton's `impact-report` spec and the Impact parts of `dashboard-date-ranges`.

### Modified Capabilities
- `dashboard-shell`: "Pages not yet moved link to the live site" takes its example from a page still to move, since `/impact` no longer is one.

## Impact

- **New code:** `app/impact/page.tsx` (replacing the placeholder), `components/impact/`, `lib/impact.ts` with `app/api/impact/route.ts`, and `scripts/compare-impact.mjs`.
- **Shared code:** the Solar page's range controls and range parsing take their presets, default and page path as arguments, so both pages use them. The Solar page's behavior does not change.
- **Database (read-only, unchanged):** sums the `data` table with the meter corrections from `meter_day` that `lib/range.ts` already applies.
- **Dependencies:** none added.
- **Docs:** `README.md` gains the compare script for `/api/impact`, beside the other two.
- **Unchanged:** teslasolar.report, Flask's `/api/v2/*`, `/api/range`, `/api/intervals`, the Solar and Distribution pages, the other placeholder pages.
