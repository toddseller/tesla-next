# system-checks Specification

## Purpose
Notices, without anyone looking, when Tesla's grid figures stop matching PG&E's meter, when PG&E's readings stop arriving, or when solar output falls below its own history, within a week, and when a bright day's solar peak falls well short of the usual, such as a failing microinverter, by the next morning; and alerts the owner.

## Requirements

### Requirement: Tesla's grid figures against PG&E's meter
Over the newest 7 days that PG&E's meter readings cover, Tesla's grid imports SHALL be compared with PG&E's imports, and Tesla's exports, from solar and from the Powerwalls, with PG&E's exports. A direction SHALL fail when Tesla's total is more than 10% above or below PG&E's, and SHALL NOT be judged when PG&E's total for it is under 10 kWh.

#### Scenario: A healthy week
- **WHEN** PG&E's meter shows 120 kWh imported and 60 kWh exported over its newest 7 days, and Tesla shows 119 kWh imported and 45 kWh exported from solar plus 14 kWh from the Powerwalls
- **THEN** the check passes

#### Scenario: The metering fault
- **WHEN** PG&E's meter shows 120 kWh imported and Tesla shows 58 kWh
- **THEN** the check fails, saying Tesla's imports are 48% of PG&E's meter

#### Scenario: A summer week with almost no imports
- **WHEN** PG&E's meter shows 4 kWh imported over the 7 days
- **THEN** imports aren't judged that week and exports still are

### Requirement: PG&E's readings are current
The check SHALL fail when PG&E's newest meter reading is more than 5 days before today, naming that day.

#### Scenario: Opower stopped
- **WHEN** today is 2026-11-20 and PG&E's newest reading is for 2026-11-12
- **THEN** the check fails, saying PG&E's readings stop at November 12

### Requirement: Solar output against past years
The third-best day of solar generated in the 30 days to yesterday SHALL be compared with the third-best day of the same 30 days in each past year from 2022 that has at least 25 of them. The check SHALL fail when it is lower than every past year's by more than 5% of the lowest.

#### Scenario: The April microinverter fault
- **WHEN** April's third-best days were 69.5, 69.4 and 69.2 kWh in 2022 to 2024, and this year's is 64.0 kWh
- **THEN** the check fails, saying this April's third-best day is 92% of the lowest past year's

#### Scenario: A foggy month
- **WHEN** past years' third-best days for the window are 64.2, 72.4 and 76.4 kWh and this year's is 63.0 kWh
- **THEN** the check passes

### Requirement: Check results
`GET /api/checks` SHALL answer with status 200 and plain text, one line per check, each starting `ok` or `FAIL`, saying what was compared and how it came out, with no costs and no account details.

#### Scenario: One check failing
- **WHEN** the meter check fails and the others pass
- **THEN** the answer has one `FAIL` line naming the meter check and `ok` lines for the others

### Requirement: Weekly alert
The weekly run on the server SHALL ask the running site for its check results and send a push notification with the failing lines when any check fails, or when the results can't be had. A week where every check passes SHALL send nothing.

#### Scenario: A failing week
- **WHEN** the weekly run finds the meter check failing
- **THEN** the owner receives a notification with that check's line

#### Scenario: The site down
- **WHEN** the weekly run can't reach the running site
- **THEN** the owner receives a notification saying the checks couldn't run

### Requirement: A date's clear-day forecast
A date's clear-day forecast SHALL be the 90th percentile of the stored sunlight forecasts of every day, in any year, within 15 days of that date in the calendar, counting across the turn of the year. A day SHALL be bright when its stored forecast is at least 60% of its date's clear-day forecast.

#### Scenario: A December day
- **WHEN** the stored forecasts within 15 days of December 15 in any year have a 90th percentile of 10.6 MJ/m², and December 15 had 9.8 MJ/m² forecast
- **THEN** December 15 is a bright day, at 92% of a clear day

#### Scenario: Across the new year
- **WHEN** the date is December 28
- **THEN** the forecasts from December 13 to January 12 of every year count toward its clear-day forecast

### Requirement: Solar peak on a bright day
Yesterday, site time, SHALL be judged when it is a bright day. Its peak SHALL be its highest 5-minute solar output as an average in watts, and the check SHALL fail when that peak is under 60% of the middle peak, the lower of the two middle ones when there is an even number, of the bright days with intervals stored among the 30 days before it, or when that middle peak is 0.

#### Scenario: The microinverter fault's first bright day
- **WHEN** April 13, 2026 was a bright day with a peak of 4,416 W, and the bright days from March 14 to April 12 have a middle peak of 8,448 W
- **THEN** the check fails, saying April 13's peak was 52% of the usual bright-day peak (4.4 of 8.4 kW)

#### Scenario: A foggy summer morning
- **WHEN** a bright day made less than usual but peaked at 10,440 W against a middle peak of 10,080 W
- **THEN** the check passes

#### Scenario: A long total outage
- **WHEN** the bright days among the 30 before yesterday all peaked at 0 W
- **THEN** the check fails, saying no bright day in those 30 made any solar

#### Scenario: A failing microinverter in December
- **WHEN** December 15 was a bright day at 9.8 MJ/m² with a peak of 3,000 W, against a middle peak of 6,000 W
- **THEN** the check fails, saying December 15's peak was 50% of the usual bright-day peak

### Requirement: Days the peak check leaves alone
The solar peak check SHALL pass without judging, saying why, when yesterday has no stored forecast, when it is not a bright day, or when fewer than 5 of the 30 days before it are bright days with intervals stored. It SHALL fail when yesterday has no 5-minute interval stored.

#### Scenario: A dull day
- **WHEN** yesterday's forecast was 10.3 MJ/m² and its date's clear-day forecast 25.0 MJ/m²
- **THEN** the check passes, saying the day was too dull to judge, at 41% of a clear day

#### Scenario: No intervals for yesterday
- **WHEN** no 5-minute interval is stored for yesterday
- **THEN** the check fails, saying no solar was stored for that day

### Requirement: Daily check results
`GET /api/checks/daily` SHALL answer with status 200 and plain text holding the solar peak check's line, starting `ok` or `FAIL` and saying what was compared and how it came out, as the weekly results do.

#### Scenario: A fault day
- **WHEN** yesterday's peak is under 60% of the usual bright-day peak
- **THEN** the answer is one `FAIL` line naming the solar peak check

### Requirement: Daily alert
A daily run on the server, every morning after the previous day is finished, SHALL ask the running site for its daily check results and send a push notification with the failing line when the check fails, or when the results can't be had. A day where the check passes SHALL send nothing.

#### Scenario: A failing day
- **WHEN** the daily run finds the solar peak check failing
- **THEN** the owner receives a notification with that check's line

#### Scenario: The site down
- **WHEN** the daily run can't reach the running site
- **THEN** the owner receives a notification saying the daily checks couldn't run
