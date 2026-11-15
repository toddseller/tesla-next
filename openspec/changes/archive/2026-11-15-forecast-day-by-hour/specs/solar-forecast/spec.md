## ADDED Requirements

### Requirement: Choosing the day
When the card shows Today by hour, each of the next three days with forecast hours SHALL be a button that shows its hours in the chart under the tiles, and today's tile SHALL be one too while any day ahead is; Today is chosen when the page opens. The chosen day ahead SHALL be marked by a raised background; today's tile SHALL keep its outline and never change, so with Today chosen no tile is raised. A tile SHALL NOT change on hover.

#### Scenario: Choosing Thursday
- **WHEN** a viewer presses Thursday's tile
- **THEN** Thursday's tile is raised and pressed, and the chart shows Thursday's hours

#### Scenario: Back to Today
- **WHEN** Thursday is chosen and the viewer presses Today's tile
- **THEN** no tile is raised, Today's tile keeps its outline, and the chart shows Today by hour

#### Scenario: Opening the Solar page
- **WHEN** a viewer opens `/`
- **THEN** the chart shows Today by hour and no tile is raised

#### Scenario: No day ahead to choose
- **WHEN** the card shows Today by hour and "No forecast right now" in place of the days ahead
- **THEN** today's tile is not a button

#### Scenario: On a phone
- **WHEN** the Solar page is 375 pixels wide and the viewer taps Friday's row
- **THEN** Friday's row is raised and the chart shows Friday's hours, with no horizontal scrolling

### Requirement: A day ahead by hour
With a day ahead chosen, the chart SHALL be titled with its name as its tile names it, like "Tomorrow by hour" or "Thursday by hour", with its date beside the title, and SHALL show one faded bar per hour up to the hour's expected kWh, from the first to the last hour with forecast sunlight. It SHALL show no made kWh, no made-against-expected line and no ticks, and its legend SHALL name only Expected.

#### Scenario: Thursday's hours
- **WHEN** Thursday, November 12, is chosen and its 10 AM expects 2.8 kWh
- **THEN** the chart reads Thursday by hour with Thu, Nov 12 beside it, and 10 AM shows a faded bar reaching 2.8 kWh and no solid bar

#### Scenario: Touching an hour ahead
- **WHEN** a viewer touches Thursday's 10 AM column
- **THEN** it shows 10–11 AM with expected 2.8 kWh and no made kWh

### Requirement: The choice through a reload
When the card reloads, the chosen day SHALL stay chosen while it is still one of the next three days; otherwise the chart SHALL show Today.

#### Scenario: A totals event
- **WHEN** Thursday is chosen and a totals event for today reloads the card
- **THEN** Thursday stays chosen and its chart stays on screen

#### Scenario: Past midnight
- **WHEN** Tomorrow is chosen on a page left open past midnight and the card reloads
- **THEN** the chart shows Today by hour for the new day, and no tile is raised

## MODIFIED Requirements

### Requirement: The next three days
Each of the next three days SHALL show its name (Tomorrow, then the weekday), its date on wide screens, its expected kWh, a bar of the expected kWh against the good day, and its sky as a label with an icon. The good day SHALL be the most solar made on any of the last 30 days before today, shown as a whole kWh, and a bar SHALL be full at or past it.

#### Scenario: Three days ahead
- **WHEN** the good day is 37 kWh and Thursday's expected kWh is 14
- **THEN** Thursday's bar is about two fifths full and the footnote names 37 kWh as the good day

#### Scenario: A good day stored with float noise
- **WHEN** the best of the last 30 days is stored as 43.29999923706055 kWh
- **THEN** the footnote reads "Bars run to a good day, 43 kWh"

### Requirement: Today by hour
With Today chosen, under the day tiles the card SHALL show "Today by hour", full width: one column per hour of today, site time, from the first to the last hour with forecast sunlight or at least 0.05 kWh made. Each column SHALL show a faded bar up to the hour's expected kWh and, in front of it, a solid bar of the kWh made in it so far, with a tick at the expected kWh where the made kWh is higher. A kWh axis and hour labels SHALL frame the columns, with a legend.

#### Scenario: A foggy morning
- **WHEN** 9 to 10 AM made 2.5 kWh against 4.3 expected
- **THEN** its solid bar reaches 2.5 kWh in front of a faded bar reaching 4.3, with no tick

#### Scenario: Beating the forecast
- **WHEN** 11 AM to noon made 5.9 kWh against 5.3 expected
- **THEN** its solid bar reaches 5.9 kWh with a tick at 5.3

#### Scenario: The hours ahead
- **WHEN** it is 1:40 PM and 2 to 3 PM expects 3.1 kWh
- **THEN** 2 PM shows only a faded bar reaching 3.1, and 1 PM a solid bar of its kWh so far in front of its faded bar

#### Scenario: On a phone
- **WHEN** the Solar page is 375 pixels wide
- **THEN** the panel shows every hour's column with no horizontal scrolling

### Requirement: An hour's expected kWh
An hour's expected kWh SHALL be its forecast sunlight times its hour of the day's scale: the kWh that hour of the day made over the 30 days before the hour's own day, divided by its forecast sunlight over the same days, counting only hours with both. An hour of the next three days SHALL take its scale from the 30 days before today instead. An hour of the day with no forecast sunlight in those days SHALL expect 0 kWh.

#### Scenario: Scaling 10 AM
- **WHEN** the 10 to 11 AM hours of the last 30 days made 128 kWh under 15,300 W/m² of forecast sunlight, and today's 10 AM forecasts 532 W/m²
- **THEN** 10 AM today expects about 4.5 kWh

#### Scenario: A past day's hour
- **WHEN** the 11 AM to noon hours of March 17 to April 15, 2026 give a scale, and April 16's 11 AM forecasts its sunlight
- **THEN** April 16's 11 AM expects that sunlight times the scale of the 30 days before April 16, not of the 30 days before today

#### Scenario: A day ahead's hour
- **WHEN** it is November 10 and Thursday, November 12's 10 AM forecasts 330 W/m²
- **THEN** it expects 330 W/m² times 10 AM's scale from October 11 to November 9, the same scale as today's 10 AM

### Requirement: Forecast data
`GET /api/forecast` SHALL answer status 200 with `{"data": {...}}` holding the card's figures for today, as the page renders them.

#### Scenario: Reloading the card
- **WHEN** the page asks `/api/forecast` after a totals event
- **THEN** it gets today's kWh so far and expected kWh, today's hours, the next three days' expected kWh, skies and hours, the good day, and the newest forecast's fetch time

### Requirement: Without an hourly forecast
The card SHALL leave out Today by hour when no hour of today has a stored forecast, or when fewer than 7 of the 30 days before today have both forecast hours and intervals; the rest of the card SHALL show as before, with no tile a button. A day ahead with no stored forecast hour SHALL NOT be a button.

#### Scenario: A new install
- **WHEN** the forecast hours go back only 5 days
- **THEN** the card shows its tiles without Today by hour, and pressing a tile does nothing

#### Scenario: Friday not yet fetched by the hour
- **WHEN** Tomorrow and Thursday have forecast hours and Friday has none
- **THEN** Tomorrow and Thursday are buttons and Friday's tile is not
