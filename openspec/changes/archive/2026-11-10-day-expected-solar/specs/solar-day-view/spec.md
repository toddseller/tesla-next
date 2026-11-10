## ADDED Requirements

### Requirement: The expected line
When the day has expected hours, the Solar view's chart SHALL draw an expected line over the flows: a smooth curve through each hour's expected kWh as average kW at the hour's middle, from zero at the start of the first hour expecting any to zero at the end of the last, in the foreground color, solid. A key reading "Expected from the forecast" SHALL name it. The other views SHALL NOT draw it.

#### Scenario: The microinverter fault
- **WHEN** a visitor opens April 16, 2026's Solar view
- **THEN** the expected line rises to about 8.6 kW in the early afternoon while the flows stay under about 4.2 kW

#### Scenario: Another view
- **WHEN** the visitor switches to the Home view
- **THEN** no expected line or key shows

#### Scenario: Not enough history
- **WHEN** a visitor opens October 12, 2021's Solar view
- **THEN** the chart shows the flows alone, with no expected line or key

### Requirement: The expected total
When the day has expected hours, Total Generated SHALL show beside its kWh the day's expected kWh, the sum of its hours' rounded to a whole kWh, as "of 64 kWh expected", followed for a day before today by the generated kWh as a whole percentage of it, in red under 60%. Today SHALL show the expected kWh without a percentage.

#### Scenario: A fault day
- **WHEN** April 16, 2026 generated 25.7 kWh against 64.4 kWh expected
- **THEN** Total Generated reads 25.7 kWh, of 64 kWh expected (40%), the 40% in red

#### Scenario: A clear day
- **WHEN** April 3, 2026 generated 63.1 kWh against 63.1 kWh expected
- **THEN** Total Generated reads 63.1 kWh, of 63 kWh expected (100%), not in red

#### Scenario: Today
- **WHEN** a visitor opens today at noon, with 18.8 kWh generated and 34 kWh expected for the day
- **THEN** Total Generated reads 18.8 kWh, of 34 kWh expected, with no percentage

### Requirement: Expected in the chart details
When the day has expected hours, pointing at the Solar view's chart, or touching it, SHALL also show an Expected row after the flows: the expected kWh of the hour holding the pointed step as average kW, to one decimal.

#### Scenario: Late morning on the fault day
- **WHEN** a visitor points at 11:45 AM on April 16, 2026's Solar view, its 11 AM hour expecting 7.8 kWh
- **THEN** the details show 11:45 AM, the flows' power, and Expected 7.8 kW
