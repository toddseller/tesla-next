# Spec Delta

## MODIFIED Requirements

### Requirement: The timeline
Each ranking SHALL show its ten entries as dots on a timeline from October 2021 to the end of the current year, with the years marked, the current year shaded and captioned "this year", and a figure axis spanning the ten entries' figures rather than starting at zero, its marks read as the entries' figures are (an outage's in days and hours). The #1 dot SHALL be ringed in Tesla red, and the #2 to #10 dots SHALL carry their rank. Solar days SHALL be drawn in the solar color, exports in the grid color and outages in the Powerwall color. The timeline SHALL be described in words for assistive technology.

#### Scenario: Solar days
- **WHEN** the solar ranking is shown
- **THEN** its axis spans about 78 to 81 kWh, and the 2022 dots cluster in late May and June

#### Scenario: Outages
- **WHEN** the outage ranking is shown
- **THEN** its axis is marked in days and hours, as "20 h" and "1 d 16 h", each on one line, and its dots are in the Powerwall color

#### Scenario: Every runner-up numbered
- **WHEN** a ranking with ten entries is shown
- **THEN** the dots read 2 to 10, the #1 dot is ringed, and the shaded band reads "this year"
