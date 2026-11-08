# true-up-cycles Specification

## Purpose
Divides the site's grid energy into PG&E's billing cycles and true-up years, from the meter read dates anton-tesla-api-ws stores, as PG&E's bills count them.

## Requirements

### Requirement: Read dates
A year's 12 meter read dates SHALL be the stored ones when all 12 are stored, and otherwise estimated: each month's 6th, moved to the Friday before when it falls on a Saturday and to the Monday after when it falls on a Sunday. Only anton-tesla-api-ws stores read dates.

#### Scenario: Year before the published schedules
- **WHEN** billing cycles are needed for March 2022, which has no stored read dates
- **THEN** the March 2022 read is estimated as Monday, March 7, 2022 (the 6th is a Sunday)

#### Scenario: A published year
- **WHEN** all 12 of 2026's read dates are stored, among them September 3 and October 5
- **THEN** those dates are used

#### Scenario: A year partly stored
- **WHEN** only 11 of a year's read dates are stored
- **THEN** all 12 of its reads are estimated

### Requirement: Billing cycles start on the read date
Each billing cycle SHALL start on a read date and end the day before the next read date, as PG&E's bills count its billing days: the read day's energy belongs to the cycle that starts on it. A billing cycle SHALL belong to a date range when its first day falls inside the range.

#### Scenario: The October 2026 read
- **WHEN** the September and October 2026 reads are September 3 and October 5
- **THEN** the billing cycle before the October read runs from September 3 to October 4, 2026, 32 days, as on PG&E's bill, and the next starts October 5

#### Scenario: Cycles of a true-up year
- **WHEN** the cycles are requested for 2025-10-01 to 2026-09-30
- **THEN** they are the 12 billing cycles from October 3, 2025 to October 4, 2026, the first running October 3 to November 3, 2025 and the last September 3 to October 4, 2026

### Requirement: True-up years
The true-up years SHALL run from 2021-22 through the one containing today in the site's time zone, each with a label like "'25 - '26", a range from October 1 to September 30, and the date of its October read (the day after its last billing cycle ends). The one containing today SHALL be the first whose October read is after today, and SHALL be marked current.

#### Scenario: After the October read
- **WHEN** the years are listed on October 10, 2026, after the October 5 read
- **THEN** the current true-up year is 2026-10-01 to 2027-09-30

#### Scenario: On the October read
- **WHEN** the years are listed on October 5, 2026
- **THEN** the current true-up year is 2026-10-01 to 2027-09-30, since the read day starts its first cycle

#### Scenario: The day before the October read
- **WHEN** the years are listed on October 4, 2026
- **THEN** the current true-up year is 2025-10-01 to 2026-09-30, with an October read of October 5, 2026

### Requirement: A cycle's grid energy
Each billing cycle SHALL give its first and last day, its true-up year, and the grid energy imported, exported and net over its days in kWh to one decimal, the net split into peak (intervals starting 4 p.m. to 8:55 p.m. site time) and off-peak. Exported SHALL include the Powerwall's exports on VPP days. A cycle with no data SHALL have null totals.

#### Scenario: A cycle's grid energy
- **WHEN** every 5-minute interval from November 4 to December 4, 2026 imports 10 Wh and exports 4 Wh
- **THEN** the cycle from November 4 to December 4 has 89.3 kWh imported, 35.7 kWh exported and 53.6 kWh net, of which 11.2 kWh is peak and 42.4 kWh off-peak

#### Scenario: VPP exports count
- **WHEN** a VPP day exports 20 kWh from solar and 10 kWh from the Powerwall
- **THEN** that day adds 30 kWh to its cycle's exported total

#### Scenario: True-up year of a cycle
- **WHEN** the cycles are requested for 2024-10-01 to 2026-09-30
- **THEN** the cycles starting before the October 2025 read belong to '24 - '25 and the rest to '25 - '26

### Requirement: PG&E's readings before the meter fix
Days before April 27, 2026 with PG&E data SHALL use PG&E's readings, totals and peak alike, and the other days the 5-minute intervals. Each cycle SHALL give its last day with data and the number of its days so far before April 27, 2026 without PG&E data.

#### Scenario: A corrected cycle
- **WHEN** every day of the cycle December 5, 2025 to January 5, 2026 has PG&E data
- **THEN** its imported, exported, peak and off-peak figures are PG&E's, and it has 0 uncorrected days

#### Scenario: Partly corrected
- **WHEN** the cycle December 5, 2025 to January 5, 2026 has Tesla intervals for every day and PG&E data only from December 5 to December 19
- **THEN** it uses PG&E's readings for December 5 to 19 and Tesla's for the rest, and has 17 uncorrected days

#### Scenario: The open cycle
- **WHEN** the cycles are requested on October 21, 2026, in the cycle that started October 5
- **THEN** that cycle's last day with data is October 21, and the cycles after it have null totals

### Requirement: Cycle data matches Flask's
`GET /api/true-up-years` SHALL answer as Flask's `/api/v2/true_up_years`, and `GET /api/cycles?start_date=&end_date=` with status 200 and rows equal to Flask's `/api/v2/sheet` for every range from 2021-10-01 to 732 days after today, NEM charges included (see true-up-cost), until change 7 (cutover) retires them. Other requests SHALL get status 400 and a message.

#### Scenario: Any true-up year
- **WHEN** a script requests a true-up year from `/api/cycles` and from Flask's `/api/v2/sheet`
- **THEN** every row is equal, field by field

#### Scenario: A malformed date
- **WHEN** a client requests `/api/cycles?start_date=nope&end_date=2026-09-30`
- **THEN** the answer is status 400 with a message
