# Spec Delta

## ADDED Requirements

### Requirement: The batteries' drop through an outage
For each outage the section SHALL rebuild how far the Powerwalls' stored energy fell below where it stood at the outage's start, from its 5-minute intervals: energy out of the batteries counts in full, energy into them at 0.36/0.41 of itself, since charging loses some. The deepest point of that running total SHALL be the outage's drop, with the time it came.

#### Scenario: The longest outage
- **WHEN** the intervals of the outage that began February 4, 2024 at 2:51 PM fall at most 22.0 kWh below its start, deepest on February 6 at 8:05 AM
- **THEN** its drop is 22.0 kWh, with that time

#### Scenario: Solar charging in the day
- **WHEN** an outage's batteries give out 10 kWh overnight and take in 4.1 kWh from solar the next morning
- **THEN** the running total stands at 10 kWh before the morning and 6.4 kWh after it, and the drop is 10 kWh

### Requirement: An outage that started full
An outage SHALL count as starting full when, within 12 hours before its start, an interval shows solar exported while the batteries took none, and the batteries' net change from then to the start is under 1 kWh. For such an outage the section SHALL give the lowest charge, 100% less the drop at 0.36 kWh a percent, the kWh left, 36 kWh less the drop, and the hours left, the kWh left over the house's average draw in the hour before the lowest point.

#### Scenario: February 4, 2024
- **WHEN** the outage began right after an interval of solar exported with the batteries taking none, and its drop is 22.0 kWh, with the house drawing 1.27 kW in the hour before the lowest point
- **THEN** its lowest charge is about 39%, with about 14.0 kWh and about 11 hours left

#### Scenario: Started below full
- **WHEN** the last interval showing the batteries full came 2 hours before the outage, and they gave out 10 kWh in between
- **THEN** the outage gives its drop only, with no charge, kWh left or hours left

#### Scenario: No full interval before it
- **WHEN** no interval in the 12 hours before an outage shows the batteries full
- **THEN** the outage gives its drop only

### Requirement: A drop too small to show
An outage whose batteries fell less than 0.05 kWh SHALL give neither its drop nor its lowest charge, kWh left or hours left, since they would read 0.0 kWh or about 100%.

#### Scenario: A one-minute outage after a sunny afternoon
- **WHEN** an outage that started full lasted a minute and the batteries fell 0.02 kWh
- **THEN** its line gives only its weather

### Requirement: An outage with missing data
An outage with fewer than 80% of its 5-minute intervals stored SHALL give its drop marked as incomplete, and no lowest charge, kWh left or hours left.

#### Scenario: Half the intervals missing
- **WHEN** a 4-hour outage has 24 of its 48 intervals stored
- **THEN** it gives its drop marked as incomplete, and no charge

### Requirement: Rebuilt figures read as estimates
Every rebuilt battery figure SHALL be shown as approximate, like "~43%", and the section SHALL say in one line that they are worked out from the 5-minute energy data, about 36 kWh from full to empty, since Tesla keeps no history of the batteries' charge.

#### Scenario: An outage's row
- **WHEN** the outage of February 4, 2024 is listed
- **THEN** its lowest charge reads "~39%", and the section's note says how it was worked out

### Requirement: Closest call
The summary SHALL add a tile, Closest call, giving the lowest rebuilt charge of the chosen year's outages that started full, with the day it came, linking to that day on the Solar page. A year with no such outage SHALL show a dash.

#### Scenario: All time
- **WHEN** All time is shown, and the lowest rebuilt charge is about 39% on February 6, 2024
- **THEN** the tile reads ~39% and Feb 6, 2024

#### Scenario: A year without outages
- **WHEN** '26 - '27 is shown with no outages
- **THEN** there are no tiles, as the summary says there were no outages

### Requirement: Weather at an outage's start
Each outage SHALL give the weather around its start, from the weather samples between 3 hours before and 1 hour after it: thunderstorm, heavy rain or rain by the wettest code, and high wind at 40 km/h or more or windy at 25 km/h or more by the strongest wind, joined, or calm with neither. An outage without samples SHALL give none.

#### Scenario: A winter storm
- **WHEN** the samples around an outage's start include heavy rain and a 45 km/h wind
- **THEN** its weather reads Heavy rain, high wind

#### Scenario: A calm summer morning
- **WHEN** the samples around an outage's start show fog and a 13 km/h wind at most
- **THEN** its weather reads Calm

### Requirement: Storm days
The list SHALL group outages and blips that each start less than 6 hours after the one before ended, under a line giving the group's first day, its number of events, and its total time off the grid. Events with no neighbor that close SHALL be listed alone.

#### Scenario: February 4, 2024
- **WHEN** one-minute outages began at 12:30 and 2:27 PM and a 52-hour outage at 2:51 PM
- **THEN** the three are grouped under Feb 4, 2024, 3 events, 52 h 18 m off the grid

#### Scenario: A test nearby
- **WHEN** a test starts an hour after a blip
- **THEN** both are listed alone

### Requirement: Solar refilled the Powerwalls
An outage whose batteries gave out more than 36 kWh in all SHALL note that solar refilled them, since that is more than they hold.

#### Scenario: February 4, 2024
- **WHEN** the batteries gave out 42.4 kWh through the outage
- **THEN** its row notes that solar refilled the Powerwalls

### Requirement: Blips per year
Under the summary the section SHALL give the number of blips: for one true-up year, that year's count; for All time, each true-up year's count from '21 - '22 on, oldest first, a year without blips reading 0. It SHALL give the counts only.

#### Scenario: One year
- **WHEN** '22 - '23 is shown and it had 27 blips
- **THEN** the line reads 27 blips

#### Scenario: All time
- **WHEN** All time is shown and '24 - '25 had no blips
- **THEN** the line lists every true-up year from '21 - '22 with its count, '24 - '25 reading 0

## MODIFIED Requirements

### Requirement: Backup data
`GET /api/backup?year=` SHALL answer with status 200 and `{"data": {...}}` holding the summary and the events, newest first, each with its start, its end and its kind, for the year given as on the page (`24-25`, or `all`), this true-up year when it is missing or not one of those. Each outage SHALL also carry its rebuilt battery figures, its weather and whether solar refilled it, and the summary its closest call and blips per year.

#### Scenario: One year
- **WHEN** `/api/backup?year=23-24` is requested
- **THEN** it answers the summary and events of October 1, 2023 to September 30, 2024

#### Scenario: No events yet
- **WHEN** `/api/backup` is requested before any event is stored
- **THEN** it answers status 200 with zero outages and an empty list

#### Scenario: An outage's figures
- **WHEN** `/api/backup?year=23-24` is requested
- **THEN** the outage of February 4, 2024 carries a drop of 22.0 kWh, started full, about 39% at its lowest, heavy rain and high wind, and solar refilled
