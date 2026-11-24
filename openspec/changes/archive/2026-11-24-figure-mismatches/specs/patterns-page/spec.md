## MODIFIED Requirements

### Requirement: This year's Powerwall figures
Above the rows, the Powerwall use section SHALL show this year's cycles with the cycles since the first year, this year's round trip, and this year's energy out with the energy out since the first year, and SHALL say that a cycle is 40.5 kWh out, the three Powerwalls' rated size. The cycles since the first year SHALL be the sum of the yearly rows' cycles, so the figure matches the rows a reader adds up.

#### Scenario: November 2026
- **WHEN** 4,416 kWh has come out in 2026 and 20,715 kWh since October 2021
- **THEN** the figures read 109 cycles in 2026 and 511 since 2021, and 4.4 MWh in 2026 and 20.7 MWh since 2021

#### Scenario: Rows that round up
- **WHEN** 60.75 kWh came out in each of two years, 1.5 cycles each, which the rows show as 2 cycles each
- **THEN** the cycles since the first year read 4, not the 3 that the exact total would round to
