# Spec Delta

## MODIFIED Requirements

### Requirement: The forecast card
The Solar page's range view SHALL show a "Solar forecast" card above "Solar by date range", served with the page, with a tile for today and one for each of the next three days, site time, and a footnote saying the figures are the forecast sunlight scaled by the panels' last 30 days, that bars run to a good day with its kWh, and that a forecast is usually within about 4 kWh, coastal fog being hardest to call. A day's own view SHALL NOT show the card.

#### Scenario: Opening the Solar page
- **WHEN** a viewer opens `/solar` on November 10, 2026
- **THEN** the first response holds the Solar forecast card, with Today, Tomorrow, Thursday and Friday, above "Solar by date range"

#### Scenario: A day's view
- **WHEN** a viewer opens `/solar?day=2026-11-09`
- **THEN** the page shows that day without the forecast card

### Requirement: Choosing the day
When the card shows Today by hour, each of the next three days with forecast hours SHALL be a button that shows its hours in the chart under the tiles, and today's tile SHALL be one too while any day ahead is; Today is chosen when the page opens. The chosen day ahead SHALL be marked by a raised background; today's tile SHALL keep its outline and never change, so with Today chosen no tile is raised. A tile SHALL NOT change on hover.

#### Scenario: Choosing Thursday
- **WHEN** a viewer presses Thursday's tile
- **THEN** Thursday's tile is raised and pressed, and the chart shows Thursday's hours

#### Scenario: Back to Today
- **WHEN** Thursday is chosen and the viewer presses Today's tile
- **THEN** no tile is raised, Today's tile keeps its outline, and the chart shows Today by hour

#### Scenario: Opening the Solar page
- **WHEN** a viewer opens `/solar`
- **THEN** the chart shows Today by hour and no tile is raised

#### Scenario: No day ahead to choose
- **WHEN** the card shows Today by hour and "No forecast right now" in place of the days ahead
- **THEN** today's tile is not a button

#### Scenario: On a phone
- **WHEN** the Solar page is 375 pixels wide and the viewer taps Friday's row
- **THEN** Friday's row is raised and the chart shows Friday's hours, with no horizontal scrolling

### Requirement: Expected kWh
A day's expected kWh SHALL be the sum of its hours' expected kWh when the hourly forecast covers that day, so a day's figure, its hours and the expected by now never disagree; otherwise it SHALL be its stored forecast sunlight times the scale: the solar kWh over the forecast sunlight summed across the last 30 days before today that have both a solar total and a stored forecast. It SHALL be shown as a whole kWh, a sum of hours rounded up after rounding it to a tenth, so the expected by now never passes it. With fewer than 7 such days there SHALL be no expected kWh.

#### Scenario: Scaling by the last 30 days
- **WHEN** the last 30 days made 900 kWh under 360 MJ/m² of forecast sunlight, tomorrow's forecast is 13.2 MJ/m², and tomorrow has no hourly forecast
- **THEN** tomorrow's expected kWh is 33

#### Scenario: A day with its hours
- **WHEN** today's hourly forecast expects 17.95 kWh across its hours and its daily sunlight would scale to 17 kWh
- **THEN** today's expected kWh is 18, and the expected by now can never exceed it

#### Scenario: A sum that would round down
- **WHEN** today's hours sum to 18.4 kWh and by late afternoon 18.4 kWh was expected by now
- **THEN** today's expected kWh is 19, not 18

#### Scenario: Too little history
- **WHEN** only 5 of the last 30 days have both a solar total and a stored forecast
- **THEN** no day has an expected kWh and the card says there is no forecast right now
