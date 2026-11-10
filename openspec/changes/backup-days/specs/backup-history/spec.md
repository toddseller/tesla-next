## ADDED Requirements

### Requirement: How a length of time reads
Every length of time the section gives off the grid (the summary's total and longest, each storm day's total and each event's duration) SHALL read in days and hours when it is a day or more, and otherwise in hours and minutes, minutes and seconds, or seconds, each part rounded down.

#### Scenario: The day boundary
- **WHEN** one event lasts 23 hours 59 minutes 59 seconds and another exactly 24 hours
- **THEN** the first reads 23 h 59 m and the second 1 d 0 h

#### Scenario: Minutes dropped past a day
- **WHEN** an outage lasts 52 hours 16 minutes 12 seconds
- **THEN** its row reads 2 d 4 h

#### Scenario: Under an hour
- **WHEN** an outage lasts 4 minutes 30 seconds, and a blip 42 seconds
- **THEN** they read 4 m 30 s and 42 s

## MODIFIED Requirements

### Requirement: The outage summary
The section SHALL give, for the outages in the chosen year: their number, their total time, the longest with its date, and the energy the house used during them, split into what came from the Powerwalls and what came from solar. A year without outages SHALL say there were none.

#### Scenario: All time on 2026-11-09
- **WHEN** All time is shown on 2026-11-09, with 35 outages of 156.9 hours, the longest 52.3 hours from February 4, 2024, through which the house used 206.9 kWh, 130.0 from the Powerwalls and 76.3 from solar
- **THEN** it reads 35 outages, 6 d 12 h off the grid, the longest 2 d 4 h on Feb 4, 2024, and 206.9 kWh, Powerwalls 130.0 · Solar 76.3

#### Scenario: A quiet year
- **WHEN** '26 - '27 is shown on 2026-11-09, its only event the test of that morning
- **THEN** the summary says there were no outages, and the list shows the test

### Requirement: Storm days
The list SHALL group outages and blips that each start less than 6 hours after the one before ended, under a line giving the group's first day, its number of events, and its total time off the grid. Events with no neighbor that close SHALL be listed alone.

#### Scenario: February 4, 2024
- **WHEN** one-minute outages began at 12:30 and 2:27 PM and a 52-hour outage at 2:51 PM
- **THEN** the three are grouped under Feb 4, 2024, 3 events, 2 d 4 h off the grid

#### Scenario: A test nearby
- **WHEN** a test starts an hour after a blip
- **THEN** both are listed alone
