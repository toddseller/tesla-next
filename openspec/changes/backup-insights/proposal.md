# Proposal

## Why

The Backup section says when the grid went down and for how long, but not how the house got through it. The stored 5-minute flows answer that for every outage since 2021: how far the Powerwalls fell and how much was left, whether solar refilled them, and what the weather was. Tesla keeps no history of the batteries' charge (`calendar_history?kind=soe` answers 400), and `battery_sample` only starts on October 17, 2026, so the charge has to be rebuilt from the flows. A read-only check from anton's container (November 9, 2026) showed that this works: 1% of charge is about 0.36 kWh out of the batteries, and "solar exporting while the batteries take none" marks them full 96% of the time.

## What Changes

- **The batteries through each outage**, rebuilt from `energy_interval`: the deepest drop below the outage's start, when it came, and, for an outage that started full, the lowest charge as a percentage, the kWh left and the hours they would have lasted. Every rebuilt figure is marked as approximate, and the section says how it is worked out.
- **Closest call**: a fifth summary tile, the lowest rebuilt charge in the chosen year, with its day.
- **Weather at the start** of each outage, from `weather_sample`: rain, heavy rain or a thunderstorm, and wind or high wind, or calm.
- **Storm days**: events less than 6 hours apart are grouped in the list, under a line giving their count and total time off the grid.
- **Solar refill**: an outage whose Powerwalls gave out more than their capacity notes that solar refilled them.
- **Blips per year**: one line under the summary, per true-up year for All time, with the counts only.
- New mockups for the section first, since the tiles, rows and phone layout change.
- Nothing in anton changes, and nothing new is stored.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `backup-history`: the outage summary gains the closest call and the blips per year; each outage gains the batteries' rebuilt drop and charge, its weather and the solar refill note; the list groups storm days; the data route carries all of it.

## Impact

- `lib/backup.ts`: the rebuilt battery figures, weather, storm-day groups and blip counts, read in the same requests as now.
- `components/impact/backup-section.tsx`: the fifth tile, the blips line, storm-day groups and the richer rows, after new mockups.
- Reads `energy_interval`, `grid_outage`, `site_state` and `weather_sample`, which the app already reads. No new env var, pin or table.
- README: the Backup history paragraph.
