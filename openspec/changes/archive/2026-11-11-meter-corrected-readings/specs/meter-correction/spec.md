# Spec Delta

## Purpose

How the site corrects Tesla's grid readings with PG&E's meter for the years Tesla read about half, and lets a viewer see Tesla's own figures instead: which days are corrected, how daily and 5-minute figures are corrected, and which pages offer the choice.

## ADDED Requirements

### Requirement: The corrected days
A day SHALL be corrected when it is before 2026-04-27 and PG&E's meter has a reading for it in `meter_day`. Every other day SHALL show Tesla's figures as reported, in both views: days from 2026-04-27, which Tesla reads right, and days before PG&E's first reading.

#### Scenario: A day with PG&E's reading
- **WHEN** a page shows 2025-12-10, which has a PG&E reading
- **THEN** its grid figures come from PG&E's reading

#### Scenario: A day before PG&E's readings begin
- **WHEN** a page shows 2023-06-15, before PG&E's first reading on 2023-10-06
- **THEN** its figures are as Tesla reported them, in either view

#### Scenario: A day after the fix
- **WHEN** a page shows 2026-05-10
- **THEN** its figures are Tesla's, in either view

### Requirement: Corrected daily figures
For a corrected day, a daily figure SHALL take its grid import and export from PG&E's reading. The difference from Tesla's import SHALL be added to the home's use from the grid, and the difference from Tesla's export SHALL be taken from the home's use of solar, never below zero. Solar generated and the Powerwall's figures SHALL be Tesla's.

#### Scenario: A corrected day's totals
- **WHEN** Tesla recorded 20 kWh in, 4 kWh out and 30 kWh of home use for 2025-12-10, and PG&E's meter read 40 kWh in and 8 kWh out
- **THEN** the day shows 40 kWh in, 8 kWh out and 46 kWh of home use

### Requirement: Corrected 5-minute import
For a corrected day, the difference between PG&E's import and the sum of the day's 5-minute steps' import SHALL be shared among the steps by their home use from the grid. A day with no home use from the grid SHALL share it by home use from the Powerwall, or evenly when it has neither. Each step's share SHALL be added to its grid import and home use from the grid, so the steps' import adds up to PG&E's reading.

#### Scenario: Night steps on a half-read day
- **WHEN** a corrected day's import difference is 10 kWh and its steps from 1 to 2 AM drew a twentieth of the day's home use from the grid
- **THEN** those steps gain 0.5 kWh of grid import and home use from the grid between them

#### Scenario: A step the Powerwall fed
- **WHEN** a corrected day has home use from the grid and a step at 2 AM drew only from the Powerwall
- **THEN** that step keeps its figures as Tesla stored them

#### Scenario: A day Tesla saw no import
- **WHEN** Tesla's steps recorded no home use from the grid on a corrected day and PG&E's meter read 6 kWh
- **THEN** the 6 kWh is shared among the day's steps by their home use from the Powerwall, and the steps add up to 6 kWh imported

### Requirement: Corrected 5-minute export
For a corrected day, the difference between PG&E's export and the sum of the day's steps' export SHALL be spread over the steps in proportion to each step's solar generated. Each step's share SHALL be added to its export and taken from its home use of solar, never below zero, so the steps' export adds up to PG&E's reading.

#### Scenario: Midday steps
- **WHEN** a corrected day's export difference is 8 kWh and its steps from noon to 1 PM made an eighth of the day's solar
- **THEN** those steps gain 1 kWh of export and lose up to 1 kWh of home use from solar between them

### Requirement: A choice of readings on each affected page
The Solar page, Impact, Patterns and Top Ten SHALL show a switch reading "Corrected" and "As Tesla reported" when what they show includes a corrected day. Corrected SHALL be chosen unless the address has `readings=tesla`. Choosing SHALL replace the address and show every figure on the page, daily and 5-minute, in that view. A page whose days include no corrected day SHALL show no switch.

#### Scenario: A range in the corrected years
- **WHEN** a viewer opens the Solar page for October 2025
- **THEN** the switch shows with Corrected chosen, and the figures are corrected

#### Scenario: Choosing Tesla's figures
- **WHEN** the viewer picks "As Tesla reported" on Impact for 2025
- **THEN** the address gains `readings=tesla` and every figure on the page, the car charging split included, is as Tesla reported it

#### Scenario: A range after the fix
- **WHEN** a viewer opens the Solar page for May 2026
- **THEN** no switch shows

#### Scenario: A range before PG&E's readings
- **WHEN** a viewer opens Impact for 2022
- **THEN** no switch shows, and the figures are as Tesla reported them

#### Scenario: Top Ten's two choices
- **WHEN** a viewer on `/top?vpp=with` picks "As Tesla reported"
- **THEN** the address keeps `vpp=with` and gains `readings=tesla`

### Requirement: Saying which readings are shown
A page showing the switch SHALL say under its figures which readings they use. Corrected: "Grid figures from October 6, 2023 to April 26, 2026 use PG&E's meter readings: Tesla read about half of them until a service visit on April 27, 2026. Earlier dates are as Tesla reported them." As Tesla reported: "Grid figures are as Tesla reported them. Until April 27, 2026, Tesla read about half of what PG&E's meter recorded."

#### Scenario: The corrected note
- **WHEN** Impact shows 2025 with Corrected chosen
- **THEN** the note under its figures names PG&E's readings and the dates they cover

### Requirement: True-Up keeps PG&E's readings
The True-Up page SHALL keep using PG&E's readings for its cost and savings, and SHALL show no switch.

#### Scenario: A past true-up year
- **WHEN** a viewer opens True-Up for 2024-25
- **THEN** no switch shows and its figures come from PG&E's readings as before
