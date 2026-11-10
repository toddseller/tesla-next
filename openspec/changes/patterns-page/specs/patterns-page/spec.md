# Spec Delta

## Purpose

The Patterns page: how the house and the Powerwalls run over the day, the months and the years, shown as the house's always-on load, when in the day it uses power, and the Powerwalls' use, so a change in any of them stands out.

## ADDED Requirements

### Requirement: The Patterns page
The site SHALL serve a Patterns page at `/patterns`, headed "Patterns", with an Always-on load section, then a When the house uses power section, then a Powerwall use section. The page SHALL be served with its figures in the first response, worked out when the page is requested; it SHALL NOT update while open.

#### Scenario: Opening the page
- **WHEN** a viewer opens `/patterns`
- **THEN** the response holds the Always-on load, When the house uses power and Powerwall use sections, in that order, with their figures

#### Scenario: A night passes while the page is open
- **WHEN** the page stays open past 5 AM
- **THEN** it keeps the figures it was served with until it is reloaded

### Requirement: A night's always-on load
A night SHALL be the 48 five-minute intervals starting from 1:00 to 4:55 AM, site time, on one day. A night SHALL count only when at least 40 of its intervals are stored. Its always-on load SHALL be the lowest of its intervals' house use (from the grid, solar and the Powerwalls) as an average in watts.

#### Scenario: A quiet night with a car charging
- **WHEN** the house uses 70 Wh in its lowest 5 minutes between 1 and 5 AM and a car charges from 2 to 4 AM
- **THEN** that night's always-on load is 840 W

#### Scenario: A night with gaps
- **WHEN** only 36 of a night's intervals are stored, as on the night the clocks go forward
- **THEN** the night doesn't count

### Requirement: A month's always-on load
A month's always-on load SHALL be the middle of its counted nights' always-on loads, the lower of the two middle ones when there is an even number. A month with no counted night SHALL have none.

#### Scenario: Four nights
- **WHEN** a month's counted nights are 300, 840, 864 and 900 W
- **THEN** the month's always-on load is 840 W

#### Scenario: No counted nights
- **WHEN** no night in a month counts
- **THEN** the month has no always-on load and is left out of the figures and charts

### Requirement: The latest month's figures
The Always-on load section SHALL show the always-on load of the latest month with one, labelled "<Month> so far" when it is the current month and "<Month> <year>" otherwise; the same month a year earlier, labelled "<Month> <year>"; and the difference between the two in kWh a day, signed and rounded to a whole kWh. Without a figure a year earlier, only the first SHALL show.

#### Scenario: This November
- **WHEN** it is November 10, 2026, November 2026's always-on load is 864 W and November 2025's is 276 W
- **THEN** the section shows "November so far" 864 W, "November 2025" 276 W, and a difference of +14 kWh a day

#### Scenario: Lower than a year earlier
- **WHEN** the latest month's always-on load is 300 W and a year earlier it was 720 W
- **THEN** the difference reads -10 kWh a day

#### Scenario: The first night of a month
- **WHEN** it is 3 AM on December 1, so no December night counts yet
- **THEN** the figures are November's, labelled "November 2026"

### Requirement: The same month in each year
The Always-on load section SHALL show, headed "<Month> in each year", a row for each year with an always-on load in the latest month's calendar month, oldest first: the year, a bar and the watts. The bars SHALL share one scale from zero, and the latest year's row SHALL be in the home color with the others gray.

#### Scenario: Six Novembers
- **WHEN** the latest month is November 2026 and every November from 2021 has an always-on load
- **THEN** there are six rows, 2021 to 2026, and only 2026's is in the home color

#### Scenario: A year without that month
- **WHEN** no night counted in November 2023
- **THEN** there is no 2023 row

### Requirement: The last 12 months
The Always-on load section SHALL show, headed "The last 12 months", a bar in the home color for each of the latest month and the 11 before it, oldest on the left, each with a mark at the same month's always-on load a year earlier. A month without an always-on load SHALL have no bar, and a month without one a year earlier no mark. Each bar's month, watts and the year-earlier watts SHALL be available to assistive technology.

#### Scenario: The change shows
- **WHEN** September 2026 is 840 W and September 2025 was 264 W
- **THEN** September's bar ends far above its mark, and a screen reader announces September 2026 840 W, a year earlier 264 W

#### Scenario: No year-earlier figure
- **WHEN** the system's first month with an always-on load is less than a year before the latest month
- **THEN** the months before that first anniversary have bars but no marks

### Requirement: Powerwall use by year
For each calendar year from the first stored interval to this year, the Powerwall use section SHALL show the energy out of the Powerwalls in kWh as a bar and figure, the cycles as that energy over 40.5 kWh rounded to a whole number, and the round trip as energy out over energy into them, from solar and the grid, as a whole percentage. The first year SHALL say from which day when it starts after January 1, and this year SHALL say "so far".

#### Scenario: A full year
- **WHEN** 3,030 kWh came out of the Powerwalls in 2025 and 3,662 kWh went in
- **THEN** the 2025 row shows 3,030 kWh, 75 cycles and an 83% round trip

#### Scenario: The first year
- **WHEN** the first stored interval is on October 10, 2021
- **THEN** the 2021 row says "from Oct 10"

#### Scenario: Nothing went in
- **WHEN** no energy went into the Powerwalls in a year
- **THEN** that year's round trip shows a dash

### Requirement: This year's Powerwall figures
Above the rows, the Powerwall use section SHALL show this year's cycles with the cycles since the first year, this year's round trip, and this year's energy out with the energy out since the first year, and SHALL say that a cycle is 40.5 kWh out, the three Powerwalls' rated size.

#### Scenario: November 2026
- **WHEN** 4,416 kWh has come out in 2026 and 20,715 kWh since October 2021
- **THEN** the figures read 109 cycles in 2026 and 511 since 2021, and 4,416 kWh in 2026 and 20,715 kWh since 2021

### Requirement: Nothing to show yet
When no night counts, the Always-on load section SHALL say there are no overnight readings yet in place of its figures and charts. When no interval is stored, the Powerwall use section SHALL say there is no Powerwall data yet in place of its figures and rows.

#### Scenario: An empty database
- **WHEN** `/patterns` is opened and no interval is stored
- **THEN** both sections show their message and the page has no error

### Requirement: The Patterns page fits a phone
On a 375-pixel-wide screen the Patterns page SHALL fit with no horizontal scrolling: the latest month's three figures in one row, the year rows and the 12 bars full width with one-letter month labels, the two use grids stacked with all 24 hours of each row showing, and each Powerwall year as a stacked row of year and kWh, bar, then cycles and round trip.

#### Scenario: On a phone
- **WHEN** the page is 375 pixels wide
- **THEN** every section fits with no horizontal scrolling, the 12 month bars all show, and both use grids show every hour

### Requirement: An hour's house use in a month
An hour's house use in a month SHALL be the average, over the month's stored five-minute intervals starting in that hour of the day, site time, of the house's use from the grid, solar and the Powerwalls, in watts. An hour of a month with no stored interval SHALL have none.

#### Scenario: Midnight in September
- **WHEN** September's intervals starting from 12:00 to 12:55 AM average 200 Wh of house use
- **THEN** September's 12 AM house use is 2,400 W, whatever share came from solar, the Powerwalls or the grid

#### Scenario: The first hour of a month
- **WHEN** it is 12:30 AM on December 1
- **THEN** December has house use for 12 AM only, and its other 23 hours have none

### Requirement: When the house uses power
The When the house uses power section SHALL show two grids, "The last 12 months" (this month, site time, and the 11 before it) and "The 12 months before", each a row per month, oldest first, labelled with the month and year, and a square for each hour of the day from 12 AM to 11 PM, with the hours labelled at 12 AM, 6 AM, noon and 6 PM. Both grids SHALL use one scale.

#### Scenario: November 2026
- **WHEN** it is November 10, 2026
- **THEN** the first grid's rows run from December 2025 to November 2026 and the second's from December 2024 to November 2025

#### Scenario: The shift shows
- **WHEN** September 2025's 1 PM house use was 3,731 W and its 1 AM 1,781 W, and September 2026's are 1,852 W and 6,153 W
- **THEN** September 2025's 1 PM square and September 2026's 1 AM square are the deepest step, and September 2025's 1 AM and September 2026's 1 PM squares are the 1.5 to 2 kW step

### Requirement: The use steps
Each square SHALL take one of seven steps of one blue, from palest to deepest: under 1 kW, 1 to 1.5 kW, 1.5 to 2 kW, 2 to 2.5 kW, 2.5 to 3 kW, 3 to 3.5 kW, and 3.5 kW and up. A key SHALL show the seven steps in order, labelled 0.5, 1, 1.5, 2, 2.5, 3 and 3.5+ kW. A square without house use SHALL be empty, unlike any step.

#### Scenario: The edges of a step
- **WHEN** two hours' house use is 999 W and 1,000 W
- **THEN** the first is the palest step and the second the next

#### Scenario: An hour without readings
- **WHEN** an hour of a month has no house use
- **THEN** its square is empty, not the palest step

### Requirement: Each square's value for assistive technology
Each square's month, hour and house use in kW to one decimal SHALL be available to assistive technology, as a table per grid with the months as row headers and the hours as column headers.

#### Scenario: A screen reader on a square
- **WHEN** a screen reader reaches October 2026's 12 AM square
- **THEN** it announces October 2026, 12 AM and 5.5 kW

### Requirement: No house use yet
When no interval is stored in either grid's months, the When the house uses power section SHALL say there are no readings yet in place of its grids.

#### Scenario: An empty database
- **WHEN** `/patterns` is opened and no interval is stored
- **THEN** the section shows its message and the page has no error
