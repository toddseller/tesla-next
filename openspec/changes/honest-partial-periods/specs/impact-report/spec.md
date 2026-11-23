## RENAMED Requirements

- FROM: `### Requirement: No sentence without a year earlier`
- TO: `### Requirement: The share alone without a year earlier`

## MODIFIED Requirements

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

### Requirement: The share alone without a year earlier
When the range has no year-earlier days, or they have no home use or any of them falls before the system's first day, October 10, 2021, the sentence SHALL give the range's share alone, so every range opens with a figure.

#### Scenario: All time
- **WHEN** All time is shown on 2026-11-23, 41% self-powered
- **THEN** the sentence reads "41% self-powered since Oct 10, 2021."

#### Scenario: 2022
- **WHEN** the range is 2022, 52% self-powered
- **THEN** the sentence reads "52% self-powered in 2022."

### Requirement: One day against the same day
A past one-day range SHALL compare with that date a year earlier: "40% self-powered yesterday; this day last year was 33%." Yesterday SHALL read "yesterday", and any other day "on <date>". Today alone is only partly over, so it SHALL have no comparison.

#### Scenario: Today
- **WHEN** a viewer opens `/impact` on 2026-11-22, 21% self-powered so far, and 2025-11-22 was 29%
- **THEN** the sentence reads "21% self-powered today so far." with no comparison

#### Scenario: Before any solar
- **WHEN** the page shows yesterday because today's solar still reads 0.0 kWh
- **THEN** the sentence begins "N% self-powered yesterday"
