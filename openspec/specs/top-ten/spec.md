# top-ten Specification

## Purpose
The Top Ten page shows the site's records since October 2021: the days with the most solar generated, the days and months with the most energy sent to PG&E, and the longest grid outages, each led by its record and laid out on a timeline.

## Requirements

### Requirement: Top solar days
The page SHALL rank the ten days with the most solar generated, each with its date and its solar energy in kWh. Days without a solar figure SHALL NOT be ranked.

#### Scenario: The best solar day
- **WHEN** June 13, 2022 generated 80.9 kWh, more than any other day
- **THEN** it is #1 of the solar days

### Requirement: Top export days
The page SHALL rank the ten days with the most energy sent to PG&E net of imports: the day's exports less its imports, using PG&E's readings for days before April 27, 2026 that have them and Tesla's figures otherwise. Without VPP events, days marked as VPP days SHALL NOT be ranked. With VPP events, they SHALL be ranked, and on a VPP day the Powerwall's exports SHALL NOT count, as on anton's page. Each day SHALL read as kWh exported, without a minus sign.

#### Scenario: The best export day
- **WHEN** May 30, 2024 exported 60.0 kWh more than it imported, more than any other day, and is not a VPP day
- **THEN** it is #1 of the export days and reads 60.0 kWh

#### Scenario: A VPP day left out
- **WHEN** May 30, 2024 exported 60.0 kWh more than it imported and is a VPP day, and May 21, 2025 exported 45.9 kWh, more than any other day
- **THEN** without VPP events May 21, 2025 is #1 of the export days, and with them May 30, 2024 is

#### Scenario: A day before the meter fix
- **WHEN** Tesla recorded 10 kWh exported on a day in April 2026 and PG&E recorded 40 kWh exported and 2 kWh imported
- **THEN** the day ranks by PG&E's net of 38.0 kWh exported

### Requirement: Top export months
The page SHALL rank the ten calendar months with the most energy sent to PG&E net of imports, each month's net being the sum over its days, with the same readings as the export days. Without VPP events, a month's net SHALL be the sum over its days not marked as VPP days, and a month whose every day is a VPP day SHALL NOT be ranked.

#### Scenario: The best export month
- **WHEN** May 2024 sent 510.1 kWh to PG&E net of imports, more than any other month, and has no VPP day
- **THEN** it is #1 of the export months

#### Scenario: A month with VPP days
- **WHEN** May 2024 sent 510.1 kWh net of imports, 60.0 kWh of it on May 30, a VPP day
- **THEN** without VPP events May 2024 ranks by 450.1 kWh, and with them by 510.1 kWh

### Requirement: Equal figures rank the newer date first
Within each ranking, entries whose figures read the same to a tenth of a kWh, or of an hour for outages, SHALL be ordered newest first. When entries tie for 10th place, the newest SHALL be ranked.

#### Scenario: Two solar days at 78.6
- **WHEN** May 20, 2022 and June 16, 2024 both read 78.6 kWh, 8th and 9th
- **THEN** June 16, 2024 is 8th and May 20, 2022 is 9th

#### Scenario: A tie for 10th place
- **WHEN** the 10th and 11th export days both read 42.1 kWh, the 11th being newer
- **THEN** the newer day is ranked 10th and the older one is not shown

#### Scenario: Two outages at 7.2 hours
- **WHEN** two outages both read 7.2 h
- **THEN** the newer one ranks first

### Requirement: Fewer than ten
A ranking with fewer than ten entries SHALL show those it has, and a ranking with none SHALL say there is nothing to rank yet.

#### Scenario: An empty database
- **WHEN** no day has been saved
- **THEN** each ranking says there is nothing to rank yet

### Requirement: The record
Each ranking SHALL lead with its #1: its figure in kWh, or in hours for outages, its date in full (the weekday and date for a day, the month and year for a month), how long it has been the record, and how far it is ahead of #2. How long SHALL count from the day, or from the last day of the month, to today in the site's time zone, in years and months.

#### Scenario: The solar record on 2026-11-08
- **WHEN** the solar ranking is shown on 2026-11-08, led by 80.9 kWh on June 13, 2022 with 80.2 kWh second
- **THEN** it reads 80.9 kWh, Monday, June 13, 2022, the record for 4 years, 4 months, and 0.7 kWh ahead of #2

#### Scenario: The export month record
- **WHEN** the export months are shown on 2026-11-08, led by 510.1 kWh in May 2024 with 479.2 kWh second
- **THEN** it reads 510.1 kWh, May 2024, the record for 2 years, 5 months, and 30.9 kWh ahead of #2

#### Scenario: The outage record
- **WHEN** the outages are shown on 2026-11-09, led by 52.3 hours from February 4, 2024 with 35.4 hours second
- **THEN** it reads 52.3 h, Sunday, February 4, 2024, the record for 2 years, 9 months, and 16.9 h ahead of #2

### Requirement: The timeline
Each ranking SHALL show its ten entries as dots on a timeline from October 2021 to the end of the current year, with the years marked, the current year shaded, and a figure axis spanning the ten entries' figures rather than starting at zero. The #1 dot SHALL be ringed in Tesla red, and the #2 and #3 dots SHALL carry their rank. Solar days SHALL be drawn in the solar color, exports in the grid color and outages in the Powerwall color. The timeline SHALL be described in words for assistive technology.

#### Scenario: Solar days
- **WHEN** the solar ranking is shown
- **THEN** its axis spans about 78 to 81 kWh, and the 2022 dots cluster in late May and June

#### Scenario: Outages
- **WHEN** the outage ranking is shown
- **THEN** its axis is in hours and its dots are in the Powerwall color

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
- **THEN** the first response holds the four records and their runners-up

### Requirement: Layout
On a 375-pixel-wide screen each ranking SHALL show its record above its timeline, with the runners-up wrapping, in one column with no horizontal scrolling; on wider screens the record SHALL sit beside its timeline.

#### Scenario: Phone
- **WHEN** a viewer opens `/top` on a 375-pixel-wide screen
- **THEN** every record, timeline and runner-up is visible without scrolling sideways

### Requirement: The rankings stay current
Every `totals` or `outages` event SHALL reload the rankings without reloading the page, and so SHALL the stream opening again after it was lost. A failed reload SHALL keep the shown rankings.

#### Scenario: A new record
- **WHEN** today's totals make it the best export day and a `totals` event arrives
- **THEN** the export record shows today without a page reload

#### Scenario: A new outage
- **WHEN** an outage longer than the 10th ends and an `outages` event arrives
- **THEN** it appears in the outage ranking without a page reload

#### Scenario: A failed reload
- **WHEN** a reload fails
- **THEN** the rankings shown stay as they were

### Requirement: VPP event days left out by default
A switch reading "Without VPP events" and "With VPP events" SHALL choose how both export rankings are shown, without VPP days unless the visitor picks With VPP events. The choice SHALL be in the address, `/top` without and `/top?vpp=with` with, any other `vpp` value reading as without, and choosing SHALL replace the address without a new history entry. The page SHALL be rendered, and each reload SHALL fetch, the rankings the address chooses. The solar ranking SHALL be the same either way.

#### Scenario: Opening the page
- **WHEN** a visitor opens `/top` and May 30, 2024, the best export day, is a VPP day
- **THEN** Without VPP events is chosen and May 30, 2024 is not among the export days

#### Scenario: Including VPP events
- **WHEN** the visitor chooses With VPP events
- **THEN** the address becomes `/top?vpp=with`, May 30, 2024 leads the export days at 60.0 kWh, and the solar ranking is unchanged

#### Scenario: A reload while VPP events are included
- **WHEN** a `totals` event arrives on `/top?vpp=with`
- **THEN** the export rankings reload with VPP days included

### Requirement: The footnote says which is shown
The page's footnote SHALL read "The export rankings leave out VPP event days, when Tesla discharged the Powerwalls to the grid for PG&E." without VPP events, and "The export rankings include VPP event days, when Tesla discharged the Powerwalls to the grid for PG&E." with them.

#### Scenario: Switching
- **WHEN** the visitor switches from Without VPP events to With VPP events
- **THEN** the footnote's sentence changes from "leave out" to "include"

### Requirement: Top ten data
`GET /api/top-ten` SHALL answer with status 200 and a list of `solar`, `net_grid`, `to_grid_months` and `outages` rankings, each row with its date label, its figure (exports as negative net figures, outages in hours) and its ISO date (`day`, or `month` as `YYYY-MM`). The export rankings SHALL leave VPP days out unless the request has `vpp=with`; any other `vpp` value SHALL read as without, as on the page.

#### Scenario: Without VPP days by default
- **WHEN** `/api/top-ten` is requested and May 30, 2024 is a VPP day
- **THEN** May 30, 2024 is not among the `net_grid` days

#### Scenario: With VPP days
- **WHEN** `/api/top-ten?vpp=with` is requested
- **THEN** May 30, 2024 leads the `net_grid` days at 60.0 kWh, and the `solar` and `outages` rankings equal those of `/api/top-ten`

#### Scenario: The old parameter
- **WHEN** `/api/top-ten?vpp=without` is requested
- **THEN** the answer equals that of `/api/top-ten`

#### Scenario: An empty database
- **WHEN** `/api/top-ten` is requested before any day or outage is saved
- **THEN** the answer is status 200 with four empty rankings

#### Scenario: The longest outage
- **WHEN** `/api/top-ten` is requested and the longest outage began 2024-02-04 and lasted 52.3 hours
- **THEN** the `outages` ranking leads with `{"date": "Feb 4, 2024", "hours": 52.3, "day": "2024-02-04"}`

### Requirement: Longest outages
The page SHALL rank the ten longest outages, backup events of the outage kind only (see backup-history), each with the date it began in the site's time zone and its duration in hours. It SHALL be the last ranking on the page, drawn in the Powerwall color, and the VPP switch SHALL NOT change it.

#### Scenario: The record on 2026-11-09
- **WHEN** the longest outage began February 4, 2024 and lasted 52.3 hours, and the next began December 14, 2024 and lasted 35.4 hours
- **THEN** the ranking leads with 52.3 h, Sunday, February 4, 2024, 16.9 h ahead of #2

#### Scenario: Install week left out
- **WHEN** a commissioning event from October 12, 2021 lasted 52.4 hours
- **THEN** it is not ranked

#### Scenario: Switching VPP events
- **WHEN** the visitor chooses With VPP events
- **THEN** the outage ranking is unchanged
