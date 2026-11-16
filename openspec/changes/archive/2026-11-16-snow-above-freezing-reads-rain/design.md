# Design

## Context

See proposal.md for why and the delta spec for the behavior. What shapes the approach:

- `forecastCard()` in `lib/forecast.ts` builds the card's codes: each day ahead's `code` from its row's `weather_code` (the daylight code, or the daily one before anton kept it), and today's from the recent reading's observed code or, without one, today's row. Each row already carries its low as `temperature_min`, °C, null on rows stored before anton kept it.
- `skyOf(code)` in `components/solar/sky.ts` turns a code into a label and icon, and knows nothing of temperature. The page and `/api/forecast` both serve `forecastCard`.

## Goals / Non-Goals

**Goals:**
- One check where `forecastCard` reads a forecast row's code, so today's fallback and the days ahead both get it.

**Non-Goals:**
- A temperature check on the sky now. A reading is the model's sky at that moment with its own temperature, and the Distribution scene draws the same code; neither showed the problem.

## Decisions

### Swap the code in `forecastCard`, not the label in `skyOf`

A forecast row's snow code (71 to 77, 85, 86) becomes 61 (rain) when its `temperature_min` is above 0 °C. `skyOf` then reads Rain with the rain icon as for any rain code, and `/api/forecast` carries what the page shows, as its spec asks.

Alternative: pass the low to `skyOf`. Today's tile has no low in the card, so the card would gain a field just for this, and the API would still say 73 while the page says Rain.

### 61, one rain code for every snow code

The tile shows only Rain or Snow, not how hard; 61 is the plainest rain code. Keeping the intensity (73 to 63, 85 to 80) would mean a table for a difference nobody sees.

### Above 0 °C, strictly

The request was "the low above freezing". A low of exactly 0 °C keeps Snow. Snow can fall with the air a degree or two above freezing, so this can turn a real but rare snow day at a colder site into Rain; at this site a low above 0 °C with snow has only ever been the model's mistake.

## Risks / Trade-offs

- [A real snow day with a low just above 0 °C reads Rain] → Acceptable here; the threshold is one constant if the site ever moves somewhere it snows.
- [The API's code no longer matches anton's stored code for such a day] → The route already serves the card as the page renders it; the stored code stays untouched for anyone reading the database.

## Rollout

Released as v2026.11.16.0 on 2026-11-16. Its Deploy run passed, and the new container was up at 8:19 AM. At 8:20 AM:
- `/api/forecast` read today Cloudy now (code 3) at 54°, and codes 3, 82 and 80 for November 17 to 19, with lows of 48°, 50° and 50°. No day was forecast to snow, so the swap itself rests on the tests.
- teslasolar.report's card at 1280 pixels showed the same: Cloudy now, Cloudy, Rain and Rain. The console had no errors.
