# top-ten Specification

## Purpose
The Top Ten page shows the site's records since October 2021: the days with the most solar generated, and the days and months with the most energy sent to PG&E, each led by its record and laid out on a timeline.

## Requirements

### Requirement: Top solar days
The page SHALL rank the ten days with the most solar generated, each with its date and its solar energy in kWh. Days without a solar figure SHALL NOT be ranked.

#### Scenario: The best solar day
- **WHEN** June 13, 2022 generated 80.9 kWh, more than any other day
- **THEN** it is #1 of the solar days

### Requirement: Top export days
The page SHALL rank the ten days with the most energy sent to PG&E net of imports: the day's exports less its imports, using PG&E's readings for days before April 27, 2026 that have them and Tesla's figures otherwise. On a VPP day the Powerwall's exports SHALL NOT count, as on anton's page. Each day SHALL read as kWh exported, without a minus sign.

#### Scenario: The best export day
- **WHEN** May 30, 2024 exported 60.0 kWh more than it imported, more than any other day
- **THEN** it is #1 of the export days and reads 60.0 kWh

#### Scenario: A day before the meter fix
- **WHEN** Tesla recorded 10 kWh exported on a day in April 2026 and PG&E recorded 40 kWh exported and 2 kWh imported
- **THEN** the day ranks by PG&E's net of 38.0 kWh exported

### Requirement: Top export months
The page SHALL rank the ten calendar months with the most energy sent to PG&E net of imports, each month's net being the sum over its days, with the same readings as the export days.

#### Scenario: The best export month
- **WHEN** May 2024 sent 510.1 kWh to PG&E net of imports, more than any other month
- **THEN** it is #1 of the export months

### Requirement: Equal figures rank the newer date first
Within each ranking, entries whose figures read the same to a tenth of a kWh SHALL be ordered newest first. When entries tie for 10th place, the newest SHALL be ranked.

#### Scenario: Two solar days at 78.6
- **WHEN** May 20, 2022 and June 16, 2024 both read 78.6 kWh, 8th and 9th
- **THEN** June 16, 2024 is 8th and May 20, 2022 is 9th

#### Scenario: A tie for 10th place
- **WHEN** the 10th and 11th export days both read 42.1 kWh, the 11th being newer
- **THEN** the newer day is ranked 10th and the older one is not shown

### Requirement: Fewer than ten
A ranking with fewer than ten entries SHALL show those it has, and a ranking with none SHALL say there is nothing to rank yet.

#### Scenario: An empty database
- **WHEN** no day has been saved
- **THEN** each ranking says there is nothing to rank yet

### Requirement: The record
Each ranking SHALL lead with its #1: its figure in kWh, its date in full (the weekday and date for a day, the month and year for a month), how long it has been the record, and how far it is ahead of #2. How long SHALL count from the day, or from the last day of the month, to today in the site's time zone, in years and months.

#### Scenario: The solar record on 2026-11-08
- **WHEN** the solar ranking is shown on 2026-11-08, led by 80.9 kWh on June 13, 2022 with 80.2 kWh second
- **THEN** it reads 80.9 kWh, Monday, June 13, 2022, the record for 4 years, 4 months, and 0.7 kWh ahead of #2

#### Scenario: The export month record
- **WHEN** the export months are shown on 2026-11-08, led by 510.1 kWh in May 2024 with 479.2 kWh second
- **THEN** it reads 510.1 kWh, May 2024, the record for 2 years, 5 months, and 30.9 kWh ahead of #2

### Requirement: The timeline
Each ranking SHALL show its ten entries as dots on a timeline from October 2021 to the end of the current year, with the years marked, the current year shaded, and a figure axis spanning the ten entries' figures rather than starting at zero. The #1 dot SHALL be ringed in Tesla red, and the #2 and #3 dots SHALL carry their rank. Solar days SHALL be drawn in the solar color and exports in the grid color. The timeline SHALL be described in words for assistive technology.

#### Scenario: Solar days
- **WHEN** the solar ranking is shown
- **THEN** its axis spans about 78 to 81 kWh, and the 2022 dots cluster in late May and June

### Requirement: The runners-up
Under each timeline, #2 to #10 SHALL be listed with their rank, figure and date, and entries from the current calendar year in the site's time zone SHALL be marked as this year's.

#### Scenario: This year's entries
- **WHEN** the export days are shown on 2026-11-08 and three of them are from 2026
- **THEN** those three are marked as this year's

### Requirement: Dates open the Solar page
Every date on the page SHALL link to the Solar page: a day to its month with that day open (`/?start=<first of month>&end=<last of month>&day=<day>`), a month to that month (`/?start=<first>&end=<last>`).

#### Scenario: A solar day
- **WHEN** a visitor picks June 13, 2022
- **THEN** the Solar page opens at `/?start=2022-06-01&end=2022-06-30&day=2022-06-13`

#### Scenario: An export month
- **WHEN** a visitor picks May 2024
- **THEN** the Solar page opens at `/?start=2024-05-01&end=2024-05-31`

### Requirement: Rendered with its data
The page (`/top`) SHALL be rendered on the server with its rankings, so the first response holds every figure.

#### Scenario: Opening the page
- **WHEN** a visitor opens `/top`
- **THEN** the first response holds the three records and their runners-up

### Requirement: Layout
On a 375-pixel-wide screen each ranking SHALL show its record above its timeline, with the runners-up wrapping, in one column with no horizontal scrolling; on wider screens the record SHALL sit beside its timeline.

#### Scenario: Phone
- **WHEN** a viewer opens `/top` on a 375-pixel-wide screen
- **THEN** every record, timeline and runner-up is visible without scrolling sideways

### Requirement: The rankings stay current
Every `totals` event SHALL reload the rankings without reloading the page, and so SHALL the stream opening again after it was lost. A failed reload SHALL keep the shown rankings.

#### Scenario: A new record
- **WHEN** today's totals make it the best export day and a `totals` event arrives
- **THEN** the export record shows today without a page reload

#### Scenario: A failed reload
- **WHEN** a reload fails
- **THEN** the rankings shown stay as they were

### Requirement: Data matches Flask's
`GET /api/top-ten` SHALL answer with status 200 and data equal to Flask's `/api/v2/top_ten`, a list of `solar`, `net_grid` and `to_grid_months` rankings with Flask's date labels and figures (exports as negative net figures), until change 7 (cutover) retires it. The rows SHALL differ only in the order of rows whose figures read the same to a tenth, in which row is 10th when it ties with the 11th, and in each row also giving its ISO date (`day`, or `month` as `YYYY-MM`).

#### Scenario: Compared with Flask
- **WHEN** a script requests `/api/top-ten` and Flask's `/api/v2/top_ten`
- **THEN** each ranking has the same rows with the same figures, in the same order apart from rows with equal figures

#### Scenario: An empty database
- **WHEN** `/api/top-ten` is requested before any day is saved
- **THEN** the answer is status 200 with three empty rankings
