# Design

## Context

See proposal.md for why and the delta specs for the behavior. What shapes the approach:

- `forecast(today)` in `lib/forecast.ts` reads, in one `Promise.all`, the hourly scale for the 30 days before today (`hourScale(today)`), today's forecast hours with their made Wh (`hourly.today`), and the newest interval's end. `forecastCard()` turns them into `byHour` through `byHour(hourly)`. The page and `/api/forecast` both serve `forecastCard`, and `useReload` swaps in a new card on today's totals events and a reopened stream without remounting `ForecastCard`.
- anton fetches today and the next three days hourly (`forecast_days=4`), so `solar_forecast_hour` holds every hour the card can show. The day tiles' `days` come from `solar_forecast` and are null when the forecast is stale or unscaled ("No forecast right now").
- `HourColumn` and `HourDetails` in `components/solar/forecast.tsx` already draw an hour with `made: null` as a faded bar alone with expected-only details: that is how today's hours ahead draw.
- `useEntering(ENTER_MS)` is true for its first 650 ms after mount, which is what makes the columns rise; a new mount draws them in again.
- The design system has no token at the mockup's raised `#262D38`. `bg-input` (`#2B313B`) is the nearest token lighter than `bg-secondary` (`#1A1F27`).

## Goals / Non-Goals

**Goals:**
- One more day range in an existing query, not new queries or a new route: the card's reload path and its shape for today stay as they are.
- The component chooses between hours it already has; no fetch on a press.

**Non-Goals:**
- A URL for the chosen day. The choice is a glance, not a place to link to, and the day view already has its own address.
- A new color token for the raised tile.

## Decisions

### Today's hours query covers four days

The query behind `hourly.today` widens from today's site day to today through today + 3, returns each hour's site day beside it, and is renamed `hourly.hours`. Its left join to today's intervals stays as it is, so the days ahead come back with `made_wh` null. `hourScale(today)` is reused for all four days, as the spec's "A day ahead's hour" asks: `hourScale(day)` for a day ahead would count today's unfinished hours and the days ahead's missing ones.

Alternative: call `expectedHours(day)` for each day ahead. Three more queries per card load, each with its own scale, which is the scaling the spec rules out.

### Each day ahead carries its own hours

`ForecastCard.days` entries gain `byHour: ByHour | null`, built by the same `byHour()` with the newest interval's end passed as null, so `byNow` is null and the shown hours are cut to the first and last with expected > 0. `card.byHour` stays today's. A day ahead's `byHour` is null when it has no forecast hour, and every day ahead's is null when today's is (the 7-day rule applies to the shared scale), so "Without an hourly forecast" falls out of the data.

Alternative: one `byHour` map keyed by day beside `days`. It splits a day's figures across two places the component has to rejoin.

### The choice lives in `ForecastCard`'s state

`ForecastCard` keeps the chosen day in `useState`, null for Today. What it draws is `days?.find((d) => d.day === chosen)?.byHour ?? card.byHour`, so a reload keeps the choice while that day is still ahead, and a page left open past midnight drops back to Today because the old day is no longer in `days`. A day ahead's tile becomes a `<button type="button" aria-pressed>` when its own `byHour` is non-null (never without today's), and Today's when any day ahead's is, so Today is never a lone toggle with nothing else to choose; otherwise they render as now.

The chart panel takes the shown day as its React `key`, so choosing another day remounts it and `useEntering` draws it in again; a reload of the same day keeps the key and doesn't.

### What a day ahead's panel changes

The panel's title becomes "<name> by hour" from the same naming the tiles use (Tomorrow, then the weekday), with the date (`Thu, Nov 12`) where today's made-against-expected line sits. The Made and "Expected, where beaten" legend entries render only for today. The footnote stays as it is: pressing a tile is what a viewer tries anyway.

### Styling the chosen tile

The chosen day ahead's tile, and its row on a phone, takes `bg-input` over `sm:bg-secondary`; on a phone the rows are otherwise unfilled, so the chosen row gains `rounded-lg` with the fill. Today's tile keeps `outline-solar` always and is never filled differently. No `hover:` class, so the fill only ever means chosen; `cursor-pointer` and a `focus-visible` ring keep the buttons findable by mouse and keyboard.

Apart from the chosen fill, the cursor and the focus ring, the tiles look as they do now: the mockups are hand-drawn copies of the card, so their spacing, type and phone layout don't carry over. A `<button>` brings the browser's own text alignment, font, border and padding, so each tile resets them (`text-left`, `font-[inherit]`, no border, its current padding) and keeps its current classes.

## Risks / Trade-offs

- [A day ahead's hours, summed, differ from its tile by a few tenths] → The panel shows no total, so the two figures never sit side by side. The tile scales the day's sunlight by whole days, the hours by each hour of the day.
- [`bg-input` is a step lighter than the mockup's raised color] → Checked by eye against "Pick a day, B" in the screenshots; if it reads too strong, the fix is a token, not a hex.
- [A larger card payload] → About 40 more hours of `{start, expected, made}` per card load, every 5 minutes; small against the page.

## Migration Plan

Release as usual; nothing stored changes. Rollback is the previous release.

## Results

A throwaway branch container on onyx against production, 2026-11-15 before sunrise, under the production build and its CSP:
- `/api/forecast` gave all three days ahead their hours: Tomorrow 9 hours (26.1 kWh against its tile's 26), Tuesday 10 (25.7 against 26), Wednesday 10 (1.4 against 1). Today had 9 hours and no made-against-expected line yet.
- Playwright at 1280 and 375 pixels: with Today chosen, the card matched teslasolar.report's tile for tile; with Tuesday chosen, its tile (its row on a phone) was raised, Today kept its outline, and the chart read "Tuesday by hour" with its date, faded bars and the Expected legend alone. Nothing scrolled sideways, and the console had no errors or CSP violations. The keyboard focus ring showed on the focused tile.
- The good day read 43.29999923706055 kWh on the live site and the branch; rounded in this change, the branch answered 43.
- Looked at through the tunnel before the commit: the footnote's "Pick a day above" sentence came out, and Today no longer becomes a lone button with no day ahead to choose.
