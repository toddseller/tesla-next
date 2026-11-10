# Proposal

## Why

The site shows where the house's energy comes from, but not how the house and the Powerwalls behave over the years. A read-only spike against production on 2026-11-10 found that the house's overnight always-on draw, which fell to about 270 W every autumn from 2022 to 2025, has stayed near 840 W since June 2026: about 14 kWh a day more than last November. Nothing on the site would have shown it. The same spike found the Powerwalls' yearly throughput, round trip and cycles clean enough to show.

## What Changes

- A new **Health** page at `/health`, added to the top bar after Top Ten, built from mockup C at https://claude.ai/artifact/LsqArUL5EjVFEeUu3wz5Y8 (boards "C. Same month each year, over the last 12 months" and "C on a phone"). Mockups A and B were turned down: a chart with every month of every year gets harder to read with each year and is hard to read on a phone.
- **Always-on load** section: each month's median of the nights' lowest 5-minute house draw between 1 and 5 AM. It shows the latest month's figure, the same month a year earlier and the difference in kWh a day; that month in each year as a row of bars; and the last 12 months as bars, each marked with the same month a year earlier.
- **Powerwall use** section: this year's cycles, round trip and energy out as tiles, with totals since 2021, and a row per year with energy out, cycles (against the three Powerwalls' 40.5 kWh rated size) and round trip.
- The page is rendered per request from two queries over `energy_interval`, with no live reloads: both sections change at most once a day.

Out of scope, from the spike:
- Powerwall capacity by year: battery samples only go back to 2026-10-17, and the nightly-discharge proxy depends on the reserve setting.
- Panel health or a weather-adjusted solar trend: the year-to-year change is within the weather's noise.
- An alert when the always-on load jumps: the owner chose the page only; a weekly check can follow as its own change.

## Capabilities

### New Capabilities
- `health-page`: the Health page, its always-on load and Powerwall use sections, the figures behind them and how they're worked out.

### Modified Capabilities
- `dashboard-shell`: the top bar links six pages, Health last, instead of five.

## Impact

- New: `app/health/page.tsx`, `lib/health.ts` (the two queries), `components/health/` (page, always-on chart, Powerwall section), their tests.
- Changed: `components/top-bar.tsx` (one link) and its test.
- Database: two read-only aggregate queries over `energy_interval`, about 250 ms and 85 ms on production; no schema change, no anton companion.
- No new dependency, env var or version pin.
