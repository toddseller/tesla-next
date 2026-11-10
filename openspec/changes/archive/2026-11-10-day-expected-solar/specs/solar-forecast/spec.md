## MODIFIED Requirements

### Requirement: An hour's expected kWh
An hour's expected kWh SHALL be its forecast sunlight times its hour of the day's scale: the kWh that hour of the day made over the 30 days before the hour's own day, divided by its forecast sunlight over the same days, counting only hours with both. An hour of the day with no forecast sunlight in those days SHALL expect 0 kWh.

#### Scenario: Scaling 10 AM
- **WHEN** the 10 to 11 AM hours of the last 30 days made 128 kWh under 15,300 W/m² of forecast sunlight, and today's 10 AM forecasts 532 W/m²
- **THEN** 10 AM today expects about 4.5 kWh

#### Scenario: A past day's hour
- **WHEN** the 11 AM to noon hours of March 17 to April 15, 2026 give a scale, and April 16's 11 AM forecasts its sunlight
- **THEN** April 16's 11 AM expects that sunlight times the scale of the 30 days before April 16, not of the 30 days before today
