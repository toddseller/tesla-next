## MODIFIED Requirements

### Requirement: Flow assignment
Sources are solar while it produces, the Powerwall while it discharges and the grid while importing; destinations are the house, the car while it charges, the Powerwall while it charges and the grid while exporting. Taking sources in the order solar, Powerwall, grid, solar SHALL be assigned to destinations in the order Powerwall, car, home, grid, the Powerwall in the order car, home, grid, and the grid in the order car, home, Powerwall, as Tesla attributes Powerwall charging to solar before the grid and a car's charging to solar before the house. Every active source SHALL show at least one flow.

#### Scenario: Totals that don't balance
- **WHEN** solar is 6.1 kW and the grid imports 2.0 kW while home uses 4.1 kW
- **THEN** solar flows to the house and the grid flows to the house as well

#### Scenario: Powerwall charging while the grid covers the house
- **WHEN** solar is 1.0 kW, the Powerwall charges at 0.9 kW, the grid imports 1.2 kW and home uses 1.2 kW
- **THEN** solar flows to the Powerwall, the grid flows to the house, and nothing flows from the grid to the Powerwall

#### Scenario: Solar charges the car before the house
- **WHEN** solar is 4.5 kW, home is 5.2 kW, the car charges at 1.2 kW, the grid imports 2.0 kW and the Powerwall is idle
- **THEN** solar flows to the car at 1.2 kW and to the house, the grid flows to the house, and nothing flows from the grid to the car

#### Scenario: The Powerwall charges the car before the house
- **WHEN** solar is 0 kW, the Powerwall discharges 2.0 kW, the grid imports 6.0 kW, home is 1.0 kW and the car charges at 7.0 kW
- **THEN** the Powerwall flows to the car at 2.0 kW, the grid flows to the car at 5.0 kW and to the house at 1.0 kW, and nothing flows from the Powerwall to the house
