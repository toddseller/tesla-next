## MODIFIED Requirements

### Requirement: Home view
The Home view SHALL stack solar to home, Powerwall to home and grid to home as filled areas whose top edge is total home usage excluding vehicle charging, headed by Total Usage, with a Powered By breakdown. On a day with vehicle data the headline SHALL read "Total Usage, without the car", so it isn't taken for the house figures elsewhere that include the car.

#### Scenario: Night on battery
- **WHEN** the home runs from the Powerwall overnight
- **THEN** the night portion of the Home chart is the Powerwall area

#### Scenario: Charging is not home usage
- **WHEN** a day with vehicle data had 9.1 kWh of charging
- **THEN** Total Usage excludes those 9.1 kWh, and its headline reads "Total Usage, without the car"

#### Scenario: Before vehicle data
- **WHEN** a day has no vehicle data
- **THEN** the headline reads "Total Usage"
