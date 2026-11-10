## ADDED Requirements

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
