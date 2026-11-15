## ADDED Requirements

### Requirement: Temperatures on the tiles
Today's tile SHALL show the latest weather reading's temperature in its lower right, across from the kWh so far, while that reading is less than 3 hours old. Each day ahead SHALL show its forecast high and low in its lower right, across from its sky, high first, like "64° / 52°". Temperatures SHALL be whole degrees Fahrenheit. A tile without its temperature, or without both a high and a low, SHALL show none.

#### Scenario: A cool morning
- **WHEN** the latest reading, 10 minutes old, has 14.6 °C
- **THEN** today's tile reads 58° in its lower right

#### Scenario: No recent reading
- **WHEN** the latest reading is 4 hours old
- **THEN** today's tile shows no temperature

#### Scenario: Tomorrow's high and low
- **WHEN** tomorrow's forecast has a high of 17.8 °C and a low of 11.1 °C
- **THEN** tomorrow's tile reads 64° / 52° across from its sky

#### Scenario: A day stored before the high and low were kept
- **WHEN** Friday's forecast has no high or low
- **THEN** Friday's tile shows its sky alone

## MODIFIED Requirements

### Requirement: The card on a phone
On a 375-pixel-wide screen the card SHALL fit with no horizontal scrolling: today's tile full width, then each of the next three days as one row of name and sky, bar, and expected kWh, with the day's high and low under its expected kWh.

#### Scenario: On a phone
- **WHEN** the Solar page is 375 pixels wide
- **THEN** the card shows today's tile and three day rows with no horizontal scrolling

#### Scenario: A day row's temperatures
- **WHEN** the Solar page is 375 pixels wide and tomorrow's high and low are 64° and 52°
- **THEN** tomorrow's row reads 64° / 52° under its expected kWh

### Requirement: Forecast data
`GET /api/forecast` SHALL answer status 200 with `{"data": {...}}` holding the card's figures for today, as the page renders them.

#### Scenario: Reloading the card
- **WHEN** the page asks `/api/forecast` after a totals event
- **THEN** it gets today's kWh so far, expected kWh and temperature now, today's hours, the next three days' expected kWh, skies, highs and lows and hours, the good day, and the newest forecast's fetch time
