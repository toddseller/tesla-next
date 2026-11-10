# solar-forecast Specification

## Purpose

The Solar page's forecast: how much solar today and the next three days should bring, from the stored sunlight forecast scaled by what the panels have made lately, with an honest word on how far off it can be.

## Requirements

### Requirement: The forecast card
The Solar page's range view SHALL show a "Solar forecast" card above "Solar by date range", served with the page, with a tile for today and one for each of the next three days, site time, and a footnote saying the figures are the forecast sunlight scaled by the panels' last 30 days, that bars run to a good day with its kWh, and that a forecast is usually within about 4 kWh, coastal fog being hardest to call. A day's own view SHALL NOT show the card.

#### Scenario: Opening the Solar page
- **WHEN** a viewer opens `/` on November 10, 2026
- **THEN** the first response holds the Solar forecast card, with Today, Tomorrow, Thursday and Friday, above "Solar by date range"

#### Scenario: A day's view
- **WHEN** a viewer opens `/?day=2026-11-09`
- **THEN** the page shows that day without the forecast card

### Requirement: Expected kWh
A day's expected kWh SHALL be its stored forecast sunlight times the scale: the solar kWh over the forecast sunlight summed across the last 30 days before today that have both a solar total and a stored forecast. It SHALL be shown as a whole kWh. With fewer than 7 such days there SHALL be no expected kWh.

#### Scenario: Scaling by the last 30 days
- **WHEN** the last 30 days made 900 kWh under 360 MJ/m² of forecast sunlight, and tomorrow's forecast is 13.2 MJ/m²
- **THEN** tomorrow's expected kWh is 33

#### Scenario: Too little history
- **WHEN** only 5 of the last 30 days have both a solar total and a stored forecast
- **THEN** no day has an expected kWh and the card says there is no forecast right now

### Requirement: Today's tile
Today's tile SHALL show today's expected kWh, today's solar so far in kWh to one decimal, a bar of the so-far against the expected (full at or past it), and today's sky, with today marked apart from the other days. Today's sky SHALL be the sky now when the latest stored weather reading is less than 3 hours old, and the forecast's otherwise. Without an expected kWh it SHALL show the kWh so far alone.

#### Scenario: Mid-morning
- **WHEN** today's expected kWh is 31 and 9.6 kWh has been made so far
- **THEN** today's tile reads 31 kWh expected and 9.6 kWh so far, with its bar about a third full

#### Scenario: A better day than forecast
- **WHEN** 34.2 kWh has been made against 31 expected
- **THEN** the bar is full and the tile reads 34.2 kWh so far

#### Scenario: Clear skies under a foggy forecast
- **WHEN** today's forecast code is 45 and the latest weather reading, 10 minutes old, is code 0 in daylight
- **THEN** today's tile reads Sunny now with the sun icon

#### Scenario: No recent reading
- **WHEN** the latest weather reading is 4 hours old
- **THEN** today's tile shows the forecast's sky, without "now"

### Requirement: The next three days
Each of the next three days SHALL show its name (Tomorrow, then the weekday), its date on wide screens, its expected kWh, a bar of the expected kWh against the good day, and its sky as a label with an icon. The good day SHALL be the most solar made on any of the last 30 days before today, and a bar SHALL be full at or past it.

#### Scenario: Three days ahead
- **WHEN** the good day is 37 kWh and Thursday's expected kWh is 14
- **THEN** Thursday's bar is about two fifths full and the footnote names 37 kWh as the good day

### Requirement: The sky
A forecast day's sky SHALL follow its daylight weather code, the most severe weather between sunrise and sunset, or its daily code when it has none: 0 Sunny, 1 and 2 Partly cloudy, 3 Cloudy, 45 and 48 Fog likely, 51 to 67 and 80 to 82 Rain, 71 to 77, 85 and 86 Snow, 95 to 99 Thunderstorms, each with its own icon. A code outside these SHALL show Cloudy.

#### Scenario: Morning fog
- **WHEN** Thursday's daylight weather code is 45
- **THEN** Thursday reads Fog likely with the fog icon

#### Scenario: Fog only overnight
- **WHEN** Friday's daily code is 45 and its daylight code is 1
- **THEN** Friday reads Partly cloudy

#### Scenario: A day stored before the daylight code
- **WHEN** a day has a daily code of 3 and no daylight code
- **THEN** it reads Cloudy

### Requirement: The sky now
Today's sky now SHALL use the sky's groups with "now" after them, and Fog for 45 and 48. Between sunset and sunrise it SHALL read Clear for 0 and Partly cloudy for 1 and 2, with moon icons.

#### Scenario: Fog now
- **WHEN** the latest reading, in daylight, is code 45
- **THEN** today's tile reads Fog now

#### Scenario: A clear night
- **WHEN** the latest reading is code 0 at 9 PM
- **THEN** today's tile reads Clear now with the moon icon

### Requirement: An old forecast
When the card shows the days ahead and the newest stored forecast for today or the days ahead was fetched more than 6 hours ago, the card SHALL say "Forecast from" and that time beside its title. Otherwise the card SHALL show no time.

#### Scenario: The fetch has been failing
- **WHEN** it is 11:00 AM and the newest forecast was fetched at 4:15 AM
- **THEN** the card's title reads Solar forecast with "Forecast from 4:15 AM" beside it

#### Scenario: A fresh forecast
- **WHEN** the newest forecast was fetched 40 minutes ago
- **THEN** the card shows no time

### Requirement: No forecast right now
When no forecast for the days ahead was fetched in the last 24 hours, or there is no expected kWh, the card SHALL say "No forecast right now" in place of the three days and show no expected kWh for today, no forecast time and no footnote sentence about the bars, while today's tile still shows the kWh so far.

#### Scenario: anton hasn't fetched for a day
- **WHEN** the newest forecast was fetched 26 hours ago
- **THEN** the card reads No forecast right now with no "Forecast from" time, and today's tile shows only the kWh so far

### Requirement: The card stays current
The card SHALL reload when a totals event arrives for today and when the live stream reopens, keeping what it shows when a reload fails.

#### Scenario: More sun comes in
- **WHEN** the card shows 9.6 kWh so far and a totals event for today arrives
- **THEN** the card reloads and shows the new kWh so far, with no page reload

### Requirement: The card on a phone
On a 375-pixel-wide screen the card SHALL fit with no horizontal scrolling: today's tile full width, then each of the next three days as one row of name and sky, bar, and expected kWh.

#### Scenario: On a phone
- **WHEN** the Solar page is 375 pixels wide
- **THEN** the card shows today's tile and three day rows with no horizontal scrolling

### Requirement: Forecast data
`GET /api/forecast` SHALL answer status 200 with `{"data": {...}}` holding the card's figures for today, as the page renders them.

#### Scenario: Reloading the card
- **WHEN** the page asks `/api/forecast` after a totals event
- **THEN** it gets today's kWh so far and expected kWh, the next three days' expected kWh and skies, the good day, and the newest forecast's fetch time

### Requirement: Today by hour
Under the day tiles the card SHALL show "Today by hour", full width: one column per hour of today, site time, from the first to the last hour with forecast sunlight or at least 0.05 kWh made. Each column SHALL show a faded bar up to the hour's expected kWh and, in front of it, a solid bar of the kWh made in it so far, with a tick at the expected kWh where the made kWh is higher. A kWh axis and hour labels SHALL frame the columns, with a legend.

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
An hour's expected kWh SHALL be its forecast sunlight times its hour of the day's scale: the kWh that hour of the day made over the 30 days before the hour's own day, divided by its forecast sunlight over the same days, counting only hours with both. An hour of the day with no forecast sunlight in those days SHALL expect 0 kWh.

#### Scenario: Scaling 10 AM
- **WHEN** the 10 to 11 AM hours of the last 30 days made 128 kWh under 15,300 W/m² of forecast sunlight, and today's 10 AM forecasts 532 W/m²
- **THEN** 10 AM today expects about 4.5 kWh

#### Scenario: A past day's hour
- **WHEN** the 11 AM to noon hours of March 17 to April 15, 2026 give a scale, and April 16's 11 AM forecasts its sunlight
- **THEN** April 16's 11 AM expects that sunlight times the scale of the 30 days before April 16, not of the 30 days before today
### Requirement: Made against expected by now
Once today's first shown hour has started, the panel SHALL say how much today has made by the end of the latest stored interval and how much was expected by then: the expected kWh of every hour already over, plus the share of the current hour gone by. After the last shown hour, once the sun has set, it SHALL compare the day's made and expected kWh instead.

#### Scenario: Early afternoon
- **WHEN** the latest interval ends at 1:40 PM, 23.9 kWh has been made, the hours to 1 PM expected 23.8 kWh and 1 to 2 PM expects 4.1
- **THEN** the panel reads 23.9 kWh made by 1:40 PM, against 26.5 expected by now

#### Scenario: Before sunrise
- **WHEN** it is 6:15 AM and the first shown hour starts at 7
- **THEN** the panel shows the faded bars and no made-against-expected line

#### Scenario: Sun still up after the last forecast hour
- **WHEN** the last hour with forecast sunlight is 3 PM and the latest interval ends at 4:05 PM, before sunset
- **THEN** the panel still reads made by 4:05 PM, against expected by now

### Requirement: An hour's numbers
Pointing at an hour's column, or touching it, SHALL show the hour, like "9–10 AM", with its expected kWh, and its made kWh once the hour has started, each to one decimal.

#### Scenario: Touching 9 AM
- **WHEN** a viewer touches the 9 AM column after 10 AM
- **THEN** it shows 9–10 AM, made 2.5 kWh and expected 4.3 kWh

### Requirement: Without an hourly forecast
The card SHALL leave out Today by hour when no hour of today has a stored forecast, or when fewer than 7 of the 30 days before today have both forecast hours and intervals; the rest of the card SHALL show as before.

#### Scenario: A new install
- **WHEN** the forecast hours go back only 5 days
- **THEN** the card shows its tiles without Today by hour
