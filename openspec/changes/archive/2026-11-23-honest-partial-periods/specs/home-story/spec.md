## MODIFIED Requirements

### Requirement: Today against the forecast
The Today chapter SHALL lead with today's solar so far in kWh to one decimal, as the forecast card's today tile gives it, then today's expected kWh to one decimal (the sum of the forecast's hours when it has them) as the forecast card says it, and the kWh still to come: the forecast hours left after now (the day's expected without hours, none after sundown). Without an expected kWh it SHALL show the kWh so far alone.

#### Scenario: Ahead of the forecast
- **WHEN** at 3:39 PM today has made 21.7 kWh, 18 kWh is expected for the day, 17.8 kWh was expected by 3:35 PM, and the forecast's 3 PM hour expects 0.4 kWh with no hour after it
- **THEN** the chapter leads with 21.7 kWh, then "generated, of 18.0 kWh expected", "3.9 kWh ahead of the forecast" and "0.2 kWh still to come", each figure with its unit beside it

#### Scenario: After sundown
- **WHEN** at 7:25 PM the day's hours sum to 19.7 kWh and the forecast card says the day's sunlight is over
- **THEN** the chapter shows "of 19.7 kWh expected" and "0.0 kWh still to come"

#### Scenario: No forecast
- **WHEN** there are too few days with a forecast to give an expected kWh and today has made 3.0 kWh
- **THEN** the chapter shows 3.0 kWh and no expected figure

### Requirement: Since 2021
The Since 2021 chapter SHALL chart, by month from October 2021 to today, the running totals of solar generated and of the house's use, as Impact gives each month's figures, each line named, the house's as including the car's charging, with today marked. It SHALL mark on the chart the payback years from the Payback card that have been reached, and say a projected one in words under the chart. The time axis SHALL be marked at each January 1 it spans, with that year. It SHALL link to True-Up.

#### Scenario: With costs
- **WHEN** the server has the costs file and the Payback card gives solar paid back in March 2025 and the whole system in 2028, projected
- **THEN** the chart marks March 2025, ends at today, and under it reads "The whole system is projected to pay back in 2028"

#### Scenario: Without costs
- **WHEN** the server has no costs file
- **THEN** the chapter shows its chart and figures and no payback marks

#### Scenario: The lines named
- **WHEN** a visitor reads the chart's legend
- **THEN** it names "solar generated" and "house used, car included"

#### Scenario: The years on the axis
- **WHEN** the chart runs from October 2021 to November 22, 2026
- **THEN** the axis reads 2022 to 2026, each at its January 1, so March 2025's payback mark falls just after "2025", and nothing is drawn past today

### Requirement: Since 2021's figures
Beside its chart, the Since 2021 chapter SHALL give the solar since October 22, 2021, say whether solar has generated as much as the house used and by what share, as Impact gives it for that range, and give the current true-up year's net so far as True-Up's net tile gives it: the figure once, then in words what it is, imported or sent, more than the other, since the year began, without repeating the figure.

#### Scenario: As much as the house used
- **WHEN** Impact gives 75,611 kWh of solar and 100% of the house's use for October 22, 2021 to today
- **THEN** the chapter says solar has generated as much as the house used (100%) and gives 75,611 kWh

#### Scenario: The true-up so far
- **WHEN** the true-up year that began October 1, 2026 has imported 611.4 kWh more than it sent
- **THEN** the chapter gives 611.4 kWh, then "more imported than sent this true-up year, since October 1"
