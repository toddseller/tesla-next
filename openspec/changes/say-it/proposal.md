# Proposal

## Why

The 2026-11-22 design check found the site drawing what it should say, at the glance the owner relies on:

- The house scene labels the grid "GRID 1.2 kW" whether the house is sending power to PG&E or drawing it; only the animated flow line tells them apart, and Now's sentence ("Solar supplies the house.") leaves the export out.
- Today leads with "15.6 kWh made, of 23.8 expected", "20.6 kWh expected by 2:15 PM" and "3.2 kWh still to come", so the reader subtracts to learn the day is 5 kWh behind.
- True-Up's savings bar draws $224 paid and $517 saved, while its key labels the yellow part "Solar saved $547", with the Powerwalls' $30 explained below it.

## What Changes

- **The scene's GRID label says the direction** on a line under its value, as the car's label gives its reading's age: "to PG&E" exporting, "from PG&E" importing, nothing when the grid shows 0 kW. On one line, "10.4 kW · from PG&E" reached POWERWALL's label on a phone. On Now and on Distribution, live and in replay, since they share the scene.
- **Now's sentence names export:** "Solar supplies the house and sends 1.2 kW to PG&E. The Powerwalls are idle at 100%."
- **Today's middle figure is the difference:** "5.0 kWh behind the forecast" (or "ahead of the forecast"; "on the forecast" when it rounds to 0.0), replacing "expected by 2:15 PM".
- **True-Up's key says the bar's figure when the Powerwalls cost money:** "Saved $517", with "Solar $547 against buying it all from the grid, less the Powerwalls' $30" under it. A year the Powerwalls saved money keeps "Solar saved" beside its own part of the bar.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `live-flow-scene`: Live labels (the GRID label's direction).
- `home-story`: Now in a sentence (export); Today against the forecast (the difference).
- `true-up-tracker`: Savings card (the key when the Powerwalls cost money).

## Impact

- `lib/scene/live-scene.ts` (labels), `lib/home/now-sentence.ts`, `components/home/today.tsx`, `lib/true-up/text.ts`, `components/true-up/savings-card.tsx`, and their tests.
