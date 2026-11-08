# Design

## Context

See proposal.md for why. Flask's `/api/v2/top_ten` (anton-tesla-api-ws `resources/data.py`, `DataTopTen`) answers three lists from `models/data.py`:

- `get_solar_top_ten`: `ORDER BY solar_generated DESC LIMIT 10`, each row `{date: "Jun 13, 2022", solar}` with the column's value as stored.
- `get_to_grid_top_ten`: `ORDER BY coalesce(grid_in, 0) - grid_out LIMIT 10`, the hybrid properties rendered as SQL. Each row is `{date, net_grid: round(grid_in - grid_out, 1)}`, computed in Python from the row's columns (so `from_grid` arrives as the `real` column's shortest decimal), not in SQL.
- `get_to_grid_monthly_top_ten`: `substr(date, 1, 7)` grouped, `sum(coalesce(grid_in, 0)) - sum(grid_out)` in SQL, lowest first, `LIMIT 10`; each row `{date: "May 2024", net_grid: round(net, 1)}`.

`grid_in` and `grid_out` are the meter-corrected figures `lib/range.ts` already ports, with Flask's casts, as private SQL fragments. On a VPP day `grid_out` leaves out the Powerwall's exports (`effective_to_grid`). The live data, read from teslasolar.report on 2026-11-08, has no NULLs in any top ten, and has rows that read the same to a tenth: 78.6 (8th and 9th solar) and 44.7 and 42.1 (export days 5th and 6th, 9th and 10th).

tesla-next already has what the page shell needs: `useReload` and `useLiveStream` for staying current, `address` and `monthOf` for Solar page links, `pyRound`, `niceAxis`, the compare scripts' `firstDifference`, and `ownDatabase` for database tests that need tables of their own.

## Goals / Non-Goals

**Goals:**
- `/api/top-ten` equal to Flask's `/api/v2/top_ten`, apart from tied rows (see specs), checked on onyx against a build of the branch before the pull request.
- The page's first response holds every figure and dot.

**Non-Goals:**
- New rankings (imports, house use) or where today stands; the content stays anton's three rankings.
- Changing anton's tie order: Flask is retired at cutover, so the compare script allows for the tie rule instead.

## Decisions

**One module, `lib/top-ten.ts`, with `topTen()` returning the route's shape.** Flask's three lists with Flask's labels and figures, each row also carrying its ISO `day` (or `month` as `YYYY-MM`). The server page and the route both call it, and the client reloads from the route, so there is one shape and no label parsing. The compare script picks Flask's fields (`date` and the figure), as `compare-range.mjs` does.

**Figures computed where Flask computes them.** Solar is the column as stored. An export day selects its raw columns (`from_grid`, `to_grid`, `powerwall_to_grid`, `is_vpp`, and the day's PG&E readings) and computes `grid_in - grid_out` in TypeScript, as Flask's instance properties do in Python, before `pyRound`. A month's net is summed in SQL with `lib/range.ts`'s fragments, which become exports, and rounded with `pyRound`. Doing the days in SQL instead would subtract `real` values widened to `float8` (12.300000190734863 where Python has 12.3), which can round differently at a half.

**The tie rule needs candidates beyond ten.** Ranking by the figure as shown, then newest date first, can bring in an 11th row that ties with the 10th. Each query therefore returns every row whose ordering value is within 0.1 kWh of the 10th row's (a CTE finds the 10th, `coalesce`d to `-infinity` when there are fewer). TypeScript sorts the candidates by the rounded figure, then date descending, and keeps ten. No row more than 0.1 below the 10th can round to the same tenth, so none is missed. Rounding in SQL instead (`round(x::numeric, 1)`) would round halves away from zero where `pyRound` goes to even, and the page could then order rows by a figure it doesn't show.

**Two deliberate departures from Flask, both unreachable in today's data.**
- **Solar:** days with a NULL solar figure are left out. Flask's `DESC` puts NULLs first, so one would top the list.
- **Exports:** a day with a NULL `from_grid` counts its imports as 0, as Flask's ORDER BY already does. Flask's row formatting would raise on it instead.

**The timeline is positioned HTML, not Recharts.** Each dot is placed by percentages: x from 2021-10-01 to December 31 of the current year, y within `niceAxis` of the ten figures. Recharts' `ResponsiveContainer` renders an empty 0 by 0 box on the server (seen in the true-up page's served HTML) and draws only after measuring in the browser. Positioned HTML is in the first response, needs no measuring, and keeps the dots, gridlines and year labels as plain elements Testing Library can check. The dots are decorative (`aria-hidden`) inside a `role="img"` box whose label lists the ten. The chips under it are the links and the keyboard targets, since dots are too small to tap at 44 pixels.

**Colors from the shell's spec, not the mockup's light gray.** Solar dots are `--color-solar`. Exports use `--color-grid`, as "One color per energy flow" requires, where the mockup used #B8BEC6 for contrast on the card; the #1 ring in `--primary` and the larger #2 and #3 dots keep the ranking readable. The "this year" mark is a small red dot with muted text, since Tesla red can't be text under 24 pixels.

**Wording.** How long a record has stood reads "4 years, 4 months", "1 year, 1 month", "5 months" or "less than a month", from the day (or the month's last day) to today in the site's time zone. The lead over #2 is the difference of the two figures as shown, so it can never disagree with them. The tie rule, the PG&E readings and "net of imports" go in one footnote.

**Staying current.** `TopTenPage` keeps the rankings in `useReload`, keyed by `/top`, and reloads `/api/top-ten` on every `totals` event and on a reopened stream, as anton reloads the top ten on every `totals_updated` and on reconnect. `today`, for the "this year" marks and the record's age, comes from the server render; a page left open past midnight catches up on its next load.

**The placeholder is deleted.** `components/not-moved-yet.tsx` and its test go with the dashboard-shell requirement; `/top` was its last user.

## Risks / Trade-offs

- [A tie at 10th place makes the compare script see a different row from Flask's] → the script compares each ranking's figures in order, and the rows behind each figure as sets, except for the 10th figure, whose rows it only counts.
- [The "this year" marks and the record's age go stale on a page left open overnight] → they are a day out until the next load; the figures still reload with every `totals` event.
- [An export day's figures are computed per row in TypeScript, apart from the ORDER BY in SQL] → tests seed a corrected day, a VPP day and a day with no PG&E reading. The compare script checks the figures against Flask.

## Migration Plan

Merging deploys nothing. Before the pull request, `scripts/compare-top-ten.mjs` runs on onyx against a build of the branch and Flask, as in changes 4 and 5. After the release (published by you), it runs against the deployed app, and the page is compared side by side with teslasolar.report/top. Rollback is the existing `tesla-next-next:previous` image; teslasolar.report keeps its page until change 7.

## Results

- **Before the pull request (November 8, 2026, 10:21 a.m. site time):** `scripts/compare-top-ten.mjs` found the three rankings equal, between Flask and a build of the branch, run on onyx in throwaway containers that were removed afterwards. The answers carried the live figures, led by 80.9 kWh on June 13, 2022. Locally under `yarn build && yarn start`, on a throwaway database seeded with the mockup's solar and export days, ties at 78.6, 44.7 and 42.1 (with an older 11th day at 42.1, left out), a VPP day and a corrected December 2025 day, the production CSP was in force (no `'unsafe-eval'`) with no console message on `/top`. Playwright's headless Chromium showed one column at 375 pixels with nothing past the edge, and each record beside its timeline at 1024 and 1440, matching mockup D + E. Every date link opened the Solar page at its address.
