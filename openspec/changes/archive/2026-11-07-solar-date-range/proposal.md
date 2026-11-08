# Proposal

## Why

Solar By Date Range is the dashboard's home page (`/`): a bar chart of solar, grid and house energy over any range, and a day view of that day's 5 minute flows. It still runs on anton-tesla-api-ws's React app and Flask's `/api/v2/formatted`. It is the third page in the migration series, and the first to be redesigned from mockups (https://claude.ai/artifact/24hPuozeo6cFUjoKdo7dSe).

## What Changes

- **`/` moves to tesla-next**, replacing its "not moved yet" placeholder, with the same functionality as anton's page except where this list says otherwise.
- **The range and the open day live in the address** (`/?start=2026-10-01&end=2026-10-31&day=2026-10-14`). The server renders the page with its data; changing the range or the day is a navigation. A missing or invalid range falls back to the current month. Each tab still keeps its own range, and a range can be shared or bookmarked.
- **The charts move from Chart.js to shadcn charts (Recharts).** Bars round only at the outer ends of each stack.
- **The range controls are redesigned:** three presets (This month, This year, True-up year) beside a date-range picker (the shadcn Calendar and Popover the replay bar uses), replacing anton's MUI picker.
- **The True-up year preset is October 1 to September 30**, the true-up year containing today in the site's time zone. anton's Solar page used October 23 to October 22 from the browser's clock.
- **The day view gains day-to-day navigation:** previous and next buttons around the date (which opens a calendar), the arrow keys, and a strip of the range's days to jump between them. Stepping does not stop at the range's edges, only at the first day of data and today. Leaving the day view returns to the range it came from.
- **The day view no longer shows estimates:** no dashed stretches, no "(estimated)" in tooltips, and neither of the Vehicle view's notes about estimated charging. Estimated values are drawn like measured ones. `/api/intervals` keeps returning its estimate flags, unchanged.
- **The flows take anton's day-view colors** (the Tesla app's), on both charts and every page: solar `#F7B500`, home `#3E6AE1`, Powerwall `#31B76B`, grid `#8E8E93`, and a new vehicle color, `#E8474F`. anton's range chart used its own darker blue for the house, which is too dark on the new background.
- **The page stays current:** a `totals` event on the live stream reloads the data when its day is in the range or is the open day, as `totals_updated` does on anton.
- **`/api/range`** answers like Flask's `/api/v2/formatted` (the date, day, solar, grid and house of each bar), so a script can check the port against Flask for any range. The page reads the same function directly, not through the route. Change 7 (cutover) retires it with Flask.

## Capabilities

### New Capabilities
- `solar-range-chart`: the Solar page's range: the address, defaults, presets and picker, daily and monthly bars and their totals, opening a day, staying current, and `/api/range`. Taken from the chart requirements of anton's `dashboard-date-ranges` and `energy-intervals` specs.
- `solar-day-view`: a day's Solar, Home, Vehicle, Powerwall and Grid views, their charts, headlines and breakdowns, and moving between days. Taken from the intraday requirements of anton's `energy-intervals` spec, without its estimate markings.

### Modified Capabilities
- `dashboard-shell`: "One color per energy flow" takes anton's flow colors and adds the vehicle's.

## Impact

- **New code:** `app/page.tsx` (replacing the placeholder), `components/solar/`, `lib/range.ts` with `app/api/range/route.ts`, and the shadcn `chart` component.
- **Shared code:** the live stream's open-and-reopen logic moves out of `components/scene/use-site-data.ts` into a hook both pages use.
- **Dependencies:** `recharts`, through shadcn's `chart` component, pinned exactly.
- **Database (read-only, unchanged):** reads the `data` table (daily totals), and `energy_interval` and the other day tables through the existing `dayIntervals`.
- **Design tokens:** the flow colors in `app/globals.css` change and gain `vehicle`. Nothing uses them yet.
- **Unchanged:** teslasolar.report, Flask's `/api/v2/*`, `/api/intervals`, the Distribution page, the other placeholder pages.
