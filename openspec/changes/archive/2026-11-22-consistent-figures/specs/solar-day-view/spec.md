## MODIFIED Requirements

### Requirement: Home view
The Home view SHALL stack solar to home, Powerwall to home and grid to home as filled areas whose top edge is total home usage excluding vehicle charging, headed by Total Usage, with a Powered By breakdown. On a day with vehicle data the headline SHALL read "Total Usage, car apart", so it isn't taken for the house figures elsewhere that include the car.

#### Scenario: Night on battery
- **WHEN** the home runs from the Powerwall overnight
- **THEN** the night portion of the Home chart is the Powerwall area

#### Scenario: Charging is not home usage
- **WHEN** a day with vehicle data had 9.1 kWh of charging
- **THEN** Total Usage excludes those 9.1 kWh, and its headline reads "Total Usage, car apart"

#### Scenario: Before vehicle data
- **WHEN** a day has no vehicle data
- **THEN** the headline reads "Total Usage"

### Requirement: The expected total
When the day has expected hours, Total Generated SHALL show beside its kWh the day's expected kWh, the sum of its hours' to a tenth, as the forecast card gives it, as "of 64.4 kWh expected", followed for a day before today by the generated kWh as a whole percentage of it, in red under 60%. Today SHALL show the expected kWh without a percentage.

#### Scenario: A fault day
- **WHEN** April 16, 2026 generated 25.7 kWh against 64.4 kWh expected
- **THEN** Total Generated reads 25.7 kWh, of 64.4 kWh expected (40%), the 40% in red

#### Scenario: A clear day
- **WHEN** April 3, 2026 generated 63.1 kWh against 63.1 kWh expected
- **THEN** Total Generated reads 63.1 kWh, of 63.1 kWh expected (100%), not in red

#### Scenario: Today
- **WHEN** a visitor opens today at noon, with 18.8 kWh generated and 34.2 kWh expected for the day
- **THEN** Total Generated reads 18.8 kWh, of 34.2 kWh expected, with no percentage
