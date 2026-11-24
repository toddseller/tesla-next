# Spec Delta

## MODIFIED Requirements

### Requirement: The timeline
Each ranking SHALL show its ten entries as small dots on a timeline from October 2021 to the end of the current year, each dot at its exact date and figure, with the years marked, the current year shaded and captioned "this year", and a figure axis spanning the ten entries' figures rather than starting at zero, its marks read as the entries' figures are (an outage's in days and hours). The #1 dot SHALL be ringed in Tesla red. Every entry's rank, #1 included, SHALL be set beside its dot, level with it. A rank SHALL move up or down, joined to its dot by a thin line, only when beside its dot it would cover another dot or another rank, and SHALL never sit close enough to another dot to read as that dot's: no other dot level with a rank within twice the distance of the rank's own. Dots that land on nearly the same spot SHALL share one label, their ranks in order separated by commas. Solar days SHALL be drawn in the solar color, exports in the grid color and outages in the Powerwall color. The timeline SHALL be described in words for assistive technology.

#### Scenario: Solar days
- **WHEN** the solar ranking is shown
- **THEN** its axis spans about 78 to 81 kWh, and the 2022 dots cluster in late May and June

#### Scenario: Outages
- **WHEN** the outage ranking is shown
- **THEN** its axis is marked in days and hours, as "20 h" and "1 d 16 h", each on one line, and its dots are in the Powerwall color

#### Scenario: Every runner-up numbered
- **WHEN** a ranking with ten entries is shown
- **THEN** the ranks read 1 to 10, the #1 dot is ringed, and the shaded band reads "this year"

#### Scenario: Two entries a day apart
- **WHEN** the solar ranking is shown and #4 (May 29, 2022, 79.9 kWh) and #5 (May 30, 2022, 79.7 kWh) are both visible
- **THEN** each rank sits level with its own dot, with no line, and neither covers the other's dot

#### Scenario: A rank near the top of the chart
- **WHEN** the export day ranking is shown and #1 sits at the top of its axis, a day before #2
- **THEN** the "1" sits level with the ringed dot, not beside #2's dot

#### Scenario: Entries on the same day
- **WHEN** the outage ranking is shown on a phone and #7, #8 and #10 land on nearly the same spot
- **THEN** one label reads "7, 8, 10", joined by a line to the dots if it had to move

#### Scenario: A rank between its dot and another
- **WHEN** the outage ranking is shown on a desktop and #8 and #10 sit level with #9, a few pixels to its right
- **THEN** the "9" goes on the left of its dot, not between it and #8
