# Proposal

## Why

The forecast card says how much sun each day should bring but nothing about how warm it will be, which is the other thing a glance at a forecast is for. anton now stores the temperature with each 15-minute weather reading and each forecast day's high and low (its `store-temperatures` change, deployed 2026-11-15), so the card can show them without a fetch of its own.

## What Changes

- **Today's tile shows the temperature now** in its lower right, across from the kWh so far, like "58°". It follows the sky now: shown only while the newest weather reading is under 3 hours old.
- **Each day ahead shows its high and low** in its lower right, across from its sky, like "64° / 52°", high first.
- **On a phone** each day row shows its high and low under its kWh, smaller and muted; the kWh column widens to fit, so each row gains a line.
- **Whole degrees in °F**, converted from the °C anton stores.
- A tile without a temperature (a stale or missing reading, a day stored before anton kept its high and low) shows none and looks as it does now.

Out of scope: today's high and low, a temperature on the hourly chart, and °C.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `solar-forecast`: the tiles show the temperature now and each day ahead's high and low; the phone rows and the card's data carry them.

## Impact

- **Depends on anton:** `store-temperatures` (deployed) adds `weather_sample.temperature` and `solar_forecast.temperature_max` and `temperature_min`, all °C and nullable. Its post-deploy check that the rows are filling is still open; this change's branch check against production confirms it.
- `lib/forecast.ts` (the two queries and `forecastCard`), `components/solar/forecast.tsx` (the tiles), `test/schema.sql` (the three columns), and their tests and card fixtures.
- Mockups: "Temperatures on the tiles" on the forecast canvas (https://claude.ai/artifact/J2GadDStFVkHMXHZtbY6Vx), desktop and phone.
- No new dependency, env var or version pin.
