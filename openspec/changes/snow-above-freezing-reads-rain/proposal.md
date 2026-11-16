# Proposal

## Why

On 2026-11-16 today's tile read Snow, at a site where it hasn't snowed in decades. Open-Meteo had called one of the day's daylight hours code 73 (moderate snow) with a low of about 48 °F, and a forecast day's sky follows its worst daylight hour, so one mislabeled hour turned the whole day to Snow. The sky now would normally cover it, but Open-Meteo was down that morning, no reading was under 3 hours old, and the tile fell back to the forecast. The days ahead have no sky now to cover them at all.

## What Changes

- **A forecast day whose low is above freezing reads Rain, not Snow.** Its snow codes (71 to 77, 85 and 86) read Rain with the rain icon, on today's tile when it shows the forecast's sky and on each day ahead.
- A day at or below freezing, or one stored before anton kept its low, keeps Snow.

Out of scope: the sky now (a weather reading's snow code, which the Distribution scene draws too) and anton's stored codes, which stay as Open-Meteo sent them.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `solar-forecast`: a forecast day's snow reads Rain when its low is above freezing.

## Impact

- `lib/forecast.ts` (`forecastCard`) and its tests in `lib/forecast.test.ts`. `/api/forecast` carries the rain code for such a day, as the page renders it.
- No change to the tiles' layout or styling, so no mockups. No new dependency, env var or version pin.
