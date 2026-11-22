## ADDED Requirements

### Requirement: Today's morning sentence
While the day is young, the Today chapter SHALL say above its chart when the sun rose and between which hours most of today's expected solar will come: the middle 80% of the forecast's expected kWh by hour, from the start of the hour by which 10% has come to the end of the hour before 90% has. It SHALL show until that window begins, and not at all without the forecast's hours.

#### Scenario: 8 AM
- **WHEN** at 8:00 AM the sun rose at 6:58 AM, 22.6 kWh is expected, and 10% of it comes by 10 AM and 90% by 3 PM
- **THEN** the chapter reads "Sunrise 6:58 AM. Most of today's 22.6 kWh is expected between 10 AM and 3 PM."

#### Scenario: Late morning
- **WHEN** it is 10:30 AM, after the window began
- **THEN** there is no morning sentence

#### Scenario: No hourly forecast
- **WHEN** the forecast card has no hours for today
- **THEN** there is no morning sentence
