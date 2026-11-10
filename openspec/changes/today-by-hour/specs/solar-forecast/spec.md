# Spec Delta

## ADDED Requirements

### Requirement: Today by hour
Under the day tiles the card SHALL show "Today by hour", full width: one column per hour of today, site time, from the first to the last hour with forecast sunlight or at least 0.05 kWh made. Each column SHALL show a faded bar up to the hour's expected kWh and, in front of it, a solid bar of the kWh made in it so far, with a tick at the expected kWh where the made kWh is higher. A kWh axis and hour labels SHALL frame the columns, with a legend.

#### Scenario: A foggy morning
- **WHEN** 9 to 10 AM made 2.5 kWh against 4.3 expected
- **THEN** its solid bar reaches 2.5 kWh in front of a faded bar reaching 4.3, with no tick

#### Scenario: Beating the forecast
- **WHEN** 11 AM to noon made 5.9 kWh against 5.3 expected
- **THEN** its solid bar reaches 5.9 kWh with a tick at 5.3

#### Scenario: The hours ahead
- **WHEN** it is 1:40 PM and 2 to 3 PM expects 3.1 kWh
- **THEN** 2 PM shows only a faded bar reaching 3.1, and 1 PM a solid bar of its kWh so far in front of its faded bar

#### Scenario: On a phone
- **WHEN** the Solar page is 375 pixels wide
- **THEN** the panel shows every hour's column with no horizontal scrolling

### Requirement: An hour's expected kWh
An hour's expected kWh SHALL be its forecast sunlight times its hour of the day's scale: the kWh that hour of the day made over the 30 days before today, divided by its forecast sunlight over the same days, counting only hours with both. An hour of the day with no forecast sunlight in those days SHALL expect 0 kWh.

#### Scenario: Scaling 10 AM
- **WHEN** the 10 to 11 AM hours of the last 30 days made 128 kWh under 15,300 W/m² of forecast sunlight, and today's 10 AM forecasts 532 W/m²
- **THEN** 10 AM today expects about 4.5 kWh

### Requirement: Made against expected by now
Once today's first shown hour has started, the panel SHALL say how much today has made by the end of the latest stored interval and how much was expected by then: the expected kWh of every hour already over, plus the share of the current hour gone by. After the last shown hour, once the sun has set, it SHALL compare the day's made and expected kWh instead.

#### Scenario: Early afternoon
- **WHEN** the latest interval ends at 1:40 PM, 23.9 kWh has been made, the hours to 1 PM expected 23.8 kWh and 1 to 2 PM expects 4.1
- **THEN** the panel reads 23.9 kWh made by 1:40 PM, against 26.5 expected by now

#### Scenario: Before sunrise
- **WHEN** it is 6:15 AM and the first shown hour starts at 7
- **THEN** the panel shows the faded bars and no made-against-expected line

#### Scenario: Sun still up after the last forecast hour
- **WHEN** the last hour with forecast sunlight is 3 PM and the latest interval ends at 4:05 PM, before sunset
- **THEN** the panel still reads made by 4:05 PM, against expected by now

### Requirement: An hour's numbers
Pointing at an hour's column, or touching it, SHALL show the hour, like "9–10 AM", with its expected kWh, and its made kWh once the hour has started, each to one decimal.

#### Scenario: Touching 9 AM
- **WHEN** a viewer touches the 9 AM column after 10 AM
- **THEN** it shows 9–10 AM, made 2.5 kWh and expected 4.3 kWh

### Requirement: Without an hourly forecast
The card SHALL leave out Today by hour when no hour of today has a stored forecast, or when fewer than 7 of the 30 days before today have both forecast hours and intervals; the rest of the card SHALL show as before.

#### Scenario: A new install
- **WHEN** the forecast hours go back only 5 days
- **THEN** the card shows its tiles without Today by hour
