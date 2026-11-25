## MODIFIED Requirements

### Requirement: Home charging by source
For a range of days, home charging SHALL be the Wall Connector's charging in each 5 minutes of the range, measured where the Wall Connector measured it and otherwise estimated from charge sessions and short gaps as the day intervals do, each interval's charging split across solar, Powerwall and grid as "Charging is attributed to energy sources" defines. The figures SHALL be its total kWh, the kWh and whole-number percentage from each source, and the self-powered share (solar plus Powerwall).

#### Scenario: A night's charge from the Powerwall
- **WHEN** the range is one day on which 10 kWh went into the cars, 6 kWh of it while the home ran on the Powerwall and 4 kWh while it ran on the grid
- **THEN** the figures are 10 kWh, 0% solar, 60% Powerwall, 40% grid and 60% self-powered

### Requirement: The Home car charging section
The Impact page SHALL show a Home car charging section after the section on where the home's energy came from and before Backup, for the range shown, with a ring of the solar, Powerwall and grid shares and the self-powered share in its middle, captioned "self-powered" as the Self powered ring is, the kWh into the cars, the source legend and the car lines, in the flow colors. On a 375-pixel-wide screen it SHALL fit in one column with no horizontal scrolling.

#### Scenario: On a phone
- **WHEN** the page is 375 pixels wide
- **THEN** the ring, legend and car lines stack in one column with no horizontal scrolling

#### Scenario: The ring's middle
- **WHEN** 34% of the range's home charging came from solar and 27% from the Powerwall
- **THEN** the ring's middle reads "61%" over "self-powered", and the section never says "off the grid"
