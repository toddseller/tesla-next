## MODIFIED Requirements

### Requirement: Today's totals
The Today chapter SHALL show today's totals so far in kWh to one decimal: the house's use, the car's charging, energy from the grid, energy sent to PG&E, and the Powerwalls' energy in and out, each the day view's figure for today, so the house's use leaves out the car as the day view does and, on a day with car data, is labelled "used by the house, car apart".

#### Scenario: A sunny afternoon
- **WHEN** the day view for today shows the house at 21.3 kWh, the car charged 3.1 kWh, 14.4 kWh from the grid, 11.0 kWh sent, and the Powerwalls 0.7 kWh in and 0.0 kWh out
- **THEN** the Today chapter shows the same six figures, the house's as "21.3 kWh used by the house, car apart"

#### Scenario: Just after midnight
- **WHEN** it is 12:05 AM and today has 0.1 kWh of house use and nothing else
- **THEN** the chapter shows 0.1 kWh for the house and 0.0 kWh for the rest, with no warning

#### Scenario: No car data
- **WHEN** today's day view has no car data, so its house figure holds any charging
- **THEN** the figure is labelled "used by the house"

### Requirement: The days ahead
The Today chapter SHALL show the next three days' expected kWh to a tenth with their day names, as the forecast card gives them, or say there is no forecast right now when the card would.

#### Scenario: Three days ahead
- **WHEN** it is Saturday and Sunday, Monday and Tuesday expect 22.4, 27.0 and 16.1 kWh
- **THEN** the chapter shows "Sun 22.4 kWh · Mon 27.0 kWh · Tue 16.1 kWh", each day kept whole on one line, over "expected over the next three days"

### Requirement: The year's shares
Under its chart, the year chapter SHALL say how much of the house's energy in the chosen year, January 1 to December 31 or to today, came from solar, from the Powerwalls and from the grid, as Impact gives them for that range, saying that the house's energy here includes the car's charging, and SHALL link to Impact for that range.

#### Scenario: 2026 so far
- **WHEN** on November 21, 2026 Impact gives 39% from solar, 30% from the Powerwalls and 31% from the grid for the year so far
- **THEN** the chapter gives the three shares under "Where the house's energy came from in 2026, car included" and links to `/impact?start=2026-01-01&end=2026-11-21`

### Requirement: The records
The Records chapter SHALL offer four tabs, Best solar day, Most sent to PG&E in a day, Most sent to PG&E in a month, and Longest outage, Best solar day chosen by default, as tabs for assistive technology, all four shown in full without sideways scrolling at any width. Each tab SHALL list the top five of that Top Ten ranking as Top Ten shows it by default (an outage's length in days and hours), each linked to its day or month on the Solar page, and the chapter SHALL link to Top Ten.

#### Scenario: The best solar days
- **WHEN** a visitor opens `/` and June 13, 2022 is Top Ten's best solar day at 80.9 kWh
- **THEN** the chapter's first row gives 80.9 kWh on June 13, 2022, linked to `/solar?start=2022-06-01&end=2022-06-30&day=2022-06-13`

#### Scenario: The longest outage
- **WHEN** the longest outage lasted 52.3 hours from February 4, 2024
- **THEN** the Longest outage tab reads "2 d 4 h on February 4, 2024" and its first row gives 2 d 4 h

#### Scenario: Never off the grid
- **WHEN** Top Ten has no outages
- **THEN** the Longest outage tab says the house has not been off the grid since October 2021

### Requirement: How each record was beaten
Under its steps, each Records tab SHALL say how many days (or months) since the record was set have come within 2% of it, or that none has. Each Records tab SHALL chart its record since October 22, 2021 as steps, the highest figure up to each date, its y-axis marked at 0, the record and the lowest figure if below 0 (to a tenth, or in days and hours for outages), and its x-axis at each January 1. The current record SHALL be marked with its date and how long ago it was set ("set 4 years ago").

#### Scenario: A record that stands
- **WHEN** June 13, 2022 at 80.9 kWh is the best solar day and nothing has beaten it
- **THEN** the steps rise until June 13, 2022 and stay flat since, marked "set 4 years ago", and the tab says "Three days since have come within 2% of it" when June 20, 2023, June 17, 2024 and June 21, 2025 made at least 79.3 kWh

#### Scenario: A record set today
- **WHEN** today has made more solar than any day before
- **THEN** the last step rises today and is marked "set today"

#### Scenario: An axis in hours
- **WHEN** the longest outage lasted 52.3888 hours
- **THEN** the y-axis of the outage tab reads 0 and 2 d 4 h

#### Scenario: A series that starts below 0
- **WHEN** October 2021 imported 136.3 kWh more than it sent and April 2024's 479.2 kWh is the record
- **THEN** the month tab's y-axis reads -136.3, 0 and 479.2

### Requirement: Since 2021
The Since 2021 chapter SHALL chart, by month since October 2021, the running totals of solar made and of the house's use, as Impact gives each month's figures, each line named, the house's as including the car's charging, with today marked, and mark the payback years from the Payback card on the same time axis, a projected year drawn apart from a past one. The time axis SHALL be marked at each January 1 it spans, with that year. It SHALL link to True-Up.

#### Scenario: With costs
- **WHEN** the server has the costs file and the Payback card gives solar paid back in March 2025 and the whole system in 2028, projected
- **THEN** the chart marks March 2025 and, drawn as a projection, 2028

#### Scenario: Without costs
- **WHEN** the server has no costs file
- **THEN** the chapter shows its chart and figures and no payback marks

#### Scenario: The lines named
- **WHEN** a visitor reads the chart's legend
- **THEN** it names "solar made" and "house used, car included"

#### Scenario: The years on the axis
- **WHEN** the chart runs from October 2021 to the end of 2028
- **THEN** the axis reads 2022 to 2028, each at its January 1, so March 2025's payback mark falls just after "2025"

### Requirement: Since 2021's figures
Beside its chart, the Since 2021 chapter SHALL give the solar since October 22, 2021, say whether solar has made as much as the house used and by what share, as Impact gives it for that range, and give the current true-up year's net so far as True-Up's net tile gives it: the figure once, then in words what it is, imported or sent, more than the other, since the year began, without repeating the figure.

#### Scenario: As much as the house used
- **WHEN** Impact gives 75,611 kWh of solar and 100% of the house's use for October 22, 2021 to today
- **THEN** the chapter says solar has made as much as the house used (100%) and gives 75,611 kWh

#### Scenario: The true-up so far
- **WHEN** the true-up year that began October 1, 2026 has imported 611.4 kWh more than it sent
- **THEN** the chapter gives 611.4 kWh, then "more imported than sent this true-up year, since October 1"
