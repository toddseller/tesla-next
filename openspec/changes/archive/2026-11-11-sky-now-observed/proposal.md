# Proposal

## Why

At 10:00 AM on 2026-11-11 the Solar page's forecast card read "Partly cloudy now" while the sky was clear and the Distribution page drew sun. Both read the same 15-minute weather reading, but in different ways:
- **The card** labels Open-Meteo's weather code. The model's code was 1 ("mainly clear"), from 21 to 27% low cloud.
- **The Distribution scene** (`skyFrom`, ported from anton) replaces the model's low cloud and fog with Half Moon Bay airport's observed cloud whenever its report is fresh. The airport reported no low cloud.

The airport times the coast's marine layer better than the model, which is why the scene uses it, so the card was the one that was wrong.

## What Changes

- **Today's sky now comes from the reading the scene draws:** the latest reading's cloud, with the airport's observation in place of the model's when it has one. Under 25% cover reads Sunny now, under 75% Partly cloudy now, and from 75% Cloudy now. The airport's reports land on these steps: few clouds is 19%, scattered 44%, broken 75%, overcast 100%.
- **Fog now** needs a fog code and an overcast low sky, so a model's fog under the airport's clear sky reads Sunny now. Rain, snow and thunderstorm codes still read as before.
- **Night** keeps Clear now and Partly cloudy now with moon icons, on the same steps.
- **Unchanged:** the days ahead and today's forecast sky (with no recent reading) keep their forecast codes, since nothing is observed for the future. The 3-hour freshness rule is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `solar-forecast`: "The sky now" is taken from the observed sky the Distribution scene draws, by cloud cover, not from the model's weather code.

## Impact

- **Code:** `lib/forecast.ts` reads the reading's cloud columns and turns them into the sky now. It reuses `skyFrom` from `lib/intervals/weather.ts` and leaves `components/solar/sky.ts` as it is.
- **Database and anton:** unchanged; the airport columns are already on `weather_sample`.
- **`/api/forecast`:** `today.code` becomes the observed sky's code (0, 2, 3, 45 or a precipitation code) while the reading is fresh.
