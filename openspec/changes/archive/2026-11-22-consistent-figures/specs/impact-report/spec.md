## MODIFIED Requirements

### Requirement: Solar Offset section
The page SHALL show a Solar Offset section: its title, the line "Solar generated against home use", the energy offset percentage, and two bars on one scale, Solar and Home, each labeled with its energy to one decimal place, in kWh below 1,000 kWh and in MWh from 1,000 kWh. The Home bar SHALL be named "Home, car included", since Impact's home use counts the car's charging.

#### Scenario: A day's offset
- **WHEN** the range is 2026-10-18, with 23.8 kWh of solar and 30.8 kWh of home use
- **THEN** the section shows 77% energy offset, a Solar bar labeled 23.8 kWh and a longer bar named "Home, car included" labeled 30.8 kWh

#### Scenario: A year's offset
- **WHEN** the range has 12,345.6 kWh of solar and 15,200.0 kWh of home use
- **THEN** the bars are labeled 12.3 MWh and 15.2 MWh

#### Scenario: A whole number
- **WHEN** the range has 24.0 kWh of solar
- **THEN** the Solar bar is labeled 24.0 kWh
