# Proposal

## Why

The Top Ten page still runs on anton-tesla-api-ws's React app and Flask's `/api/v2/top_ten`, and it is three plain tables. It is change 6 of the migration and the last page to move, redesigned from mockup D + E (https://claude.ai/artifact/ArRutpsuChtMHbMP8g2UZ6, boards "D + E · Records over a timeline" and its phone board): each ranking leads with its record and shows the ten on a timeline, so the page says how long a record has stood and when the best days came, which the tables never did.

## What Changes

- **`/top` moves to tesla-next**, replacing its "not moved yet" placeholder, with the same three rankings as anton's page: the ten days with the most solar generated, the ten days and the ten months with the most energy sent to PG&E net of imports, using PG&E's meter readings before April 27, 2026 as the other pages do.
- **Each ranking is a card:** its record as the headline (the figure, its date, how long it has stood, its lead over #2), the ten as dots on a timeline across the years, and #2 to #10 as chips. Entries from the current year are marked.
- **Every date links to the Solar page:** a day opens that day in its month, a month opens that month.
- **Exports read as kWh sent to PG&E,** net of imports, without anton's minus sign.
- **Equal figures rank the newer date first.** Figures that read the same to a tenth are ordered newest first, where Flask's order depends on differences the page never shows. This also decides which day takes 10th place when it ties with the 11th.
- **The page stays current:** every `totals` event reloads the rankings, as `totals_updated` does on anton, and so does a stream that opens again after it was lost.
- **One route answers as Flask's does,** so a script can check the port: `/api/top-ten`, like `/api/v2/top_ten`, apart from the order of rows with equal figures and an ISO date on each row. Change 7 (cutover) retires it with Flask.
- **The placeholder goes:** with every page moved, the "not moved yet" page and its requirement are removed.

## Capabilities

### New Capabilities
- `top-ten`: the three rankings and their data (the corrected grid, the tie rule, `/api/top-ten` and its parity with Flask), and the page: records, timelines, chips, links, layout and staying current. Taken from anton's Top Ten page, `/api/v2/top_ten` and the top-ten parts of its `pge-meter-usage` and `dashboard-date-ranges` specs.

### Modified Capabilities
- `dashboard-shell`: "Pages not yet moved link to the live site" is removed; every page has moved.

## Impact

- **New code:** `app/top/page.tsx` (replacing the placeholder), `components/top-ten/`, `lib/top-ten.ts`, `app/api/top-ten/route.ts` and `scripts/compare-top-ten.mjs`.
- **Shared code:** `lib/range.ts` exports its corrected grid expressions for the rankings to reuse.
- **Removed code:** `components/not-moved-yet.tsx` and its test.
- **Database (read-only, unchanged):** reads `data` and `meter_day`, already in `test/schema.sql`.
- **Dependencies:** none added.
- **Docs:** `README.md` gains the route and the compare script.
- **Unchanged:** teslasolar.report, Flask's `/api/v2/top_ten`, and the other four pages.
