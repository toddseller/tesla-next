# Spec Delta

## ADDED Requirements

### Requirement: Impact data
`GET /api/impact?start_date=&end_date=` SHALL answer with status 200 and `{"data": {...}}` holding `from_solar_percentage`, `from_powerwall_percentage`, `from_grid_percentage`, `self_powered_percentage`, `total_solar_percentage`, `total_solar`, `from_solar`, `from_powerwall`, `from_grid` and `total_house`, as "Impact figures" defines them, for every range from 2021-10-01 to 732 days after today. Other requests SHALL get status 400 and a message.

#### Scenario: A valid range
- **WHEN** a client requests `/api/impact?start_date=2025-12-10&end_date=2025-12-10`
- **THEN** the answer is status 200 with the ten figures for that day

#### Scenario: A malformed date
- **WHEN** a client requests `/api/impact?start_date=nope&end_date=2026-01-31`
- **THEN** the answer is status 400 with a message, and no figures

## MODIFIED Requirements

### Requirement: Impact figures
For its range, the page SHALL take from the `data` table, with PG&E's meter readings standing in for Tesla's grid figures on days before 2026-04-27 that have them (as `solar-range-chart`'s bar values do): solar generated, home use, and home use from solar, the Powerwall and the grid, each a sum rounded to one decimal place. Each share SHALL be its part of home use as a whole percentage, rounded as Python's `round` does; self-powered SHALL be the solar share plus the Powerwall share, and energy offset solar generated as a share of home use.

#### Scenario: A meter-corrected day
- **WHEN** the range is 2025-12-10, whose Tesla figures are 20 kWh in, 4 kWh out and 30 kWh of house use, and PG&E's meter read 40 kWh in and 8 kWh out
- **THEN** home use is 46.0 kWh, 30.0 from the grid, 11.0 from solar and 5.0 from the Powerwall, and the shares are 65% grid, 24% solar and 11% Powerwall

#### Scenario: A range with no saved days
- **WHEN** the range is today just after midnight, before any totals are saved
- **THEN** every figure and share is 0

## REMOVED Requirements

### Requirement: Impact data matches Flask's
**Reason**: anton-tesla-api-ws retired its `/api/v2` routes on November 9, 2026, so there is nothing left to compare with.
**Migration**: "Impact data" describes the route.
