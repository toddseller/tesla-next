## ADDED Requirements

### Requirement: Snow on a mild day
A forecast day's snow code SHALL read Rain, with the rain icon, when the day's forecast low is above freezing (0 °C). A day at or below freezing, or without a stored low, SHALL keep Snow.

#### Scenario: Snow on a mild day
- **WHEN** tomorrow's daylight code is 73 and its low is 8.9 °C
- **THEN** tomorrow reads Rain with the rain icon

#### Scenario: Snow on today's tile without a recent reading
- **WHEN** today's daylight code is 73, its low is 8.9 °C, and the latest reading is 4 hours old
- **THEN** today's tile reads Rain, without "now"

#### Scenario: Snow on a freezing day
- **WHEN** Friday's daylight code is 73 and its low is -1.5 °C
- **THEN** Friday reads Snow

#### Scenario: Snow on a day stored before the low was kept
- **WHEN** Friday's daylight code is 73 and it has no low
- **THEN** Friday reads Snow
