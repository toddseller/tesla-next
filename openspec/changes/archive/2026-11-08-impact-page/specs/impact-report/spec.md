# Spec Delta

## Purpose

Shows how much of the home's energy over a chosen date range came from solar and the Powerwall rather than the grid, and how solar generation compares with home use, with the range in the page's address.

## ADDED Requirements

### Requirement: The range is in the address
The Impact page (`/impact`) SHALL show the range given by its `start` and `end` parameters, each a `YYYY-MM-DD` date in the site's time zone, rendered on the server with its data. Each tab SHALL keep its own range, and opening the same address SHALL show the same range.

#### Scenario: A shared link
- **WHEN** a visitor opens `/impact?start=2026-10-18&end=2026-10-18`
- **THEN** the page shows October 18, 2026, with its figures in the first response

### Requirement: Default and invalid ranges
When `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL show today in the site's time zone.

#### Scenario: No range
- **WHEN** a visitor opens `/impact` on 2026-11-08
- **THEN** the page shows November 8, 2026

#### Scenario: A malformed range
- **WHEN** a visitor opens `/impact?start=nope&end=2026-10-31` on 2026-11-08
- **THEN** the page shows November 8, 2026, with no error

#### Scenario: Late in the evening
- **WHEN** a visitor in New York opens `/impact` at 1:00 AM on 2026-11-09 there, which is still November 8 at the site
- **THEN** the page shows November 8, 2026

### Requirement: Range presets
The page SHALL offer five presets, each changing the address to its range, all from today in the site's time zone: Today, This week (Sunday to Saturday), This month, This year (January 1 to December 31) and True-up year (October 1 to September 30 of the true-up year containing today). A preset matching the shown range SHALL be marked as selected.

#### Scenario: This week
- **WHEN** a visitor picks This week on Sunday 2026-11-08
- **THEN** the page shows 2026-11-08 to 2026-11-14, and This week is marked as selected

#### Scenario: This week on a Wednesday
- **WHEN** a visitor picks This week on 2026-11-11
- **THEN** the page shows 2026-11-08 to 2026-11-14

#### Scenario: True-up year in November
- **WHEN** a visitor picks True-up year on 2026-11-08
- **THEN** the page shows 2026-10-01 to 2027-09-30

#### Scenario: Today is the default
- **WHEN** a visitor opens `/impact` with no range
- **THEN** Today is marked as selected

### Requirement: Custom range picker
The page SHALL offer the same date-range picker as the Solar page, showing the current range, from which a visitor picks a start and an end day. It SHALL offer no day before 2021-10-10, the site's first day of service, and none more than two years after the visitor's today.

#### Scenario: Picking a range
- **WHEN** a visitor picks October 10 and October 20, 2026
- **THEN** the address becomes `/impact?start=2026-10-10&end=2026-10-20` and the page shows that range

### Requirement: Impact figures
For its range, the page SHALL take from the `data` table, with the meter corrections Flask applies to days before 2026-04-27: solar generated, home use, and home use from solar, the Powerwall and the grid, each a sum rounded to one decimal place. Each share SHALL be its part of home use as a whole percentage, rounded as Python's `round` does; self-powered SHALL be the solar share plus the Powerwall share, and energy offset solar generated as a share of home use.

#### Scenario: A meter-corrected day
- **WHEN** the range is 2025-12-10, whose Tesla figures are 20 kWh in, 4 kWh out and 30 kWh of house use, and PG&E's meter read 40 kWh in and 8 kWh out
- **THEN** home use is 46.0 kWh, 30.0 from the grid, 11.0 from solar and 5.0 from the Powerwall, and the shares are 65% grid, 24% solar and 11% Powerwall

#### Scenario: A range with no saved days
- **WHEN** the range is today just after midnight, before any totals are saved
- **THEN** every figure and share is 0

### Requirement: Self Powered section
The page SHALL show a Self Powered section: its title, the line "Home use met by solar and Powerwall", a ring of the solar, Powerwall and grid shares with the self-powered percentage in its middle, and a legend listing each share with its percentage.

#### Scenario: A day's impact
- **WHEN** the range is 2026-10-18, with 48% solar, 52% Powerwall and 0% grid
- **THEN** the ring shows 100% in its middle, and the legend lists 48% Solar, 52% Powerwall and 0% Grid

### Requirement: Solar Offset section
The page SHALL show a Solar Offset section: its title, the line "Solar generated against home use", the energy offset percentage, and two bars on one scale, Solar and Home, each labeled with its energy to one decimal place, in kWh below 1,000 kWh and in MWh from 1,000 kWh.

#### Scenario: A day's offset
- **WHEN** the range is 2026-10-18, with 23.8 kWh of solar and 30.8 kWh of home use
- **THEN** the section shows 77% energy offset, a Solar bar labeled 23.8 kWh and a longer Home bar labeled 30.8 kWh

#### Scenario: A year's offset
- **WHEN** the range has 12,345.6 kWh of solar and 15,200.0 kWh of home use
- **THEN** the bars are labeled 12.3 MWh and 15.2 MWh

#### Scenario: A whole number
- **WHEN** the range has 24.0 kWh of solar
- **THEN** the Solar bar is labeled 24.0 kWh

### Requirement: Flow colors
The sections SHALL draw solar, the Powerwall, the grid and home in the colors the dashboard shell sets for those flows.

#### Scenario: The ring and the bars
- **WHEN** the page shows a range
- **THEN** the ring's and legend's solar, Powerwall and grid, and the Solar and Home bars, take the shell's solar, Powerwall, grid and home colors

### Requirement: Impact page fits a phone
On a 375 pixel wide screen the page SHALL show the Self Powered section above the Solar Offset section, in one column, with no horizontal scrolling and no text or chart overlapping another.

#### Scenario: Phone portrait
- **WHEN** a viewer opens the Impact page on a 375 pixel wide screen
- **THEN** Self Powered is above Solar Offset and the page does not scroll sideways

### Requirement: Impact sections side by side on wide screens
On windows 1024 pixels wide or more, the Self Powered and Solar Offset sections SHALL sit side by side, Self Powered on the left, without overlapping.

#### Scenario: Desktop window
- **WHEN** a viewer opens the Impact page in a 1440 pixel wide window
- **THEN** Self Powered is to the left of Solar Offset and their titles do not overlap

### Requirement: The range stays current
When a `totals` event arrives on the live stream for a day inside the shown range, the page SHALL reload its figures without reloading the page. Events for days outside the range SHALL NOT reload them.

#### Scenario: Viewing today
- **WHEN** the page shows today and a `totals` event arrives for today
- **THEN** the figures update in place

#### Scenario: Viewing a past range
- **WHEN** the page shows March 2026 and a `totals` event arrives for 2026-11-08
- **THEN** the page does not reload its figures

### Requirement: Updates missed while disconnected are recovered
When the page's live stream opens again after it was lost, the page SHALL reload its figures if the shown range includes today.

#### Scenario: Laptop wakes from sleep
- **WHEN** a page showing this month was disconnected for 20 minutes and its stream opens again
- **THEN** the figures update without a page reload

### Requirement: Failed reloads keep the shown figures
When reloading the page's figures fails, the page SHALL keep showing the figures it had, with no error shown.

#### Scenario: Server error on reload
- **WHEN** the page shows today and a reload after a `totals` event fails
- **THEN** the figures stay as they were

### Requirement: Impact data matches Flask's
`GET /api/impact?start_date=&end_date=` SHALL answer with status 200 and `{"data": {...}}` holding `from_solar_percentage`, `from_powerwall_percentage`, `from_grid_percentage`, `self_powered_percentage`, `total_solar_percentage`, `total_solar`, `from_solar`, `from_powerwall`, `from_grid` and `total_house`, each equal to Flask's `/api/v2/impact` for every range from 2021-10-01 to 732 days after today, until change 7 (cutover) retires it. Other requests SHALL get status 400 and a message.

#### Scenario: Any valid range
- **WHEN** a script requests the same range from `/api/impact` and from Flask's `/api/v2/impact`
- **THEN** each of the ten figures is equal

#### Scenario: A malformed date
- **WHEN** a client requests `/api/impact?start_date=nope&end_date=2026-01-31`
- **THEN** the answer is status 400 with a message, and no figures
