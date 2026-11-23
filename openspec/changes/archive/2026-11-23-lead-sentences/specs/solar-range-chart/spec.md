## ADDED Requirements

### Requirement: The range's lead sentence
Under its "Solar by date range" heading, the range view SHALL say in one sentence how much solar the range made, in whole kWh with its figures in mono: "Solar made N kWh in <the range>", with "so far" when the range includes today. The sentence SHALL follow the bars as they reload.

#### Scenario: The current month
- **WHEN** a viewer opens `/solar` on 2026-11-22, with 556.1 kWh made from November 1
- **THEN** the sentence begins "Solar made 556 kWh in November so far"

#### Scenario: A finished month
- **WHEN** the range is October 2026, with 1,086.2 kWh made
- **THEN** the sentence begins "Solar made 1,086 kWh in October 2026"

#### Scenario: A totals event
- **WHEN** the page shows the current month and a `totals` event for today raises the month's solar to 557.0 kWh
- **THEN** the sentence reads 557 kWh without a reload of the page

### Requirement: The comparison with a year earlier
The sentence SHALL compare the range's solar with the same days a year earlier, as a whole percentage: "N% more than", "N% less than", or "about the same as" when it rounds to 0%. Today being partly over, a longer range that includes it SHALL compare the days before today on both sides; one starting today, none. A finished month, calendar year or true-up year SHALL be compared by name ("October 2025"); any other range with "the same days last year".

#### Scenario: The month so far
- **WHEN** on 2026-11-22 the month has made 556.1 kWh, November 1 to 21 made 530.0 kWh, and November 1 to 21, 2025 made 500.0 kWh
- **THEN** the sentence reads "Solar made 556 kWh in November so far, 6% more than the same days last year."

#### Scenario: A finished month
- **WHEN** October 2026 made 1,086.2 kWh and October 2025 made 997.9 kWh
- **THEN** the sentence reads "Solar made 1,086 kWh in October 2026, 9% more than October 2025."

#### Scenario: Under one percent apart
- **WHEN** 2026 has made 13,554 kWh through November 22 and 13,500 kWh through November 21, and 2025 made 13,450 kWh through November 21
- **THEN** the sentence reads "Solar made 13,554 kWh in 2026 so far, about the same as the same days last year."

#### Scenario: The first of the month
- **WHEN** a viewer opens `/solar` at 9 am on 2026-12-01
- **THEN** the sentence gives December's total so far with no comparison

### Requirement: No year to compare with
When any of the year-earlier days falls before the system's first day, October 10, 2021, the sentence SHALL give the total alone, and for the first month SHALL say so: "Solar made 523 kWh in October 2021, its first month."

#### Scenario: The first month
- **WHEN** the range is October 2021
- **THEN** the sentence reads "Solar made 523 kWh in October 2021, its first month."

#### Scenario: A range from 2022
- **WHEN** the range is January to June 2022
- **THEN** the sentence gives that range's total with no comparison

### Requirement: Solar page order
The range view SHALL show, top to bottom: the page's heading with its sentence and range controls, the range chart, then the forecast card. A day's view is unchanged.

#### Scenario: Opening the Solar page
- **WHEN** a viewer opens `/solar` in a 1440 by 900 window
- **THEN** the heading, its sentence, the range controls and the top of the range chart are within the first screen, and the Solar forecast card follows the chart
