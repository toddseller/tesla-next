## ADDED Requirements

### Requirement: The day's expected solar
The day intervals response SHALL include the day's expected hours: each hour of the day, site time, with a stored sunlight forecast, its start and its expected kWh (see solar-forecast, An hour's expected kWh), in time order. It SHALL hold no hours when the day has no stored forecast hour, or when fewer than 7 of the 30 days before it have both forecast hours and intervals.

#### Scenario: A day with its forecast
- **WHEN** `GET /api/intervals?date=2026-04-16` is requested
- **THEN** the response lists April 16's 24 forecast hours, its 11 AM hour expecting about 7.8 kWh, and the hours' expected kWh add up to about 64

#### Scenario: The first week of service
- **WHEN** `GET /api/intervals?date=2021-10-12` is requested
- **THEN** the response holds no expected hours, as only 2 days before it have intervals
