## MODIFIED Requirements

### Requirement: The sky
A forecast day's sky SHALL follow its daylight weather code, the most severe weather between sunrise and sunset, or its daily code when it has none: 0 Sunny, 1 and 2 Partly cloudy, 3 Cloudy, 45 and 48 Fog likely, 51 to 67 and 80 to 82 Rain, 71 to 77, 85 and 86 Snow, 95 to 99 Thunderstorms, each with its own icon. A code outside these SHALL show Cloudy. A snow code SHALL read Rain, with the rain icon, on a day whose forecast low is above freezing (0 °C); a day without a stored low SHALL keep Snow.

#### Scenario: Morning fog
- **WHEN** Thursday's daylight weather code is 45
- **THEN** Thursday reads Fog likely with the fog icon

#### Scenario: Fog only overnight
- **WHEN** Friday's daily code is 45 and its daylight code is 1
- **THEN** Friday reads Partly cloudy

#### Scenario: A day stored before the daylight code
- **WHEN** a day has a daily code of 3 and no daylight code
- **THEN** it reads Cloudy

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
