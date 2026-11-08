# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Data matches Flask's
`GET /api/top-ten` SHALL answer with status 200 and data equal to Flask's `/api/v2/top_ten`, a list of `solar`, `net_grid` and `to_grid_months` rankings with Flask's date labels and figures (exports as negative net figures), until change 7 (cutover) retires it. The rows SHALL differ only in the order of rows whose figures read the same to a tenth, in which row is 10th when it ties with the 11th, and in each row also giving its ISO date (`day`, or `month` as `YYYY-MM`). `GET /api/top-ten?vpp=without` SHALL answer in the same shape with the export rankings without VPP days.

#### Scenario: Compared with Flask
- **WHEN** a script requests `/api/top-ten` and Flask's `/api/v2/top_ten`
- **THEN** each ranking has the same rows with the same figures, in the same order apart from rows with equal figures

#### Scenario: Without VPP days
- **WHEN** `/api/top-ten?vpp=without` is requested and May 30, 2024 is a VPP day
- **THEN** May 30, 2024 is not among the `net_grid` days, and the `solar` ranking equals that of `/api/top-ten`

#### Scenario: An empty database
- **WHEN** `/api/top-ten` is requested before any day is saved
- **THEN** the answer is status 200 with three empty rankings
