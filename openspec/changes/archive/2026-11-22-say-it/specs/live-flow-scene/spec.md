## MODIFIED Requirements

### Requirement: Live labels
Each element SHALL have a label next to it, without a leader line: SOLAR with solar power, HOME with home power excluding car charging, POWERWALL with battery power and charge percentage, and GRID with grid power and, on a line under it whenever the power shows above 0, its direction ("to PG&E" exporting, "from PG&E" importing), all in kW to one decimal. Labels SHALL update with each live status update, and show a dash until the first one arrives.

#### Scenario: Midday values
- **WHEN** live status reports 6.1 kW solar, 4.1 kW home, 0 kW Powerwall at 100% and 2.0 kW grid
- **THEN** the labels read SOLAR 6.1 kW, HOME 4.1 kW, POWERWALL 0 kW · 100% and GRID 2.0 kW, with "from PG&E" under it

#### Scenario: Before the first update
- **WHEN** the page opens before any live status has been received
- **THEN** each label shows a dash instead of a value

#### Scenario: Sending to PG&E
- **WHEN** live status reports -1.2 kW grid
- **THEN** the GRID label reads 1.2 kW, with "to PG&E" under it

#### Scenario: The grid idle
- **WHEN** live status reports 0.02 kW grid
- **THEN** the GRID label reads 0 kW, with no direction
