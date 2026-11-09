# car-charging Specification

## Purpose
Says how much the cars were charged at home over a range and where that energy came from: solar, the Powerwalls or the grid, for the household and for each car the Wall Connector measured.

## Requirements

### Requirement: Home charging by source
For a range of days, home charging SHALL be the Wall Connector's charging in each 5 minutes of the range, measured where the Wall Connector measured it and otherwise estimated from charge sessions and short gaps as the day intervals do, each interval's charging split across solar, Powerwall and grid as "Charging is attributed to energy sources" defines. The figures SHALL be its total kWh, the kWh and whole-number percentage from each source, and the share off the grid (solar plus Powerwall).

#### Scenario: A night's charge from the Powerwall
- **WHEN** the range is one day on which 10 kWh went into the cars, 6 kWh of it while the home ran on the Powerwall and 4 kWh while it ran on the grid
- **THEN** the figures are 10 kWh, 0% solar, 60% Powerwall, 40% grid and 60% off the grid

### Requirement: Charging coverage
Home charging SHALL be counted only from the day of the first stored charge session or measured interval, whichever is earlier. A range that starts before that day SHALL be counted from it and SHALL say from when; a range that ends before it SHALL count nothing and say there is no charging data before that day.

#### Scenario: All time
- **WHEN** the range is Oct 22, 2021 to Nov 9, 2026 and the first charge session is on Oct 20, 2025
- **THEN** the figures count from Oct 20, 2025 and say "since Oct 20, 2025"

#### Scenario: A range before any charging data
- **WHEN** the range is March 2024
- **THEN** it counts 0 kWh, and the section says there is no charging data before Oct 20, 2025

### Requirement: A range with no charging
A range inside the covered period with no charging SHALL show 0 kWh and say there was no home charging, with no shares and no car lines.

#### Scenario: An idle day
- **WHEN** the range is Nov 9, 2026 and no car charged at home that day
- **THEN** the section says "No home charging on Nov 9, 2026" and its ring is empty

### Requirement: Charging by car
Each car SHALL get a line with its kWh and its solar, Powerwall and grid percentages, counting only the intervals where the Wall Connector measured that car charging, or a gap between two measurements of the same car. Lines SHALL be named as "History names the plugged-in car" defines, never by VIN, and SHALL say from when cars were measured when the range starts before the first measured interval. Charging no car is named for SHALL count toward the household figures only.

#### Scenario: Two cars this month
- **WHEN** the range is Nov 1 to Nov 9, 2026, with R2D2 and Tesla T.I.E. Fighter measured charging
- **THEN** a line for each gives its kWh and its three shares, and no VIN appears

#### Scenario: Before cars were measured
- **WHEN** the range is All time and the first measured interval is on Oct 17, 2026
- **THEN** the car lines say "measured from Oct 17, 2026", and charging from the earlier sessions counts toward the household figures only

#### Scenario: A car that has been away
- **WHEN** Tesla T.I.E. Fighter did not charge at home in the range
- **THEN** it has no line

### Requirement: The Home car charging section
The Impact page SHALL show a Home car charging section after the section on where the home's energy came from and before Backup, for the range shown, with a ring of the solar, Powerwall and grid shares and the share off the grid in its middle, the kWh into the cars, the source legend and the car lines, in the flow colors. On a 375-pixel-wide screen it SHALL fit in one column with no horizontal scrolling.

#### Scenario: On a phone
- **WHEN** the page is 375 pixels wide
- **THEN** the ring, legend and car lines stack in one column with no horizontal scrolling

### Requirement: The section stays current
The Home car charging section SHALL reload with the page's other figures when they reload, keeping what it shows when a reload fails.

#### Scenario: A totals event
- **WHEN** the page shows this month and a `totals` event arrives for today
- **THEN** the section's figures update in place, with no page reload

### Requirement: Car charging data
`GET /api/car-charging?start_date=&end_date=` SHALL answer with status 200 and `{"data": {...}}` holding the range's home charging figures, the day they count from, the car lines and the day cars were first measured, or `{"data": null}` when the database holds no charging at all, for the same ranges `/api/impact` accepts; other requests SHALL get status 400 and a message.

#### Scenario: A valid range
- **WHEN** a client requests `/api/car-charging?start_date=2026-11-01&end_date=2026-11-09`
- **THEN** the answer is status 200 with that range's figures and car lines, and no VIN
