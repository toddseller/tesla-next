# Spec Delta

## Purpose

Shows the site's history of running off the grid: every backup event Tesla recorded since installation, which of them were real outages, and how long the house ran on its own system through them.

## ADDED Requirements

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
The Impact page SHALL show a Backup section with its own year picker, apart from the page's date range: This year (the current true-up year, October 1 to September 30) and the two true-up years before it as buttons labeled like "'25 - '26", an Earlier menu with every older true-up year from '21 - '22, newest first, and All time last. The chosen control SHALL be marked as selected.

#### Scenario: Opening the page on 2026-11-09
- **WHEN** a visitor opens `/impact`
- **THEN** the section shows '26 - '27, and its controls read This year, '25 - '26, '24 - '25, Earlier and All time, in that order

### Requirement: The Backup year is in the address
The Backup section's year SHALL be in the address as `backup`, `24-25` for '24 - '25 and `all` for All time; no `backup`, or any other value, SHALL show this year. Choosing SHALL replace the address without a new history entry and leave the page's range as it was.

#### Scenario: An earlier year picked
- **WHEN** a visitor picks '23 - '24 from Earlier
- **THEN** the address gains `backup=23-24` with the range unchanged, and the Earlier button reads '23 - '24 and is marked as selected

#### Scenario: All time
- **WHEN** a visitor picks All time
- **THEN** the address gains `backup=all` and the section covers every event since October 2021

#### Scenario: Another range
- **WHEN** the Impact page shows only today with `backup=24-25`
- **THEN** the Backup section still covers '24 - '25

### Requirement: The outage summary
The section SHALL give, for the outages in the chosen year: their number, their total hours, the longest with its date, and the energy the house used during them, split into what came from the Powerwalls and what came from solar. A year without outages SHALL say there were none.

#### Scenario: All time on 2026-11-09
- **WHEN** All time is shown on 2026-11-09, with 35 outages of 156.9 hours, the longest 52.3 hours from February 4, 2024, through which the house used 206.9 kWh, 130.0 from the Powerwalls and 76.3 from solar
- **THEN** it reads 35 outages, 156.9 h off the grid, the longest 52 h 16 m on Feb 4, 2024, and 206.9 kWh, Powerwalls 130.0 · Solar 76.3

#### Scenario: A quiet year
- **WHEN** '26 - '27 is shown on 2026-11-09, its only event the test of that morning
- **THEN** the summary says there were no outages, and the list shows the test

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
`GET /api/backup?year=` SHALL answer with status 200 and `{"data": {...}}` holding the summary and the events, newest first, each with its start, its end and its kind, for the year given as on the page (`24-25`, or `all`), this true-up year when it is missing or not one of those.

#### Scenario: One year
- **WHEN** `/api/backup?year=23-24` is requested
- **THEN** it answers the summary and events of October 1, 2023 to September 30, 2024

#### Scenario: No events yet
- **WHEN** `/api/backup` is requested before any event is stored
- **THEN** it answers status 200 with zero outages and an empty list

### Requirement: The section fits a phone
On a 375 pixel wide screen the section SHALL show its summary above its list, in one column, with no horizontal scrolling.

#### Scenario: Phone
- **WHEN** a viewer opens `/impact` on a 375-pixel-wide screen
- **THEN** every figure and every listed event is readable without scrolling sideways
