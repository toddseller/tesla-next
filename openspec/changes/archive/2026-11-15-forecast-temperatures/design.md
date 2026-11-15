# Design

## Context

See proposal.md for why and the delta spec for the behavior. What shapes the approach:

- `forecast(today)` in `lib/forecast.ts` reads the newest `weather_sample` row (`reading`) and the four `solar_forecast` rows (`rows`); `forecastCard()` turns them into the card, and already decides whether the reading is recent (`READING_FOR`, 3 hours) for the sky now. The page and `/api/forecast` both serve `forecastCard`.
- anton's new columns are `REAL` °C: `weather_sample.temperature`, `solar_forecast.temperature_max` and `temperature_min`, each null on rows stored before it kept them.
- `test/schema.sql` is production's schema, regenerated or hand-copied after anton changes a table; positional `INSERT`s in the tests leave trailing nullable columns null.
- The tiles in `components/solar/forecast.tsx`: Today's last line is "N kWh so far"; each day ahead's last line, on wide screens, is its sky. On a phone a day is a grid row `96px | bar | 64px`, with the name and sky stacked on the left and the kWh on the right.

## Goals / Non-Goals

**Goals:**
- Two columns added to queries the card already runs, worked into the card's figures where the sky now is decided.

**Non-Goals:**
- °C, or a unit setting. The site's figures are the house's, and the house reads °F.

## Decisions

### Whole °F in the card, worked out in `forecastCard`

The queries return °C as stored: node-pg reads a `real` from its text form, so 17.8 arrives as 17.8, and rounding it in SQL as well would round twice. `forecastCard` converts and rounds once: `Math.round(c * 9 / 5 + 32)`. The card gains `today.temperature: number | null` and, on each day ahead, `high` and `low: number | null`, both null unless both are stored. The component only prints them, as it prints the rounded good day.

Today's temperature comes from the same `current` reading that gives the sky now, so a reading over 3 hours old shows neither "now" nor a temperature.

Alternative: convert in SQL. It splits the rounding rules between the query and `forecastCard`, where the good day's already is.

### The lower right of each tile

Today's last line becomes a row: "N kWh so far" on the left, the temperature on the right (`justify-between`). A day ahead's sky line does the same with "64° / 52°", centred rather than on the text's baseline, which the sky's icon pulls down, and with thin spaces around the slash, since the mono font's spaces are a full character wide. On wide screens that row is pushed to the tile's bottom (`sm:mt-auto`): Today's taller header and "kWh expected" put its last line lower, and the four bottom lines should read as one level. The bars are left where they are. The figures are `font-mono text-sm text-foreground`, like the tiles' kWh. With no temperature the row holds its left part alone, so the tile is as before.

On a phone, the kWh cell stacks the kWh over the high and low (`text-xs text-muted-foreground`), and the grid's last column widens from 64 to 80 px so "64° / 52°" fits; the bar gives up the 16 px.

"64° / 52°" would read aloud as a slash between two degrees, so it is labelled "High 64°, low 52°" (`role="img"` with an `aria-label`, as the tiles' bars are).

## Risks / Trade-offs

- [anton's rows not filling yet] → Each value is nullable through to the tile, which then shows none; the branch check reads production's newest reading and four days to confirm they carry temperatures.
- [A phone row a line taller] → As in the "Temperatures on a phone" mockup; checked at 375 px.

## Migration Plan

Release as usual, after anton's `store-temperatures` (deployed). Rollback is the previous release.

## Results

A throwaway branch container on onyx against production, 2026-11-15 from 7:30 AM, under the production build and its CSP:
- `/api/forecast` read anton's new columns: today 57° from a reading recent enough to read "Cloudy now", and the next three days 57° / 49°, 58° / 48° and 58° / 54°. That is anton's `store-temperatures` filling both tables.
- Playwright at 1280 and 375 pixels against the "Temperatures on the tiles" mockups: Today's "57°" across from its kWh so far, each day's high and low across from its sky on wide screens and under its kWh on a phone. Nothing scrolled sideways, and the console had no errors.
- Zoomed in, the first build showed the high and low a few pixels under the sky label and the slash floating between full-width mono spaces, and the day tiles' last line above Today's. Fixed here (centred row, thin spaces, `sm:mt-auto`); the rebuilt container's four last lines read level.
