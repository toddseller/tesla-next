## MODIFIED Requirements

### Requirement: The outage summary
The section SHALL give, for the outages in the chosen year: their number, their total time, the longest with its date, and the energy the house used during them, split into what came from the Powerwalls and what came from solar. A year without outages SHALL say there were none, and when its list isn't empty, name what it holds: "No outages, only a Go Off-Grid test."

#### Scenario: All time on 2026-11-09
- **WHEN** All time is shown on 2026-11-09, with 35 outages of 156.9 hours, the longest 52.3 hours from February 4, 2024, through which the house used 206.9 kWh, 130.0 from the Powerwalls and 76.3 from solar
- **THEN** it reads 35 outages, 6 d 12 h off the grid, the longest 2 d 4 h on Feb 4, 2024, and 206.9 kWh, Powerwalls 130.0 · Solar 76.3

#### Scenario: A quiet year
- **WHEN** '26 - '27 is shown on 2026-11-09, its only event the test of that morning
- **THEN** the summary reads "No outages, only a Go Off-Grid test.", and the list shows the test

#### Scenario: Blips and a test
- **WHEN** a year without outages lists three blips and one test
- **THEN** the summary reads "No outages, only 3 blips and a Go Off-Grid test."

#### Scenario: Nothing at all
- **WHEN** a year has no events
- **THEN** the summary reads "No outages."

### Requirement: How a length of time reads
Every length of time the section gives off the grid (the summary's total and longest, each storm day's total and each event's duration) SHALL read in days and hours when it is a day or more, and otherwise in hours and minutes, minutes and seconds, or seconds, each part rounded down. An event's duration SHALL set its figures in mono and its units in the row's sans.

#### Scenario: The day boundary
- **WHEN** one event lasts 23 hours 59 minutes 59 seconds and another exactly 24 hours
- **THEN** the first reads 23 h 59 m and the second 1 d 0 h

#### Scenario: Minutes dropped past a day
- **WHEN** an outage lasts 52 hours 16 minutes 12 seconds
- **THEN** its row reads 2 d 4 h

#### Scenario: Under an hour
- **WHEN** an outage lasts 4 minutes 30 seconds, and a blip 42 seconds
- **THEN** they read 4 m 30 s and 42 s

#### Scenario: An event's figures and units
- **WHEN** a test lasted 1 minute 4 seconds
- **THEN** its row reads 1 m 4 s with "1" and "4" in mono and "m" and "s" in sans
