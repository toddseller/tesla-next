# Spec Delta

## ADDED Requirements

### Requirement: The sky now
Today's sky now SHALL use the sky's groups with "now" after them, and Fog for 45 and 48. Between sunset and sunrise it SHALL read Clear for 0 and Partly cloudy for 1 and 2, with moon icons.

#### Scenario: Fog now
- **WHEN** the latest reading, in daylight, is code 45
- **THEN** today's tile reads Fog now

#### Scenario: A clear night
- **WHEN** the latest reading is code 0 at 9 PM
- **THEN** today's tile reads Clear now with the moon icon

## MODIFIED Requirements

### Requirement: Today's tile
Today's tile SHALL show today's expected kWh, today's solar so far in kWh to one decimal, a bar of the so-far against the expected (full at or past it), and today's sky, with today marked apart from the other days. Today's sky SHALL be the sky now when the latest stored weather reading is less than 3 hours old, and the forecast's otherwise. Without an expected kWh it SHALL show the kWh so far alone.

#### Scenario: Mid-morning
- **WHEN** today's expected kWh is 31 and 9.6 kWh has been made so far
- **THEN** today's tile reads 31 kWh expected and 9.6 kWh so far, with its bar about a third full

#### Scenario: A better day than forecast
- **WHEN** 34.2 kWh has been made against 31 expected
- **THEN** the bar is full and the tile reads 34.2 kWh so far

#### Scenario: Clear skies under a foggy forecast
- **WHEN** today's forecast code is 45 and the latest weather reading, 10 minutes old, is code 0 in daylight
- **THEN** today's tile reads Sunny now with the sun icon

#### Scenario: No recent reading
- **WHEN** the latest weather reading is 4 hours old
- **THEN** today's tile shows the forecast's sky, without "now"

### Requirement: The sky
A forecast day's sky SHALL follow its daylight weather code, the most severe weather between sunrise and sunset, or its daily code when it has none: 0 Sunny, 1 and 2 Partly cloudy, 3 Cloudy, 45 and 48 Fog likely, 51 to 67 and 80 to 82 Rain, 71 to 77, 85 and 86 Snow, 95 to 99 Thunderstorms, each with its own icon. A code outside these SHALL show Cloudy.

#### Scenario: Morning fog
- **WHEN** Thursday's daylight weather code is 45
- **THEN** Thursday reads Fog likely with the fog icon

#### Scenario: Fog only overnight
- **WHEN** Friday's daily code is 45 and its daylight code is 1
- **THEN** Friday reads Partly cloudy

#### Scenario: A day stored before the daylight code
- **WHEN** a day has a daily code of 3 and no daylight code
- **THEN** it reads Cloudy
