## MODIFIED Requirements

### Requirement: Expected kWh
A day's expected kWh SHALL be the sum of its hours' expected kWh when the hourly forecast covers that day; otherwise its stored forecast sunlight times the scale (the solar kWh over the forecast sunlight across the last 30 days before today with both). Either way it SHALL be rounded to a tenth, the figure every page shows for that day. With fewer than 7 such days there SHALL be no expected kWh.

#### Scenario: Scaling by the last 30 days
- **WHEN** the last 30 days made 900 kWh under 360 MJ/m² of forecast sunlight, tomorrow's forecast is 13.2 MJ/m², and tomorrow has no hourly forecast
- **THEN** tomorrow's expected kWh is 33.0

#### Scenario: A day with its hours
- **WHEN** today's hourly forecast expects 17.95 kWh across its hours and its daily sunlight would scale to 17 kWh
- **THEN** today's expected kWh is 18.0, and the expected by now can never exceed it

#### Scenario: A sum that would round down
- **WHEN** today's hours sum to 18.43 kWh and by late afternoon 18.4 kWh was expected by now
- **THEN** today's expected kWh is 18.4, the same on the Solar forecast tile, the Solar day view and the home page

#### Scenario: Too little history
- **WHEN** only 5 of the last 30 days have both a solar total and a stored forecast
- **THEN** no day has an expected kWh and the card says there is no forecast right now

### Requirement: Today's tile
Today's tile SHALL show today's expected kWh to a tenth, today's solar so far in kWh to one decimal, a bar of the so-far against the expected (full at or past it), and today's sky, with today marked apart from the other days. Today's sky SHALL be the sky now when the latest stored weather reading is less than 3 hours old, and the forecast's otherwise. Without an expected kWh it SHALL show the kWh so far alone.

#### Scenario: Mid-morning
- **WHEN** today's expected kWh is 31.4 and 9.6 kWh has been made so far
- **THEN** today's tile reads 31.4 kWh expected and 9.6 kWh so far, with its bar about a third full

#### Scenario: A better day than forecast
- **WHEN** 34.2 kWh has been made against 31.4 expected
- **THEN** the bar is full and the tile reads 34.2 kWh so far

#### Scenario: Clear skies under a foggy forecast
- **WHEN** today's forecast code is 45 and the latest weather reading, 10 minutes old, is code 0 in daylight
- **THEN** today's tile reads Sunny now with the sun icon

#### Scenario: No recent reading
- **WHEN** the latest weather reading is 4 hours old
- **THEN** today's tile shows the forecast's sky, without "now"

### Requirement: The next three days
Each of the next three days SHALL show its name (Tomorrow, then the weekday), its date on wide screens, its expected kWh to a tenth, a bar of the expected kWh against the good day, and its sky as a label with an icon. The good day SHALL be the most solar made on any of the last 30 days before today, shown as a whole kWh, and a bar SHALL be full at or past it.

#### Scenario: Three days ahead
- **WHEN** the good day is 37 kWh and Thursday's expected kWh is 14.2
- **THEN** Thursday's tile reads 14.2 kWh, its bar about two fifths full, and the footnote names 37 kWh as the good day

#### Scenario: A good day stored with float noise
- **WHEN** the best of the last 30 days is stored as 43.29999923706055 kWh
- **THEN** the footnote reads "Bars run to a good day, 43 kWh"
