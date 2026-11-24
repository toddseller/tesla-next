## MODIFIED Requirements

### Requirement: The range's lead sentence
Under its "Solar by date range" heading, the range view SHALL say in one sentence how much solar the range generated, in whole kWh, or in MWh from 1,000 kWh as `display-units` reads energy, with its figures in mono: "Solar generated N kWh <the range>", or "Solar has generated" while the range includes today. A range that includes today SHALL be named as under way: "today so far", "in November so far", or, for a range no preset names, from its first day ("since Nov 10, 2026"). The sentence SHALL follow the bars as they reload.

#### Scenario: The current month
- **WHEN** a viewer opens `/solar` on 2026-11-22, with 556.1 kWh made from November 1
- **THEN** the sentence begins "Solar has generated 556 kWh in November so far"

#### Scenario: A finished month
- **WHEN** the range is October 2026, with 1,086.2 kWh made
- **THEN** the sentence begins "Solar generated 1.1 MWh in October 2026"

#### Scenario: A totals event
- **WHEN** the page shows the current month and a `totals` event for today raises the month's solar to 557.0 kWh
- **THEN** the sentence reads 557 kWh without a reload of the page

#### Scenario: Today alone
- **WHEN** the range is 2026-11-23 on 2026-11-23, with 12.4 kWh made so far
- **THEN** the sentence reads "Solar has generated 12 kWh today so far."

#### Scenario: All time
- **WHEN** All time is shown on 2026-11-23, with 75,643 kWh made
- **THEN** the sentence reads "Solar has generated 75.6 MWh since Oct 10, 2021."

### Requirement: The comparison with a year earlier
The sentence SHALL compare the range's solar with the same days a year earlier, as a whole percentage: "N% more than", "N% less than", or "about the same as" when it rounds to 0%. Today being partly over, a longer range that includes it SHALL compare the days before today on both sides; one starting today, a lone today included, none. A finished month, calendar year or true-up year SHALL be compared by name ("October 2025"); any other range with "the same days last year".

#### Scenario: The month so far
- **WHEN** on 2026-11-22 the month has made 556.1 kWh, November 1 to 21 made 530.0 kWh, and November 1 to 21, 2025 made 500.0 kWh
- **THEN** the sentence reads "Solar has generated 556 kWh in November so far, 6% more than the same days last year."

#### Scenario: A finished month
- **WHEN** October 2026 made 1,086.2 kWh and October 2025 made 997.9 kWh
- **THEN** the sentence reads "Solar generated 1.1 MWh in October 2026, 9% more than October 2025."

#### Scenario: Under one percent apart
- **WHEN** 2026 has made 13,554 kWh through November 22 and 13,500 kWh through November 21, and 2025 made 13,450 kWh through November 21
- **THEN** the sentence reads "Solar has generated 13.6 MWh in 2026 so far, about the same as the same days last year."

#### Scenario: The first of the month
- **WHEN** a viewer opens `/solar` at 9 am on 2026-12-01
- **THEN** the sentence gives December's total so far with no comparison

#### Scenario: Today alone
- **WHEN** the range is today, part made, and the same date last year made a whole day's solar
- **THEN** the sentence gives today's total so far with no comparison
