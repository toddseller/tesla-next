# Proposal

## Why

The live critique after the home-story release found the same fact reading differently from page to page, so a visitor who checks one number against another starts to doubt them all: today's expected solar is 6.4 kWh on the home page, 7 on the Solar forecast tile and 6 in the Solar day view; the house's use includes the car on some pages and not on others without saying so; the longest outage reads "52.3 hours", "52.3 h" or "2 d 4 h". The home page puts these pages' figures side by side, which is what exposed the seams.

## What Changes

- **Expected solar to a tenth everywhere.** A day's expected kWh is the sum of its forecast hours (or the daily model when there are no hours), rounded to a tenth on the forecast card's tiles, the days ahead, the Solar day view's expected total and the home page. The tile's round-up and the day view's rounding to the nearest whole kWh go.
- **The house's use says whether the car is in it.** Figures from Tesla's daily house total, which includes the car's charging, are labelled as including it: Impact's Home bar, the Solar range chart's House bars and their details, the home page's year shares and Since 2021's house line. Figures with the car taken out say so: the home page's Today and the Solar day view's Total Usage on days with car data. Nothing is recalculated.
- **Outage lengths in days and hours everywhere.** The home page's Records (headline, list, chart details and axis) and Top Ten's outage ranking (each length and the lead over #2) read lengths as Impact's backup section and the Payback card already do ("2 d 4 h", "23 h 59 m"). Top Ten still ranks by the exact length.
- **Three labels that explain a figure:**
  - True-Up's savings card says how its saving relates to solar's: when the Powerwalls cost money, the saving is solar's saving less that cost, and the shown dollars add up.
  - True-Up's VPP tile says a season that hasn't begun has not started, rather than showing $0.
  - The home page's Since 2021 caption stops repeating the true-up net it sits under.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `solar-forecast`: Expected kWh, Today's tile and The next three days read the expected kWh to a tenth.
- `solar-day-view`: The expected total reads to a tenth; the Home view says Total Usage leaves out the car.
- `home-story`: Today's totals, The days ahead, The year's shares, The records, Since 2021 and Since 2021's figures.
- `impact-report`: Solar Offset section labels Home as including the car.
- `solar-range-chart`: Bar details label House as including the car.
- `top-ten`: The record, Longest outages and The timeline read lengths in days and hours, from each outage's exact length; a tie for #1 says so.
- `true-up-tracker`: Savings card says how the saving relates to solar's; VPP credit tile before its season.

## Impact

- `lib/forecast.ts` (`forecastCard`'s day expected), `components/solar/forecast.tsx`, `components/solar/day-view.tsx`, `components/home/today.tsx`.
- `lib/solar/day-views.ts` (the Home view's headline), `components/impact/sections.tsx`, `components/solar/range-chart.tsx`, `components/home/year.tsx`, `components/home/since.tsx`.
- `lib/backup-figures.ts` (`duration()`, reused), `components/home/records.tsx`, `components/top-ten/entries.ts`.
- `lib/true-up/text.ts` (the savings key and `vppText`), `components/true-up/savings-card.tsx`.
- Tests asserting the old whole-kWh expected figures, house labels and hour lengths change with them.
