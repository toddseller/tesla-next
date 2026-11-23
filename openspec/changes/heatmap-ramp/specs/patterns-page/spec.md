## MODIFIED Requirements

### Requirement: When the house uses power
The When the house uses power section SHALL show two grids, "The last 12 months" (this month, site time, and the 11 before it) and "The 12 months before", each a row per month, oldest first, labelled with the month and year, and a square for each hour of the day from 12 AM to 11 PM, with the hours labelled at 12 AM, 6 AM, noon and 6 PM. Both grids SHALL use one scale.

#### Scenario: November 2026
- **WHEN** it is November 10, 2026
- **THEN** the first grid's rows run from December 2025 to November 2026 and the second's from December 2024 to November 2025

#### Scenario: The shift shows
- **WHEN** September 2025's 1 PM house use was 3,731 W and its 1 AM 1,781 W, and September 2026's are 1,852 W and 6,153 W
- **THEN** September 2025's 1 PM square and September 2026's 1 AM square are the lightest step, and September 2025's 1 AM and September 2026's 1 PM squares are the 1.5 to 2 kW step

### Requirement: The use steps
Each square SHALL take one of seven steps of one blue, from darkest to lightest: under 1 kW, 1 to 1.5 kW, 1.5 to 2 kW, 2 to 2.5 kW, 2.5 to 3 kW, 3 to 3.5 kW, and 3.5 kW and up. A key SHALL show the seven steps in order, labelled 0.5, 1, 1.5, 2, 2.5, 3 and 3.5+ kW. A square without house use SHALL be empty, unlike any step.

#### Scenario: The edges of a step
- **WHEN** two hours' house use is 999 W and 1,000 W
- **THEN** the first is the darkest step and the second the next

#### Scenario: An hour without readings
- **WHEN** an hour of a month has no house use
- **THEN** its square is empty, not the darkest step

#### Scenario: Each step lighter than the one before
- **WHEN** the key's seven swatches are compared
- **THEN** each is lighter than the one before it, 3.5+ kW the lightest
