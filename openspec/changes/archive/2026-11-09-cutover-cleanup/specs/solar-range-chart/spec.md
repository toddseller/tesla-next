# Spec Delta

## ADDED Requirements

### Requirement: Range data
`GET /api/range?start_date=&end_date=` SHALL answer with status 200 and `{"data": [...]}`, one item per bar as "Daily and monthly bars" and "Bar values" define them, each with its label (`date`), its first day (`day`), `solar`, `grid` and `house`, for every range from 2021-10-01 to 732 days after today. Other requests SHALL get status 400 and a message.

#### Scenario: A valid range
- **WHEN** a client requests `/api/range?start_date=2026-10-01&end_date=2026-10-31`
- **THEN** the answer is status 200 with one item per day of October 2026 that has saved totals

#### Scenario: A malformed date
- **WHEN** a client requests `/api/range?start_date=nope&end_date=2026-01-31`
- **THEN** the response is 400 with a message, and no data is queried

#### Scenario: A range before the site existed
- **WHEN** a client requests `/api/range?start_date=1900-01-01&end_date=2026-10-31`
- **THEN** the response is 400 and its message names 2021-10-01

## MODIFIED Requirements

### Requirement: Daily and monthly bars
When the range's end is at most 31 days after its start, the chart SHALL show one bar per day with saved totals, labeled like "Oct 14". Longer ranges SHALL show one bar per period, labeled with the period's first month and year, like "Oct 2025": calendar months when the range ends on or after the 28th of a month or the period starts on the 1st, otherwise month-long periods from a day to the day before the same date next month; the last period ends with the range.

#### Scenario: A month
- **WHEN** the page shows October 2026, whose 31 days all have totals
- **THEN** the chart has 31 bars, Oct 1 to Oct 31

#### Scenario: A day without totals
- **WHEN** the range is 2021-10-01 to 2021-10-31, and the first saved day is October 10
- **THEN** the first bar is Oct 10

#### Scenario: Calendar months
- **WHEN** the range is 2026-01-15 to 2026-06-30
- **THEN** the chart has six bars, for January 15 to 31 and then February through June

#### Scenario: Month-long periods
- **WHEN** the range is 2026-01-15 to 2026-06-14
- **THEN** the chart has five bars, January 15 to February 14 through May 15 to June 14

### Requirement: Bar values
Each bar SHALL show its period's solar generated, grid (imported minus exported, below zero when more was exported) and house use, in kWh to one decimal place, from the `data` table, with PG&E's meter readings standing in for Tesla's grid figures, and the house use corrected by the difference, on days before 2026-04-27 that have them. The bar SHALL stack solar, positive grid and house from zero upward, with negative grid below zero.

#### Scenario: A day that exported more than it imported
- **WHEN** October 14, 2026 generated 44.4 kWh, used 34.0 kWh in the house, and exported 8.3 kWh more than it imported
- **THEN** its bar stacks 44.4 kWh of solar and 34.0 kWh of house above zero, and 8.3 kWh of grid below

#### Scenario: Meter-corrected days
- **WHEN** the range is 2025-12-10, whose Tesla figures are 20 kWh in and 4 kWh out, and PG&E's meter read 40 kWh in and 8 kWh out
- **THEN** the bar's grid is 32.0 kWh

## REMOVED Requirements

### Requirement: Range data matches Flask's
**Reason**: anton-tesla-api-ws retired its `/api/v2` routes on November 9, 2026, so there is nothing left to compare with.
**Migration**: "Range data" describes the route.
