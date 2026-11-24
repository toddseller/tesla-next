## MODIFIED Requirements

### Requirement: Powerwall use by year
For each calendar year from the first stored interval to this year, the Powerwall use section SHALL show the energy out of the Powerwalls as a bar and figure, in kWh or MWh as `display-units` reads a list of energy figures, the cycles as that energy over 40.5 kWh rounded to a whole number, and the round trip as energy out over energy into them, from solar and the grid, as a whole percentage. The first year SHALL say from which day when it starts after January 1, and this year SHALL say "so far".

#### Scenario: A full year
- **WHEN** 3,030 kWh came out of the Powerwalls in 2025 and 3,662 kWh went in
- **THEN** the 2025 row shows 3.0 MWh, 75 cycles and an 83% round trip

#### Scenario: The first year
- **WHEN** the first stored interval is on October 10, 2021
- **THEN** the 2021 row says "from Oct 10"

#### Scenario: Nothing went in
- **WHEN** no energy went into the Powerwalls in a year
- **THEN** that year's round trip shows a dash

### Requirement: This year's Powerwall figures
Above the rows, the Powerwall use section SHALL show this year's cycles with the cycles since the first year, this year's round trip, and this year's energy out with the energy out since the first year, and SHALL say that a cycle is 40.5 kWh out, the three Powerwalls' rated size.

#### Scenario: November 2026
- **WHEN** 4,416 kWh has come out in 2026 and 20,715 kWh since October 2021
- **THEN** the figures read 109 cycles in 2026 and 511 since 2021, and 4.4 MWh in 2026 and 20.7 MWh since 2021
