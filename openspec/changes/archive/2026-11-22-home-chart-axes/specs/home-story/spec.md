## MODIFIED Requirements

### Requirement: How each record was beaten
Under its steps, each Records tab SHALL say how many days (or months) since the record was set have come within 2% of it, or that none has. Each Records tab SHALL chart its record since October 22, 2021 as steps, the highest figure up to each date, its y-axis marked to a tenth at 0, the record and the lowest figure if below 0, and its x-axis at each January 1. The current record SHALL be marked with its date and how long ago it was set ("set 4 years ago").

#### Scenario: A record that stands
- **WHEN** June 13, 2022 at 80.9 kWh is the best solar day and nothing has beaten it
- **THEN** the steps rise until June 13, 2022 and stay flat since, marked "set 4 years ago", and the tab says "Three days since have come within 2% of it" when June 20, 2023, June 17, 2024 and June 21, 2025 made at least 79.3 kWh

#### Scenario: A record set today
- **WHEN** today has made more solar than any day before
- **THEN** the last step rises today and is marked "set today"

#### Scenario: An axis in hours
- **WHEN** the longest outage lasted 52.3888 hours
- **THEN** the y-axis of the outage tab reads 0 and 52.4, with no longer decimals

#### Scenario: A series that starts below 0
- **WHEN** October 2021 imported 136.3 kWh more than it sent and April 2024's 479.2 kWh is the record
- **THEN** the month tab's y-axis reads -136.3, 0 and 479.2

### Requirement: Since 2021
The Since 2021 chapter SHALL chart, by month since October 2021, the running totals of solar made and of the house's use, as Impact gives each month's figures, each line named, with today marked, and mark the payback years from the Payback card on the same time axis, a projected year drawn apart from a past one. The time axis SHALL be marked at each January 1 it spans, with that year. It SHALL link to True-Up.

#### Scenario: With costs
- **WHEN** the server has the costs file and the Payback card gives solar paid back in March 2025 and the whole system in 2028, projected
- **THEN** the chart marks March 2025 and, drawn as a projection, 2028

#### Scenario: Without costs
- **WHEN** the server has no costs file
- **THEN** the chapter shows its chart and figures and no payback marks

#### Scenario: The years on the axis
- **WHEN** the chart runs from October 2021 to the end of 2028
- **THEN** the axis reads 2022 to 2028, each at its January 1, so March 2025's payback mark falls just after "2025"
