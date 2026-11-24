## RENAMED Requirements

- FROM: `### Requirement: The year explained`
- TO: `### Requirement: The range explained`

## MODIFIED Requirements

### Requirement: The headline
When a true-up year has something its tiles don't say, the page SHALL lead with it as a headline sentence under the "True-Up Tracker" heading, at the shared lead size with its figures in mono, in place of the subtitle. The heading SHALL stay at its full size. Without a headline, the range's explanation SHALL lead in its place at the same size; the subtitle SHALL show only when there is neither.

#### Scenario: A headline
- **WHEN** the current year has a dollar projection
- **THEN** "True-Up Tracker" heads the page at 22 pixels and the headline sits under it at the size of Solar's and Impact's lead sentences

#### Scenario: All time
- **WHEN** All time is shown
- **THEN** the page has no headline, and its explanation leads under "True-Up Tracker" at the lead size, with no subtitle

#### Scenario: A year without a stored bill
- **WHEN** '22 - '23 is shown, whose year before has no stored amount due
- **THEN** its explanation leads at the lead size, with no subtitle

#### Scenario: Nothing to explain yet
- **WHEN** a new true-up year has no saved day yet
- **THEN** "True-Up Tracker" heads the page with its subtitle

#### Scenario: A range with no billing cycle in it
- **WHEN** the range is November 10 to 23, 2026, and the cycle under way began November 3
- **THEN** the page has no cycles to explain, and "True-Up Tracker" heads it with its subtitle

### Requirement: The range explained
The page SHALL say in one sentence how much of the house's use solar covered, as Impact gives it over the days the net tile counts, and what that left with PG&E, in whole kWh: under a headline, or as the lead. A true-up year is named "This true-up year" (with "so far") or by its name; any other range by the cycles' days, from no earlier than October 10, 2021: "Since <day>" while it reaches today, else "From <day> to <day>". Before any house use is saved there SHALL be none.

#### Scenario: Short of the house's use
- **WHEN** '25 - '26 is shown, solar covered 89% of the house's use, and the year imported 2,422.7 kWh more than it sent
- **THEN** the sentence reads "In '25 - '26 solar covered 89% of the house's use, so the house drew 2,423 kWh more from PG&E than it sent."

#### Scenario: Above the house's use, yet importing
- **WHEN** '22 - '23 is shown, solar covered 103% of the house's use, and the year imported 231.3 kWh more than it sent
- **THEN** the sentence reads "In '22 - '23 solar covered 103% of the house's use, yet the house drew 231 kWh more from PG&E than it sent: the Powerwalls lose some of what they store, so solar needs a margin over use to break even."

#### Scenario: Sending more than drawn
- **WHEN** '23 - '24 is shown, solar covered 109% of the house's use, and the year sent 412.3 kWh more than it imported
- **THEN** the sentence reads "In '23 - '24 solar covered 109% of the house's use, and the house sent 412 kWh more to PG&E than it drew."

#### Scenario: The year under way
- **WHEN** the current year is shown on 2026-11-23, solar has covered 73% of the house's use, and it has imported 671.3 kWh more than it sent
- **THEN** the sentence reads "This true-up year solar has covered 73% of the house's use so far, so the house has drawn 671 kWh more from PG&E than it sent."

#### Scenario: All time
- **WHEN** All time is shown on 2026-11-23, its cycles run from 2021-10-06, solar has covered 100% of the house's use, and they have imported 4,541.3 kWh more than they sent
- **THEN** the sentence reads "Since October 10, 2021 solar has covered 100% of the house's use, yet the house has drawn 4,541 kWh more from PG&E than it sent: the Powerwalls lose some of what they store, so solar needs a margin over use to break even."

#### Scenario: A past custom range
- **WHEN** a range's cycles run from 2026-02-05 to 2026-04-06, solar covered 96% of the house's use, and they imported 120.4 kWh more than they sent
- **THEN** the sentence reads "From February 5 to April 6, 2026 solar covered 96% of the house's use, so the house drew 120 kWh more from PG&E than it sent."

#### Scenario: Before any house use is saved
- **WHEN** a new true-up year has no saved day yet
- **THEN** there is no such sentence, rather than one with 0%
