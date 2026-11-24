# impact-report Specification

## Purpose
Shows how much of the home's energy over a chosen date range came from solar and the Powerwall rather than the grid, and how solar generation compares with home use, with the range in the page's address.

## Requirements

### Requirement: The range is in the address
The Impact page (`/impact`) SHALL show the range given by its `start` and `end` parameters, each a `YYYY-MM-DD` date in the site's time zone, rendered on the server with its data. Each tab SHALL keep its own range, and opening the same address SHALL show the same range.

#### Scenario: A shared link
- **WHEN** a visitor opens `/impact?start=2026-10-18&end=2026-10-18`
- **THEN** the page shows October 18, 2026, with its figures in the first response

### Requirement: Default and invalid ranges
When `start` and `end` are both missing, the page SHALL show today in the site's time zone, unless today's solar so far reads 0.0 kWh, when it SHALL show yesterday, so a visitor early in the day sees a whole day rather than nothing. When either is given but `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL redirect to its address without `start` and `end`, keeping its other parameters and adding `unshown=1`, so the address names the range shown and the page knows to say so. An address with `unshown=1` SHALL show one line under the page's title naming the range it shows instead, as the browser tab's title names it ("That link asked for dates the site doesn't have, so this shows Nov 8, 2026."), and SHALL then remove `unshown` from the address without reloading, so a reload or a copied link shows the page without the line.

#### Scenario: No range
- **WHEN** a visitor opens `/impact` on 2026-11-08 after the panels have made 0.4 kWh
- **THEN** the page shows November 8, 2026, with no line about the link

#### Scenario: Before any solar
- **WHEN** a visitor opens `/impact` at 7:00 AM on 2026-11-08, before the panels have made a tenth of a kWh
- **THEN** the page shows November 7, 2026, and choosing Today in the presets shows November 8

#### Scenario: A malformed range
- **WHEN** a visitor opens `/impact?start=nope&end=2026-10-31&backup=25-26` on 2026-11-08 after the panels have made 0.4 kWh
- **THEN** the visitor is redirected to `/impact?backup=25-26&unshown=1`, which shows November 8, 2026 with "That link asked for dates the site doesn't have, so this shows Nov 8, 2026." under the title

#### Scenario: The line leaves the address
- **WHEN** the page has shown the line for `/impact?backup=25-26&unshown=1`
- **THEN** the address reads `/impact?backup=25-26`, and reloading it shows the page without the line

#### Scenario: Late in the evening
- **WHEN** a visitor in New York opens `/impact` at 1:00 AM on 2026-11-09 there, which is still November 8 at the site, after the day's solar
- **THEN** the page shows November 8, 2026

### Requirement: Range presets
The page SHALL offer six presets, each changing the address to its range, all from today in the site's time zone: Today, This week (Sunday to Saturday), This month, This year (January 1 to December 31), True-up year (October 1 to September 30 of the true-up year containing today) and All time (the site's first day of service, 2021-10-10, to today). A preset matching the shown range SHALL be marked as selected.

#### Scenario: This week
- **WHEN** a visitor picks This week on Sunday 2026-11-08
- **THEN** the page shows 2026-11-08 to 2026-11-14, and This week is marked as selected

#### Scenario: This week on a Wednesday
- **WHEN** a visitor picks This week on 2026-11-11
- **THEN** the page shows 2026-11-08 to 2026-11-14

#### Scenario: True-up year in November
- **WHEN** a visitor picks True-up year on 2026-11-08
- **THEN** the page shows 2026-10-01 to 2027-09-30

#### Scenario: All time
- **WHEN** a visitor picks All time on 2026-11-09
- **THEN** the address becomes `/impact?start=2021-10-10&end=2026-11-09`, the page shows that range, and All time is marked as selected

#### Scenario: Today is the default
- **WHEN** a visitor opens `/impact` with no range
- **THEN** Today is marked as selected

### Requirement: Custom range picker
The page SHALL offer the same date-range picker as the Solar page, showing the current range, from which a visitor picks a start and an end day. It SHALL offer no day before 2021-10-10, the site's first day of service, and none after today in the site's time zone.

#### Scenario: Picking a range
- **WHEN** a visitor picks October 10 and October 20, 2026
- **THEN** the address becomes `/impact?start=2026-10-10&end=2026-10-20` and the page shows that range

### Requirement: Range controls beside the heading
In a window at least 1024 pixels wide, the page's heading and its range controls (the readings switch when it shows, the presets with the selected one's step buttons, and the dates button) SHALL share one row for every preset, so choosing a preset that brings the readings switch doesn't push the controls onto a row of their own. The lead sentence SHALL sit on its own line under that row.

#### Scenario: All time
- **WHEN** a viewer on Today, in a 1024 pixel wide window, chooses All time on 2026-11-11
- **THEN** the readings switch appears in the same row as the heading, presets and dates button

### Requirement: Impact figures
For its range, the page SHALL take from the `data` table, with PG&E's meter readings standing in for Tesla's grid figures on days before 2026-04-27 that have them (as `solar-range-chart`'s bar values do): solar generated, home use, and home use from solar, the Powerwall and the grid, each a sum rounded to one decimal place. Each share SHALL be its part of home use as a whole percentage, rounded as Python's `round` does; self-powered SHALL be the solar share plus the Powerwall share, and energy offset solar generated as a share of home use.

#### Scenario: A meter-corrected day
- **WHEN** the range is 2025-12-10, whose Tesla figures are 20 kWh in, 4 kWh out and 30 kWh of house use, and PG&E's meter read 40 kWh in and 8 kWh out
- **THEN** home use is 46.0 kWh, 30.0 from the grid, 11.0 from solar and 5.0 from the Powerwall, and the shares are 65% grid, 24% solar and 11% Powerwall

#### Scenario: A range with no saved days
- **WHEN** the range is today just after midnight, before any totals are saved
- **THEN** every figure and share is 0

### Requirement: Self Powered section
The page SHALL show a Self Powered section: its title, the line "House use met by solar and Powerwall", a ring of the solar, Powerwall and grid shares with the self-powered percentage in its middle, and a legend listing each share with its percentage.

#### Scenario: A day's impact
- **WHEN** the range is 2026-10-18, with 48% solar, 52% Powerwall and 0% grid
- **THEN** the ring shows 100% in its middle, and the legend lists 48% Solar, 52% Powerwall and 0% Grid

#### Scenario: The house, not the home
- **WHEN** the page shows a range
- **THEN** the sections' heading reads "Where the house's energy came from" and the Self Powered line reads "House use met by solar and Powerwall"

### Requirement: Solar Offset section
The page SHALL show a Solar Offset section: its title, the line "Solar generated against house use", the energy offset percentage, and two bars on one scale, Solar and the house, each labeled with its energy as `display-units` reads energy, to one decimal place in kWh. The house's bar SHALL be named "House, car included", as the Solar range chart names it, since Impact's house use counts the car's charging.

#### Scenario: A day's offset
- **WHEN** the range is 2026-10-18, with 23.8 kWh of solar and 30.8 kWh of house use
- **THEN** the section shows 77% energy offset, a Solar bar labeled 23.8 kWh and a longer bar named "House, car included" labeled 30.8 kWh

#### Scenario: A year's offset
- **WHEN** the range has 12,345.6 kWh of solar and 15,200.0 kWh of house use
- **THEN** the bars are labeled 12.3 MWh and 15.2 MWh

#### Scenario: A whole number
- **WHEN** the range has 24.0 kWh of solar
- **THEN** the Solar bar is labeled 24.0 kWh

### Requirement: Flow colors
The sections SHALL draw solar, the Powerwall, the grid and home in the colors the dashboard shell sets for those flows.

#### Scenario: The ring and the bars
- **WHEN** the page shows a range
- **THEN** the ring's and legend's solar, Powerwall and grid, and the Solar and Home bars, take the shell's solar, Powerwall, grid and home colors

### Requirement: Impact page fits a phone
On a 375 pixel wide screen the page SHALL show the Self Powered section above the Solar Offset section, in one column, with no horizontal scrolling and no text or chart overlapping another.

#### Scenario: Phone portrait
- **WHEN** a viewer opens the Impact page on a 375 pixel wide screen
- **THEN** Self Powered is above Solar Offset and the page does not scroll sideways

### Requirement: Impact sections side by side on wide screens
On windows 1024 pixels wide or more, the Self Powered and Solar Offset sections SHALL sit side by side, Self Powered on the left, without overlapping.

#### Scenario: Desktop window
- **WHEN** a viewer opens the Impact page in a 1440 pixel wide window
- **THEN** Self Powered is to the left of Solar Offset and their titles do not overlap

### Requirement: The range stays current
When a `totals` event arrives on the live stream for a day inside the shown range, the page SHALL reload its figures without reloading the page. Events for days outside the range SHALL NOT reload them.

#### Scenario: Viewing today
- **WHEN** the page shows today and a `totals` event arrives for today
- **THEN** the figures update in place

#### Scenario: Viewing a past range
- **WHEN** the page shows March 2026 and a `totals` event arrives for 2026-11-08
- **THEN** the page does not reload its figures

### Requirement: Updates missed while disconnected are recovered
When the page's live stream opens again after it was lost, the page SHALL reload its figures if the shown range includes today.

#### Scenario: Laptop wakes from sleep
- **WHEN** a page showing this month was disconnected for 20 minutes and its stream opens again
- **THEN** the figures update without a page reload

### Requirement: Failed reloads keep the shown figures
When reloading the page's figures fails, the page SHALL keep showing the figures it had, with no error shown.

#### Scenario: Server error on reload
- **WHEN** the page shows today and a reload after a `totals` event fails
- **THEN** the figures stay as they were

### Requirement: Impact data
`GET /api/impact?start_date=&end_date=` SHALL answer with status 200 and `{"data": {...}}` holding `from_solar_percentage`, `from_powerwall_percentage`, `from_grid_percentage`, `self_powered_percentage`, `total_solar_percentage`, `total_solar`, `from_solar`, `from_powerwall`, `from_grid` and `total_house`, as "Impact figures" defines them, for every range from 2021-10-01 to 732 days after today. Other requests SHALL get status 400 and a message.

#### Scenario: A valid range
- **WHEN** a client requests `/api/impact?start_date=2025-12-10&end_date=2025-12-10`
- **THEN** the answer is status 200 with the ten figures for that day

#### Scenario: A malformed date
- **WHEN** a client requests `/api/impact?start_date=nope&end_date=2026-01-31`
- **THEN** the answer is status 400 with a message, and no figures

### Requirement: The range's lead sentence
Under its "Impact" heading, the page SHALL always say in one sentence the range's self-powered share in whole percentages, its figures in mono, and how it compares with the same days a year earlier when there are any: "up from", "down from", or "about the same as" when the two round to the same percentage. A range that includes today SHALL be named as under way ("today so far", "in November so far", "since Nov 1, 2026"). The sentence SHALL follow the figures as they reload.

#### Scenario: The month so far
- **WHEN** November 1 to 22, 2026 is 35% self-powered and November 1 to 22, 2025 was 27%
- **THEN** the sentence reads "35% self-powered in November so far, up from 27% over the same days last year."

#### Scenario: A finished month
- **WHEN** October 2026 is 42% self-powered and October 2025 was 45%
- **THEN** the sentence reads "42% self-powered in October 2026, down from 45% in October 2025."

#### Scenario: The same share
- **WHEN** this week so far is 31% self-powered and the same days last year were 31%
- **THEN** the sentence reads "31% self-powered this week so far, about the same as the same days last year."

#### Scenario: Today
- **WHEN** a viewer opens `/impact` at 10:06 AM on 2026-11-23, with today 24% self-powered so far
- **THEN** the sentence reads "24% self-powered today so far."

#### Scenario: A custom range reaching today
- **WHEN** the range is 2026-11-10 to 2026-11-23 on 2026-11-23, 30% self-powered, and November 10 to 22, 2025 was 28%
- **THEN** the sentence reads "30% self-powered since Nov 10, 2026, up from 28% over the same days last year."

### Requirement: The year-earlier days
Since today is only partly over, for a range of more than one day that includes today the year-earlier days SHALL stop at yesterday's date a year earlier, and a range that starts today, a lone today included, SHALL have none. A finished calendar month, calendar year or true-up year SHALL be compared by name ("October 2025", "2025", "'24 - '25"); any other range, including one under way, with "the same days last year".

#### Scenario: True-up year so far
- **WHEN** the range is '26 - '27 on 2026-11-22
- **THEN** it is compared with 2025-10-01 to 2025-11-21, as "the same days last year"

#### Scenario: The first of the month
- **WHEN** the range is December 2026 on 2026-12-01, 18% self-powered so far
- **THEN** the sentence reads "18% self-powered in December so far." with no comparison

#### Scenario: Yesterday
- **WHEN** the range is 2026-11-22 on 2026-11-23, 40% self-powered, and 2025-11-22 was 33%
- **THEN** the sentence reads "40% self-powered yesterday; this day last year was 33%."

### Requirement: One day against the same day
A past one-day range SHALL compare with that date a year earlier: "40% self-powered yesterday; this day last year was 33%." Yesterday SHALL read "yesterday", and any other day "on <date>". Today alone is only partly over, so it SHALL have no comparison.

#### Scenario: Today
- **WHEN** a viewer opens `/impact` on 2026-11-22, 21% self-powered so far, and 2025-11-22 was 29%
- **THEN** the sentence reads "21% self-powered today so far." with no comparison

#### Scenario: Before any solar
- **WHEN** the page shows yesterday because today's solar still reads 0.0 kWh
- **THEN** the sentence begins "N% self-powered yesterday"

### Requirement: The share alone without a year earlier
When the range has no year-earlier days, or they have no home use or any of them falls before the system's first day, October 10, 2021, the sentence SHALL give the range's share alone, so every range opens with a figure.

#### Scenario: All time
- **WHEN** All time is shown on 2026-11-23, 41% self-powered
- **THEN** the sentence reads "41% self-powered since Oct 10, 2021."

#### Scenario: 2022
- **WHEN** the range is 2022, 52% self-powered
- **THEN** the sentence reads "52% self-powered in 2022."
