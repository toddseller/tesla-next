# backup-history Specification

## Purpose
Shows the site's history of running off the grid: every backup event Tesla recorded since installation, which of them were real outages, and how long the house ran on its own system through them.

## Requirements

### Requirement: Each backup event has a kind
Each backup event anton-tesla-api-ws stores SHALL have one kind, checked in this order: commissioning when it starts on or before 2021-10-22 in the site's time (the day of the site's permission to operate), test when it overlaps a stretch of the site's state whose island status is `off_grid_intentional`, blip when it lasts under one minute, and outage otherwise.

#### Scenario: Install week
- **WHEN** an event starts 2021-10-12 06:25:52 PDT and lasts 52.4 hours
- **THEN** its kind is commissioning

#### Scenario: PTO day
- **WHEN** an event starts 2021-10-22 and lasts 11.3 hours
- **THEN** its kind is commissioning

#### Scenario: Go Off-Grid from the Tesla app
- **WHEN** an event runs 2026-11-09 08:36:41 to 08:37:45 PST and a stretch `off_grid_intentional` covers it
- **THEN** its kind is test

#### Scenario: A blip
- **WHEN** an event after PTO lasts 18 seconds with no intentional stretch over it
- **THEN** its kind is blip

#### Scenario: A storm outage
- **WHEN** an event starts 2024-02-04 14:51:38 PST and lasts 52.3 hours
- **THEN** its kind is outage

#### Scenario: Before site state was recorded
- **WHEN** an event from 2025 lasts 7 hours, and no stretch of the site's state covers it
- **THEN** its kind is outage

### Requirement: The Backup section's year
The Impact page SHALL show a Backup section with its own year picker, apart from the page's date range, while the page shows neither All time nor a true-up year, working as the page's range presets do: True-up year (the current true-up year, October 1 to September 30, named as the page's own True-up year preset so "This year" on the page means only the calendar year) and All time, the chosen one selected. On a true-up year, previous and next arrows SHALL step one true-up year, from 2021-22 to this one, the button naming the year shown. Below 640 pixels wide the presets SHALL be one menu between the arrows.

#### Scenario: Opening the page on 2026-11-09
- **WHEN** a visitor opens `/impact`
- **THEN** the section shows 2026-27, its presets read True-up year and All time with True-up year selected, and its next arrow is disabled

#### Scenario: No second This year
- **WHEN** a visitor opens `/impact`
- **THEN** the only button reading "This year" is the page's preset for January 1 to December 31

#### Scenario: On a phone
- **WHEN** a visitor opens `/impact` on 2026-11-09 on a 390-pixel-wide screen
- **THEN** the section's year is one "True-up year" menu button between the previous and next arrows, and its menu lists True-up year and All time

#### Scenario: Stepping back
- **WHEN** a visitor on 2026-11-09 presses the previous arrow twice
- **THEN** the section shows 2024-25, the selected button reads "2024-25", and the heading reads "Backup · 2024-25"

#### Scenario: The first year
- **WHEN** the section shows 2021-22
- **THEN** its previous arrow is disabled

### Requirement: The Backup year is in the address
The Backup section's year SHALL be in the address as `backup`, `24-25` for 2024-25 and `all` for All time; no `backup`, or any other value, SHALL show this year. Choosing SHALL replace the address without a new history entry and leave the page's range as it was. While the section follows the page's year, the addresses the page makes SHALL leave `backup` out.

#### Scenario: An earlier year picked
- **WHEN** a visitor picks 2023-24 from Earlier
- **THEN** the address gains `backup=23-24` with the range unchanged, and the Earlier button reads 2023-24 and is marked as selected

#### Scenario: All time
- **WHEN** a visitor picks All time
- **THEN** the address gains `backup=all` and the section covers every event since October 2021

#### Scenario: Another range
- **WHEN** the Impact page shows only today with `backup=24-25`
- **THEN** the Backup section still covers 2024-25

#### Scenario: Moving the page to All time
- **WHEN** the page shows this month with `backup=24-25` and the visitor picks the page's All time
- **THEN** the new address has no `backup`, and the section covers All time

#### Scenario: Leaving a followed year
- **WHEN** the page shows All time and the visitor picks the page's This month
- **THEN** the new address has no `backup`, and the section shows this true-up year with its picker

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

### Requirement: The full event list
Under the summary the section SHALL list every backup event of the chosen year, whatever its kind, newest first, each with its start date and time in the site's time zone, its duration, and its kind. Each date SHALL link to its day on the Solar page, as the Top Ten page links a day. A year without events SHALL say so.

#### Scenario: Every kind listed
- **WHEN** All time is shown and the history holds 94 events of all four kinds
- **THEN** all 94 are listed, the test of November 9, 2026 first, and each install-week event marked commissioning

#### Scenario: An event in its true-up year
- **WHEN** '23 - '24 is shown
- **THEN** the outage that began February 4, 2024 is listed, and the one that began December 14, 2024 is not

#### Scenario: A link to the day
- **WHEN** the visitor follows the event of February 4, 2024
- **THEN** the Solar page opens February 2024 with February 4 open

### Requirement: The energy during an outage
The energy the house used during outages SHALL be summed from the 5-minute intervals, each interval counted in proportion to the part of it inside an outage.

#### Scenario: An outage starting mid-interval
- **WHEN** an outage starts at 14:52:30 and the 14:50 interval's house used 120 Wh
- **THEN** 60 Wh of it counts

### Requirement: The section stays current
When the outages or the site's state change, or the page's live stream opens again after it was lost, the section SHALL reload without reloading the page. A failed reload SHALL keep what it showed.

#### Scenario: A new outage listed
- **WHEN** anton stores a new outage while the Impact page is open
- **THEN** it appears at the top of the list and in the summary, with no page reload

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

### Requirement: The section fits a phone
On a 375 pixel wide screen the section SHALL show its summary above its list, in one column, with no horizontal scrolling.

#### Scenario: Phone
- **WHEN** a viewer opens `/impact` on a 375-pixel-wide screen
- **THEN** every figure and every listed event is readable without scrolling sideways

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
- **THEN** the three are grouped under Feb 4, 2024, 3 events, 2 d 4 h off the grid

#### Scenario: A test nearby
- **WHEN** a test starts an hour after a blip
- **THEN** both are listed alone

### Requirement: Solar refilled the Powerwalls
An outage whose batteries gave out more than 36 kWh in all SHALL note that solar refilled them, since that is more than they hold.

#### Scenario: February 4, 2024
- **WHEN** the batteries gave out 42.4 kWh through the outage
- **THEN** its row notes that solar refilled the Powerwalls

### Requirement: Blips per year
Under the summary the section SHALL give the number of blips: for one true-up year, that year's count; for All time, each true-up year's count from 2021-22 on, oldest first, a year without blips reading 0. It SHALL give the counts only.

#### Scenario: One year
- **WHEN** 2022-23 is shown and it had 27 blips
- **THEN** the line reads 27 blips

#### Scenario: All time
- **WHEN** All time is shown and 2024-25 had no blips
- **THEN** the line lists every true-up year from 2021-22 with its count, 2024-25 reading 0

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

### Requirement: The Backup section follows the page's year
When the Impact page shows All time or a true-up year, October 1 to September 30, the current one included, the Backup section SHALL show that same span, whatever `backup` the address holds, and SHALL show no year picker or arrows, so the page and the section can't give two answers.

#### Scenario: The page on All time
- **WHEN** a visitor opens Impact's All time on 2026-11-24
- **THEN** the section covers every event since October 2021, its heading reads "Backup · All time", and it shows no picker or arrows

#### Scenario: The page on a past true-up year
- **WHEN** the page shows October 1, 2023 to September 30, 2024
- **THEN** the section covers 2023-24, its heading reads "Backup · 2023-24", and it shows no picker or arrows

#### Scenario: The page on this true-up year with another backup year in the address
- **WHEN** the page shows October 1, 2026 to September 30, 2027 with `backup=24-25` in the address
- **THEN** the section covers 2026-27

#### Scenario: The page on a calendar year
- **WHEN** the page shows January 1 to December 31, 2026
- **THEN** the section keeps its own year and its picker

### Requirement: Each event's bar is measured against a day
Each listed event's bar SHALL be its length as a share of one day, an event of a day or longer filling it, so a short event reads short whatever else its year holds.

#### Scenario: A year whose only event is a one-minute test
- **WHEN** '26 - '27 is shown with only the test of November 9, 2026, 1 minute 4 seconds long
- **THEN** its bar is 64 / 86,400 of the full width, not all of it

#### Scenario: A storm outage
- **WHEN** the outage that began February 4, 2024, 52.3 hours long, is listed
- **THEN** its bar fills the full width

#### Scenario: An hour
- **WHEN** a one-hour outage is listed
- **THEN** its bar is 1/24 of the full width

### Requirement: The Backup heading names its span
The Backup section's heading SHALL name what it shows, after a middle dot: the true-up year ("Backup · 2026-27", the current True-up year included), or "Backup · All time", so the section can't be read as covering another range than it does.

#### Scenario: Opening the page on 2026-11-09
- **WHEN** a visitor opens `/impact`
- **THEN** the section's heading reads "Backup · 2026-27"

#### Scenario: The page on All time
- **WHEN** a visitor opens Impact's All time on 2026-11-23 with no `backup` in the address
- **THEN** the section's heading reads "Backup · All time" under the page's All time figures

#### Scenario: All time picked
- **WHEN** a visitor picks All time in the section
- **THEN** its heading reads "Backup · All time", and no arrows show

### Requirement: Day links fit a finger
Each link to a day in the backup section (an event's date, a storm day's date, and the Longest and Closest call tiles' days) SHALL have a tap area at least 24 px tall and no wider than the link. The larger area SHALL change neither the link's text nor the height of its row or tile.

#### Scenario: An event's date on a phone
- **WHEN** a visitor on a 390 x 844 phone taps 2 px below an event's date
- **THEN** the Solar page opens that day, and the event's row is as tall as before

#### Scenario: The Longest tile
- **WHEN** a visitor reads the Longest tile's date
- **THEN** it has a tap area at least 24 px tall, and the tile is as tall as before
