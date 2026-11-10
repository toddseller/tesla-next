## ADDED Requirements

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
