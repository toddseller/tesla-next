## ADDED Requirements

### Requirement: The range's lead sentence
Under its "Impact" heading, the page SHALL say in one sentence how the range's self-powered share compares with the same days a year earlier, in whole percentages with its figures in mono: "up from", "down from", or "about the same as" when the two round to the same percentage. The sentence SHALL follow the figures as they reload.

#### Scenario: The month so far
- **WHEN** November 1 to 22, 2026 is 35% self-powered and November 1 to 22, 2025 was 27%
- **THEN** the sentence reads "35% self-powered in November so far, up from 27% over the same days last year."

#### Scenario: A finished month
- **WHEN** October 2026 is 42% self-powered and October 2025 was 45%
- **THEN** the sentence reads "42% self-powered in October 2026, down from 45% in October 2025."

#### Scenario: The same share
- **WHEN** this week so far is 31% self-powered and the same days last year were 31%
- **THEN** the sentence reads "31% self-powered this week so far, about the same as the same days last year."

### Requirement: The year-earlier days
Since today is only partly over, for a range of more than one day that includes today the year-earlier days SHALL stop at yesterday's date a year earlier, and a range that starts today SHALL have no sentence. A finished calendar month, calendar year or true-up year SHALL be compared by name ("October 2025", "2025", "'24 - '25"); any other range, including one under way, with "the same days last year".

#### Scenario: True-up year so far
- **WHEN** the range is '26 - '27 on 2026-11-22
- **THEN** it is compared with 2025-10-01 to 2025-11-21, as "the same days last year"

#### Scenario: The first of the month
- **WHEN** the range is December 2026 on 2026-12-01
- **THEN** the heading has no sentence

### Requirement: One day against the same day
A one-day range SHALL compare with that date a year earlier: "21% self-powered today; this day last year was 29%." Yesterday SHALL read "yesterday", and any other day "on <date>".

#### Scenario: Today
- **WHEN** a viewer opens `/impact` on 2026-11-22, 21% self-powered so far, and 2025-11-22 was 29%
- **THEN** the sentence reads "21% self-powered today; this day last year was 29%."

#### Scenario: Before any solar
- **WHEN** the page shows yesterday because today's solar still reads 0.0 kWh
- **THEN** the sentence begins "N% self-powered yesterday"

### Requirement: No sentence without a year earlier
The page SHALL show no sentence when the year-earlier days have no home use or any of them falls before the system's first day, October 10, 2021, since the ring already gives the share.

#### Scenario: All time
- **WHEN** All time is shown
- **THEN** the heading has no sentence

#### Scenario: 2022
- **WHEN** the range is 2022
- **THEN** the heading has no sentence

## MODIFIED Requirements

### Requirement: Range controls beside the heading
In a window at least 1024 pixels wide, the page's heading and its range controls (the readings switch when it shows, the presets and the dates button) SHALL share one row for every preset, so choosing a preset that brings the readings switch doesn't push the controls onto a row of their own. The lead sentence SHALL sit on its own line under that row.

#### Scenario: All time
- **WHEN** a viewer on Today, in a 1024 pixel wide window, chooses All time on 2026-11-11
- **THEN** the readings switch appears in the same row as the heading, presets and dates button
