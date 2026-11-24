## MODIFIED Requirements

### Requirement: Self Powered section
The page SHALL show a Self Powered section: its title, the line "House use met by solar and Powerwall", a ring of the solar, Powerwall and grid shares with the self-powered percentage in its middle, and a legend listing each share with its percentage.

#### Scenario: A day's impact
- **WHEN** the range is 2026-10-18, with 48% solar, 52% Powerwall and 0% grid
- **THEN** the ring shows 100% in its middle, and the legend lists 48% Solar, 52% Powerwall and 0% Grid

#### Scenario: The house, not the home
- **WHEN** the page shows a range
- **THEN** the sections' heading reads "Where the house's energy came from" and the Self Powered line reads "House use met by solar and Powerwall"

### Requirement: Solar Offset section
The page SHALL show a Solar Offset section: its title, the line "Solar generated against house use", the energy offset percentage, and two bars on one scale, Solar and the house, each labeled with its energy as `display-units` reads energy, to one decimal place in kWh. The house's bar SHALL be named "House, car included", as the Solar range chart names it, since Impact's house use counts the car's charging.

#### Scenario: A day's offset
- **WHEN** the range is 2026-10-18, with 23.8 kWh of solar and 30.8 kWh of house use
- **THEN** the section shows 77% energy offset, a Solar bar labeled 23.8 kWh and a longer bar named "House, car included" labeled 30.8 kWh

#### Scenario: A year's offset
- **WHEN** the range has 12,345.6 kWh of solar and 15,200.0 kWh of house use
- **THEN** the bars are labeled 12.3 MWh and 15.2 MWh

#### Scenario: A whole number
- **WHEN** the range has 24.0 kWh of solar
- **THEN** the Solar bar is labeled 24.0 kWh
