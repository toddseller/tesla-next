# Design

## Context

See proposal.md for why and specs/patterns-page/spec.md for what the section shows. What shapes the approach:

- The Health page (change `health-page`, released as v2026.11.10.1) is server components only: `app/health/page.tsx` awaits `health()` from `lib/health.ts`, two grouped queries over `energy_interval`, and renders `components/health/` with `siteToday()`. Its bars are plain elements styled with design-system tokens, not Recharts.
- `/numbers` already redirects to `/true-up` from `redirects()` in `next.config.ts`, tested in `next.config.test.ts` and specified in `dashboard-shell`.
- The spike's month-by-hour query over 24 months of `energy_interval` took about 210 ms on production; the page's two existing queries take about 330 ms together.
- The design system lives in `app/globals.css`; flow colors are `@theme` tokens (`--color-home: #3E6AE1` and so on), and pages use their classes, not hex values.
- Mockups: boards "D. Patterns: C plus when the house uses power" and "D on a phone, the new section" at https://claude.ai/artifact/LsqArUL5EjVFEeUu3wz5Y8.

## Goals / Non-Goals

**Goals:**
- The rename and the new section as the specs describe, still served in the first response, still readable at 375 px.

**Non-Goals:**
- Interaction (tapping or hovering a square for its value). The values go to assistive technology as table text; sighted readers get the steps and the key.
- Changing the always-on load or Powerwall use sections.
- A cache. About half a second per visit, for a page visited rarely.

## Decisions

### Rename the code with the page

`git mv` `app/health` to `app/patterns`, `components/health` to `components/patterns` (`health-page.tsx` to `patterns-page.tsx`), and `lib/health.ts`, `lib/health.test.ts` and `lib/health.db.test.ts` to `lib/patterns*`; `health()` becomes `patterns()` and the `Health` type `Patterns`. A page named Patterns whose code says health would mislead the next reader, and doing it with the move keeps git's history of each file.

Alternative: keep the code names and change only the address and labels. Less diff, but two names for one page from then on.

### The redirect sits beside `/numbers`

`redirects()` returns `{ source: "/health", destination: "/patterns", permanent: true }` after the `/numbers` entry, and `next.config.test.ts` expects both. Next.js answers it with 308 before any page code runs, as it does `/numbers`.

### A third query, grouped in the database

`patterns(today)` adds a third query to its `Promise.all`: the average of `(house_from_grid_wh + house_from_solar_wh + house_from_battery_wh) * 12` per `to_char(day, 'YYYY-MM')` and site-time hour of `start_at`, for `day` from the first of the month 23 months before today's month. It returns about 576 rows of `{ month, hour, watts }`. `today` becomes the function's argument so the window follows the site's date; the page already has it from `siteToday()`.

Alternative: average in TypeScript over the raw intervals, about 210,000 rows per visit for the same 576 numbers.

### Shaping is pure and tested apart from the database

`hourGrids(rows, today)` in `lib/patterns.ts` returns the two grids, each 12 months oldest first, each month 24 watts or null for an hour with no rows. `stepOf(watts)` returns 0 to 6: `Math.min(6, Math.max(0, Math.floor((watts - 500) / 500)))`, so 999 W is step 0 and 1,000 W step 1, as the spec's edge scenario says. Both take the spec's scenarios as unit tests. Months are moved with the existing `shift()` in `lib/patterns.ts`.

### Seven step tokens in the design system

`app/globals.css` gains a `@theme` block of its own, after the flow colors', with `--color-use-1` to `--color-use-7`: `#D4E1FA`, `#AFC6F5`, `#89AAEF`, `#6189E8`, `#3E6AE1`, `#2F52B4`, `#213C86`, pale to deep, the fifth the home color. The component lists the seven `bg-use-*` classes literally so Tailwind keeps them. An hour with no house use is a transparent square with the border color's outline, which no step uses.

### One table per grid

Each grid is a `<table>` with a `<caption>` ("The last 12 months", "The 12 months before"), a header row of 24 hour cells, and a row per month with a row header ("Dec '25") and 24 cells. Each cell is the colored square, holding a visually hidden value like "5.5 kW" (one decimal) or "no readings". The hour headers are visually hidden except 12 AM, 6 AM, Noon and 6 PM, which overflow their narrow cells to label the axis (12a, 6a, 12p, 6p below `sm`). A screen reader moving through a cell announces its month row header, its hour column header and the value, which is what the spec asks; no extra labels per cell.

`table-fixed`, 24 equal columns and `border-separate` with a 1 px spacing (2 px from `sm`) keep every hour visible at 375 px, as the phone mockup shows.

### Layout

The section goes between the two existing sections in `patterns-page.tsx`. The grids sit in `grid gap-8 lg:grid-cols-2`: side by side from 1024 px, stacked below. The stepped key (seven swatches labelled 0.5 to 3.5+, then "kW") sits in the section header and wraps under the title on a phone.

## Risks / Trade-offs

- [Three queries make a visit about half a second] → Fine at this site's load. The heatmap's months before this one never change, so they could be kept on `globalThis` like the car-charging days if it ever matters; no spec change needed.
- [The clocks going back give one hour two sets of intervals, and going forward leave an hour with none on one day] → An average over a month's intervals absorbs both; nothing to special-case.
- [This month is partial, and in its first hours most of its squares are empty] → The spec says so; an empty square is drawn unlike any step, so it isn't read as low use.
- [A fixed scale of 0.5 kW steps up to 3.5 kW] → The spike's hourly averages run from about 450 W to 6.7 kW, so the steps cover the middle where the shift shows; everything over 3.5 kW is deepest blue. If the house's use changes a lot, the step size is one constant.
- [Old links to `/health`] → The permanent redirect; the page is a day old, so there are few.

## Results

A throwaway build of the branch on onyx (2026-11-10; its image's 1,405 tests passed), reading production read-only, removed afterwards:

- `/patterns` served in 0.64s, 0.66s and 0.61s over three loads; `/health` answered 308 to `/patterns`.
- The grids matched the spike: September 2026 reads 6.7 and 6.2 kW at 12 and 1 AM and 1.9 kW at 1 PM; September 2025 reads 1.8 kW at 1 AM and 3.7 kW at 1 PM. The grids ran from December 2024 to November 2026 with every hour filled, so no empty squares.
- The always-on and Powerwall sections were unchanged (November so far 864 W).

## Migration Plan

A normal release. After the deploy: open `/patterns` on teslasolar.report at 1280 and 375 pixels against the D boards, check `/health` answers a permanent redirect to `/patterns`, and that the top bar still fits one line at 1512 pixels; record it in this design. Rollback is the previous release, which serves `/health` again.

## Rollout

Released as v2026.11.10.2 on 2026-11-10. The Deploy workflow failed, but the deploy did not: the runner's SSH session through Cloudflare was closed at 15:36:08 UTC, right after the image's tests passed and `next build` compiled, with no disconnect logged by onyx's sshd. `bin/deploy` ran on without its client, built the image at 15:36:17 and replaced the container at 15:36:28, so the workflow never saw the end or its health check.

On teslasolar.report after it: `/patterns` served in 0.85s, 1.11s and 1.13s, a few seconds after the container started, with the figures the onyx branch run showed (September 2026 at 1 AM 6.2 kW, September 2025 at 1 PM 3.7 kW, November so far 864 W); `/health` answered 308 to `/patterns`; the page matched the D boards at 1280 and 375 pixels, and the top bar held the name, six links and the live status (LIVE 7:37 AM, PW 99% · CHARGING) on one line at 1512 pixels.
