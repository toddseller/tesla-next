## MODIFIED Requirements

### Requirement: Charging is attributed to energy sources
For each measured interval, charging energy SHALL be taken from that interval's home consumption by source in the order solar, Powerwall, grid, each source covering as much of the charging as it can before the next, as the live scene charges the car before the house, and SHALL NOT exceed that total.

#### Scenario: Charging overnight from the Powerwall
- **WHEN** an interval's home consumption is entirely from the Powerwall and 800 Wh of it is charging
- **THEN** 800 Wh is attributed to Powerwall to vehicle and none to solar or grid

#### Scenario: Charging larger than measured home consumption
- **WHEN** an interval records 900 Wh of charging but Tesla reports 850 Wh of home consumption
- **THEN** 850 Wh is attributed to the vehicle and the remaining home consumption is 0

#### Scenario: Solar covers the car while the grid covers the house
- **WHEN** an interval has 375 Wh of solar to home and 167 Wh of grid to home, and 100 Wh of it is charging
- **THEN** 100 Wh is attributed to solar to vehicle and none to grid to vehicle, leaving 275 Wh of solar to home and 167 Wh of grid to home

#### Scenario: Charging spills from solar to the Powerwall to the grid
- **WHEN** an interval has 100 Wh of solar to home, 300 Wh of Powerwall to home and 400 Wh of grid to home, and 600 Wh of it is charging
- **THEN** 100 Wh is attributed to solar to vehicle, 300 Wh to Powerwall to vehicle and 200 Wh to grid to vehicle, leaving 200 Wh of grid to home
