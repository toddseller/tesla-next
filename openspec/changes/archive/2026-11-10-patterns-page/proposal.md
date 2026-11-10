# Proposal

## Why

The Health page shows how high the house's overnight floor is, but not when in the day the house uses its energy. A read-only spike against production on 2026-11-10 found that the shape of the day changed: until spring 2026 the house's biggest load ran around noon on solar, and since about May 2026 the midday block is smaller and the hours after midnight are much heavier (the lowest hour doubled, from about 550 W to about 1,100 W), with daily totals only modestly higher. Energy moved from the panels' hours to the Powerwalls' and the grid's. A month-by-hour view shows that at a glance. With it, the page is about how the house and the Powerwalls run, not whether something is broken, so "Health" is the wrong name.

## What Changes

- **BREAKING (address):** the page is renamed **Patterns** and moves from `/health` to `/patterns`; `/health` redirects permanently to `/patterns`, as `/numbers` does to `/true-up`. The top bar's last link reads Patterns.
- A new **When the house uses power** section between Always-on load and Powerwall use: the house's average use in each hour of the day for each month, from every source, as two grids on one scale, "The last 12 months" and "The 12 months before", side by side on wide screens and stacked on a phone. Each square takes one of seven blue steps of 0.5 kW, pale for under 1 kW to deep blue for 3.5 kW and up, with a stepped key.
- The page's other sections are unchanged.
- Built from mockups "D. Patterns: C plus when the house uses power" and "D on a phone, the new section" at https://claude.ai/artifact/LsqArUL5EjVFEeUu3wz5Y8, with the stepped blue scale chosen there.

Out of scope: tapping a square to see its value (the page stays without interaction; values reach screen readers as text), grid import or peak-hour views, and an alert when the shape of the day changes.

## Capabilities

### New Capabilities
- `patterns-page`: the Patterns page at `/patterns`, carrying the Health page's requirements over unchanged in behavior, plus the When the house uses power section.

### Modified Capabilities
- `health-page`: retired; every requirement moves to `patterns-page`.
- `dashboard-shell`: the top bar's last link is Patterns (`/patterns`), and `/health` redirects permanently to `/patterns`.

## Impact

- Renamed: `app/health` to `app/patterns`, `components/health` to `components/patterns`, `lib/health.ts` and its tests to `lib/patterns.ts`, so the code's names match the page.
- New: one query for the house's average use by month and hour over 24 months (about 210 ms on production), the heatmap section and its tests, seven step colors as design-system tokens in `app/globals.css`.
- Changed: `components/top-bar.tsx`, `next.config.ts` (one redirect) and their tests.
- No schema change, no anton companion, no new dependency, env var or version pin.
