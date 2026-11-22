# Design

## Context

See proposal.md for why and the delta specs for the behavior. What shapes the approach:

- `app/page.tsx` is the Solar page today. Every Solar address in the code is built by `address()` in `lib/solar/ranges.ts` (the range chart, the day panel, Top Ten's entries, Impact's backup links), so moving the page is one path in one function plus the route itself.
- Every chapter's figures already have a reader: `latest()` and `siteState()` in `lib/live.ts`; `forecast()` and `forecastCard()` in `lib/forecast.ts`; `dayIntervals()` (its `totals`) in `lib/intervals/intervals.ts`; `impactFigures()` in `lib/impact.ts`; `topTen()` in `lib/top-ten.ts`; `patterns()` with `latestFigures()` and `powerwallYears()` in `lib/patterns.ts`; `trueUpYears()`, `cycleRows()` and `totals()`/`startedCycles()` in `lib/true-up/`; `payback()` in `lib/true-up/payback.ts`, kept per site day.
- The Solar page already keeps its forecast card and a day current from the live stream: `useLiveStream`'s `onTotals` and `onReopen` call `useReload` against `/api/forecast` and `/api/intervals?date=`.
- The live stream carries solar, home, battery and grid power, the Powerwalls' charge and status, and the site's island and storm state; no car power. `lib/scene/live-scene.ts` defines the signs (battery below zero is charging, grid above zero is importing) and `kw()` shows anything under 0.05 kW as "0 kW".
- Pages render per request (`dynamic = "force-dynamic"`), and the production CSP has no `'unsafe-eval'`, so the new page is checked under `yarn build && yarn start`.

## Goals / Non-Goals

**Goals:**
- Each figure a linked page also shows comes from the function that page calls, with the same arguments, so the spec's "figures agree" holds by construction. The new series (solar by day and hour, record steps, running totals) are read-only sums over the same stored data, and the one new query is the year's solar by hour.
- One rule for live direction and staleness, shared with the top bar and the scene.

**Non-Goals:**
- A home-specific API beyond the year switcher's. The Today chapter reloads through the two routes the Solar page already uses.
- Changing how any other page computes or shows its figures.

## Decisions

### Move the Solar page by route, not by rewrite

`git mv app/page.tsx app/solar/page.tsx` (and its test), and `address()` returns `/solar?…`. The Solar page's components stay where they are. `components/top-bar.tsx`'s `pages` gains `{ name: "Home", href: "/" }` first and Solar's `href` becomes `/solar`; the slide direction already follows the array's order.

### Redirect old addresses in the home page

`app/page.tsx` checks its `searchParams` for `start`, `end`, `day` or `readings` and calls Next's `permanentRedirect()` to `/solar` with the same query string (a 308, so the method and query survive). Alternative: `redirects()` in `next.config` with a `has` rule per parameter. That needs four rules that can't be unit-tested beside the page, and the page already reads its `searchParams`; one `if` in the page is smaller and tested with the page.

### The page loads every chapter at once on the server

`app/page.tsx` runs the readers in one `Promise.all`, corrected readings throughout: the forecast card for today, `dayIntervals(today)` (records and totals), `solarHours(year)`, `impactFigures` for the chosen year and for October 22, 2021 to today, the monthly figures for Since 2021, `topTen(false, "corrected")` and the daily series behind its records, `patterns(today, ...)`, the current true-up year's `cycleRows` through `totals(startedCycles(...))`, and `payback(today)`. `components/home/` renders the chapters; Now, Today, the year chapter, Records' tabs and Pick a day are client components, the rest server components.

Alternative: one `/api/home` route the page fetches. It would add a route whose answer is the page itself, and the first response must already hold every figure.

### Now: one pure balance beside the real scene

A pure `lib/home/balance.ts` takes the live status and returns the signed sources (solar, Powerwall, grid) using `kw()`'s 0.05 kW floor and the scene's sign rule (battery below zero charges, grid above zero imports), so the sentence never disagrees with the scene. Staleness and the status line come from `liveStatus()` and `gridPill()`, the top bar's own functions. Now leads with the sentence rather than an equation of the flows: on 2026-11-22 the equation read oddly beside the scene, which already labels every flow, so it was dropped and the sentence grew to lead.

The picture is the Distribution page's own `LiveScene`, fed by `useSiteData` as `components/scene/distribution.tsx` feeds it, with its `StaleWarning` and without `ReplayBar`. Mockups v2 drew a separate flow diagram and a phone flow bar; they were set aside because the scene already shows the same flows with far more care, and a second drawing would be weaker and could disagree with it. The scene keeps its own styling (CLAUDE.md), so its behavior stays specified by `live-flow-scene` and `scene-weather`; this change adds no requirement to them. If `distribution.tsx` holds wiring the home page also needs (the site data hook, the stale warning), it moves into a shared piece both pages render rather than being copied.

Nothing here is an `aria-live` region: it changes every 10 seconds, which would talk over everything else.

### Today: the forecast's hours and the day's records on one chart

The chart is Recharts, as the Solar page's charts are: solar from `dayIntervals(today).records` as an area clipped at the latest record, the Powerwall charging and grid export from the same records as negative areas, and `forecastCard(...).byHour.hours[].expected` as a dashed line over every hour, with a rectangle dimming from now to midnight. "Still to come" is the sum of the expected kWh of the hours after now plus the unspent share of the current hour, the complement of `byNow.expected`, so the two always add to the day's expected kWh.

### The year: one read, one canvas

`solarHours(year)` in `lib/home/solar-hours.ts` sums `solar_generated_wh` from `energy_interval` by site day and hour for the year, read-only, like Patterns' hour grid, and is kept per site day with `keptFor` (8,760 values; past years never change, so only the current year is worked out again, on a totals event for today). `GET /api/solar-hours?year=` answers it for the switcher, refusing a year outside 2021 to the current one with 400. The page serves the chosen year (`?year=`, default the current one) in its first response.

The chart is one `<canvas>`, 24 columns by up to 366 rows, colored on a fixed scale from the year's highest hour; an SVG would be 8,760 elements. Pointing or tapping maps to a row and shows a small readout with the day's link; the canvas carries `role="img"` and the text summary the spec asks for. The switcher is a segmented control, as Top Ten's and the Solar page's are, that `router.replace`s the address and fetches the year.

### Records: staircases from the rankings' own daily figures

Each staircase is the running maximum of the same per-day (or per-month) figure the Top Ten ranking ranks, with its readings and VPP rule, over every day since October 22, 2021: `lib/home/records.ts` takes those series and returns the steps and the current record's date. The longest outage uses the backup history's outages. The top five are the first five of `topTen(false, "corrected")`. "Set N days ago" counts site days, in days below 60, months below 24, years after.

### Habits and Since 2021: monthly series the site already has

Habits draws `patterns(today, …).months`, one line per year. Since 2021 sums Impact's monthly figures (`impactFigures` over each month since October 2021, or one grouped read in `lib/impact.ts` with the same sums by month) into running totals, and marks `payback(today)`'s solar month and whole-system year. Both are Recharts lines.

### One expected kWh per day

`forecastCard()` scales a day's sunlight by whole days for the tile and each hour's sunlight by that hour for the panel, and `forecast-day-by-hour`'s design accepted the two differing because "the two figures never sit side by side". They now do, on the Solar page (19 against 19.9 expected by now) and in the home page's Today. A day whose hours `byHour` covers takes its expected kWh from their sum, rounded; a day without hours keeps the daily scale. This moves some tiles by a kWh or so, which is the point: the hours are the finer model and the one the chart draws.

### Making the year chart usable without a pointer

The canvas gets `tabIndex=0`, and its key handler moves a shown-day index (Up, Down, Home, End) that drives the same readout pointing does; the readout is an `aria-live="polite"` region, so each move is heard once. Month initials sit in a column beside the canvas, positioned by each month's first row. The switcher keeps the shown year until the new one arrives, dims the chart with "Loading 2023…" meanwhile, and on a failed fetch says "Couldn't load 2023" and keeps the shown year chosen.

### The look the critique asked for

DESIGN.md records the oversized chapter words as the home page's own pattern, an exception to "the largest type is a figure", and "Now" moves from Powerwall green to Moonlight so no flow color is used for anything but its flow. The rank digit loses its red (Moonlight, the red kept as the selection line), the Home-blue phone figures grow to 24 px, and chart labels in a flow color are 13 px or more or lightened. Captions read in words: "611.4 kWh more imported than sent since October 1", "The Powerwalls won't pay for themselves within their warranty".

### Sentences come from rules, not from writing

Every sentence a chapter shows that states a fact is a function of the chapter's data, tested like a figure: `lib/home/now-sentence.ts` from the balance, the Records near-miss count from the same series as the staircase (within 2%, a tolerance that reads the same for kWh and hours), and the Habits comparison from Patterns' months (a run of three or more months above or below the same month a year earlier, else the latest month). Sentences that only explain how to read a chart are fixed copy. A hand-written factual sentence would go false the moment the data moved.

### The year chart on a phone

At 390 pixels a day is under a pixel tall, so a tap can't aim at one. Pointer events on the canvas follow a drag (the readout tracks the finger), and the readout carries previous-day and next-day buttons; the keyboard path uses the same shown-day index. Below 640 pixels the switcher is a menu button, as `RangeControls` already does for presets, so new years never overflow the row.

### Pick a day

A native `<input type="date">` with `min` and `max`, and a button that picks a day with `Math.random()` over the span; both navigate with `address()`.

### Today: two reloads, keyed like the Solar page's

The chapter holds `useReload` for the forecast card (`/api/forecast`) and for today's totals (`/api/intervals?date=<today>`), reloaded by `onTotals` for today and by `onReopen`, as `solar-page.tsx` does. `/api/intervals` answers the whole day's records, about 288 of them, when only `totals` is needed; the Solar day view already does the same reload, and a slimmer route can follow if it ever shows up in timings.

### Chapters 3 to 6 render once

They are server components with no stream subscription, as the spec says they stay as served. Dates link through `address()`, so they open `/solar`.

### Mockups decide the layout

The chapter order, each chapter's chart and the behavior are fixed by the spec; the composition is not. Mockups v1 (text-led layouts A, B and C) were set aside because every chapter looked the same; the research board on the same canvas (https://claude.ai/artifact/Qrh6vWVpA3gREz12ACGjdi) gave each chapter its form. Mockups v2 drew those forms; two critique rounds (26/40, then 27/40 on static mockups, with a scorecard against today's `/`) led to v3 and v4. **Approved 2026-11-21: mockups v4**, https://claude.ai/artifact/Qrh6vWVpA3gREz12ACGjdi#page-v4 (desktop `V4-desktop`, phone `V4-phone`; Now's balance by state and the top bar at 1366 and 1440 on `V2-details`). The heading names the system as 12.24 kW of panels and three Powerwalls. Charts in the mockups scale their text with their width; in code, chart text is set in pixels.

## Risks / Trade-offs

- [Seven links and the full live pill need about 1,424 pixels] → The pill's flows show from 1440 pixels (dashboard-shell delta); checked at 1366 and 1440 in the browser.
- [The year chart is 8,760 cells and `/` is opened often] → One canvas, the read kept per site day, other years only on request. Time `/` with it on onyx (below).
- [Running maxima over five years of days on every request] → They come from the daily series the page already reads for Records; if `/` is slow they are kept per site day with the rest (below).
- [`/` runs about nine reads per request, and it is the most opened page] → Each read is one another page already runs per request, and payback is kept per day. Time `/` on onyx under `yarn start` with the production database; if it is over a second, keep chapters 3 to 6 per site day with `keptFor`, refreshed on a totals event, as payback does. Doing so changes no spec.
- [Every old `/` link costs a redirect] → One 308 per old link, and crawlers update to `/solar`.
- [The home page shows corrected readings with no switch] → The spec says so; each chapter links to its page, where the switch is.

## Migration Plan

1. Merge and release as usual (ask before publishing the release). No data or env change.
2. Rollback: publish the previous release; old `/` links go back to the Solar page, and `/solar` links made meanwhile answer 404 until the next release. That is acceptable for a rollback, so no redirect from `/solar` is kept in the old code.
