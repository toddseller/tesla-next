## MODIFIED Requirements

### Requirement: Since 2021
The Since 2021 chapter SHALL chart, by month from October 2021 to today, the running totals of solar made and of the house's use, as Impact gives each month's figures, each line named, the house's as including the car's charging, with today marked. It SHALL mark on the chart the payback years from the Payback card that have been reached, and say a projected one in words under the chart. The time axis SHALL be marked at each January 1 it spans, with that year. It SHALL link to True-Up.

#### Scenario: With costs
- **WHEN** the server has the costs file and the Payback card gives solar paid back in March 2025 and the whole system in 2028, projected
- **THEN** the chart marks March 2025, ends at today, and under it reads "The whole system is projected to pay back in 2028"

#### Scenario: Without costs
- **WHEN** the server has no costs file
- **THEN** the chapter shows its chart and figures and no payback marks

#### Scenario: The lines named
- **WHEN** a visitor reads the chart's legend
- **THEN** it names "solar made" and "house used, car included"

#### Scenario: The years on the axis
- **WHEN** the chart runs from October 2021 to November 22, 2026
- **THEN** the axis reads 2022 to 2026, each at its January 1, so March 2025's payback mark falls just after "2025", and nothing is drawn past today
