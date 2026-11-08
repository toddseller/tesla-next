# Design

## Context

See proposal.md for why. The Solar page (change 3) already provides almost everything this page needs: the address-backed range (`parseRange`, `presets`, `datesLabel` in `lib/solar/ranges.ts`), the presets and picker (`components/solar/range-controls.tsx`), reloads that keep only the latest answer (`components/solar/use-reload.ts`), the live stream hook (`components/use-live-stream.ts`), Flask's meter-corrected SQL (`lib/range.ts`) and Python's rounding (`pyRound`). Flask's `get_impact_data` (anton-tesla-api-ws `models/data.py`) is five sums over `data` through hybrid properties: `solar_generated`, `house_from_powerwall`, `house_solar`, `house_grid` and `house`, the last three with the meter corrections for days before 2026-04-27.

## Goals / Non-Goals

**Goals:**
- `/api/impact` equal to Flask's `/api/v2/impact` on the ten figures for every valid range, checked by a script on onyx, as `/api/range` is.
- Share the Solar page's range code rather than copy it, without changing the Solar page's behavior.

**Non-Goals:**
- The live battery level, status and `modified` that Flask's answer carries. The top bar gets them from the live stream; the compare script ignores them.
- Tooltips, animation or hover states on the ring and bars. anton turned Chart.js's tooltips off, and the mockup has none.

## Decisions

**One query, five sums, Flask's expressions.** `lib/impact.ts` exports `impactFigures(start, end)`: one `SELECT` with the five sums over `data WHERE date BETWEEN $1 AND $2`, then the rounding and percentages in TypeScript as Flask does them in Python (`value or 0`, `pyRound(sum, 1)`, `pyRound(100 * part / total_house)` or 0 with no home use, self-powered as the sum of the two rounded shares). The SQL fragments for `house`, `house_grid` and `house_solar` come from `lib/range.ts`, which already writes the correction terms (`extraImported`, `extraExported`) with Flask's casts; `house_grid` and `house_solar` are added there beside `house` and exported. Alternative: five queries, as Flask runs them. Rejected: each aggregate in one sequential scan sees the rows in the same order a scan of its own would, so the float sums are the same, and the compare script would catch it if they weren't.

**`/api/impact` mirrors `/api/range`.** Same `dateError` checks, 400 with a message and no query on a bad date, `{"data": figures}` otherwise. The page renders `impactFigures` directly on the server; the route is for reloads and the compare script.

**Shared range code takes its differences as arguments.** `RangeControls` takes a `presets` list instead of computing the Solar page's from `today`; the Solar page passes `presets(today)`. `parseRange` takes the fallback range; the Solar page passes the current month, Impact passes today. Impact's presets (`impactPresets(today)`: Today, This week Sunday to Saturday, then the Solar page's three) sit beside `presets` in `lib/solar/ranges.ts`, which stays client-safe; `lib/impact.ts` imports the database and must not reach the browser bundle. Impact builds its own one-line address (`/impact?start=&end=`) rather than giving `address` a path parameter, since the Solar page's `day` has no meaning here. Alternative: a copy of the controls under `components/impact/`. Rejected: two pickers to keep in step.

**The ring and the bars are plain SVG and boxes, not Recharts.** The ring is two to three `circle` arcs drawn with `stroke-dasharray` on a track, in the flow tokens (`stroke-solar`, `stroke-powerwall`, `stroke-grid`; the bars `bg-solar` and `bg-home`), labeled for assistive technology with all three shares; a zero share draws nothing. The bars are two boxes whose widths are each value over the larger of solar and home. Alternative: Recharts' `PieChart` and `BarChart`, already installed. Rejected: change 3 found several Recharts traps, and this page uses none of what it adds (axes, tooltips, stacking).

**Energy labels.** One function: below 1,000 kWh `toFixed(1)` kWh, from 1,000 `toFixed(1)` of the MWh. The figures are already Python-rounded to one decimal, so `toFixed` only pads ("24.0"); for MWh it rounds again as anton's label did.

**Staying current, as on the Solar page.** `ImpactPage` (client) holds the figures in `useReload(address, served)`; `useLiveStream`'s `onTotals` reloads through `/api/impact` when the date is in the range, and `onReopen` reloads when the range includes `siteToday()`.

**Layout.** One column below `lg` (1024 px), two from `lg`, matching anton's spec; the mockup's `auto-fit` grid would go two-up from about 900 px instead. The page card and header follow the Solar page's (`bg-card`, `rounded-[10px]`, the title row with the controls beside it).

## Risks / Trade-offs

- [Real sums return `real`, not `double precision`] → Flask's `house_from_powerwall` and `solar_generated` sums are `real` too, read through psycopg as the same shortest decimal the `pg` driver reads, so both round the same value. The compare script is the check.
- [Moving `presets` out of `RangeControls` touches the Solar page] → its range-controls and page tests run unchanged apart from passing the presets.
- [The `lg` breakpoint leaves a gap at 900 to 1023 px] → one column there is what anton's spec asked for; worth a look at 1024 in the browser check.

## Migration Plan

Merging deploys nothing. After the release (published by you), run `scripts/compare-impact.mjs` on onyx against both apps directly, the way README describes for `compare-range.mjs`, and compare the page side by side with teslasolar.report/impact. Rollback is the existing `tesla-next-next:previous` image; teslasolar.report keeps its Impact page until change 7.

## Rollout (2026-11-08)

- **Before merging:** `scripts/compare-impact.mjs` found no mismatch over its 156 ranges between Flask and a build of the branch, run on onyx in throwaway containers that were removed afterwards. Locally under `yarn build && yarn start`, on a throwaway database seeded with October 18 and November 8, the production CSP was in force (no `'unsafe-eval'`, framing denied) with no console messages. Chrome's window would not resize below 1680 pixels, so the layouts were checked with Playwright's headless Chromium: one column at 375 pixels with nothing past the edge, side by side at 1024 and 1440, matching mockup A. In Chrome, `/impact` opened on today with Today marked, This week pushed `?start=2026-11-08&end=2026-11-14`, and the picker pushed November 2 to 5. The review's two findings, the ring not closing when the shares round to 99 or 101 and the compare loop copied between the two scripts, were fixed test-first.
- **Release `v2026.11.08.2`** passed the gate and rebuilt on onyx with its 912 tests passing; `/impact` and `/api/impact` answered 200 from 15:07 UTC.
- **Parity:** against the deployed app, run on onyx against the apps directly, `scripts/compare-impact.mjs` found no mismatch over 156 ranges, and `scripts/compare-range.mjs` none over 94, so the shared compare loop left the Solar page's check as it was.
- **Staying current:** with today open, `/api/impact` reloaded at 15:10:30 (200) and home use moved from 9.4 to 9.5 kWh, with no page reload.
- **Side by side with Flask:** the ten figures were equal on both sites for today (0% self-powered, 100% grid, 9.4 kWh home at 7:08 AM, which Flask reported too), October 2026 (62% self-powered; 26% solar, 36% Powerwall, 38% grid; 77% offset; 1,086.5 kWh solar, 1,419.1 kWh home) and the 2025 to 2026 true-up year (60%; 36%, 24%, 40%; 89%; 14,363.0 kWh, 16,051.3 kWh).
