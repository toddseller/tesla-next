# Proposal

## Why

The forecast card's hourly chart covers only today, so the three days ahead show a day's kWh but not when it should come: whether Thursday's 17 kWh is a foggy morning and a clear afternoon or a gray day throughout. anton already stores the forecast's sunlight for every hour of today and the next three days (`solar_forecast_hour`, fetched with `forecast_days=4`), so the hours are there; only the card doesn't show them.

## What Changes

- **The day tiles pick the chart's day.** Today and each of the next three days become buttons, Today only while there is a day ahead to choose. Pressing one switches the hourly chart under the tiles to that day; Today is chosen when the page opens.
- **The chosen day ahead is raised.** Its tile (its row on a phone) takes a lighter background. Today keeps its solar outline and never changes; with Today chosen, no tile is raised. Tiles don't lighten on hover.
- **A day ahead's chart** is titled with its name, "Thursday by hour", with its date beside it, and shows only the faded expected bars: nothing has been made, so there is no made-against-expected line, no ticks, and the legend names only Expected. Pointing at or touching an hour shows its expected kWh.
- **Its hours are scaled by today's 30 days**, as the day tiles are, not by the 30 days before the day itself, which for the days ahead would count today's unfinished hours.
- **The chart draws in again** when another day is chosen, the estimate first, as a day step in the day view does.
- **The good day reads as a whole kWh.** The footnote and the bars' labels showed it as stored, "43.29999923706055 kWh", on the live site too; it rounds as the tiles' kWh do.
- **The choice survives a reload.** A totals event or a reopened stream reloads the card and keeps the chosen day; once that day is no longer ahead (the page left open past midnight), the chart goes back to Today.

Out of scope: a kWh total over a day ahead's chart (its hours, summed, can differ from its tile by a few tenths, as the two are scaled differently), and hourly views for days beyond the three ahead.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `solar-forecast`: the day tiles choose the hourly chart's day; the chart, its data and its hours' scale cover the three days ahead.
- `site-motion`: the hourly chart draws in again, estimate first, when another day is chosen.

## Impact

- `lib/forecast.ts` (the hours of today and the next three days in one query, each day ahead's hours on its entry in the card), `components/solar/forecast.tsx` (tiles as buttons, the chosen day, the chart's title and legend), and their tests: `lib/forecast.db.test.ts`, `lib/forecast.test.ts`, `components/solar/forecast.test.tsx`, `app/api/forecast/route.test.ts`, and the card fixtures in the Solar page tests.
- `/api/forecast` answers with the days ahead's hours too; the page and the reload keep one shape.
- Mockups: "Pick a day" boards on the forecast canvas (https://claude.ai/artifact/J2GadDStFVkHMXHZtbY6Vx), B and "B on a phone" chosen.
- No new dependency, env var or version pin.
