## ADDED Requirements

### Requirement: The year explained
For a true-up year, the page SHALL say under its lead, in one sentence, how much of the house's use solar covered, as Impact gives it over the days the net tile counts, and what that left with PG&E, as the net tile gives it, in whole kWh. Before any house use is saved there SHALL be no sentence. The year under way SHALL be named "This true-up year" with "so far" and the present perfect; a finished year by its name. All time and other ranges SHALL have no such sentence.

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
- **WHEN** All time is shown
- **THEN** there is no such sentence

#### Scenario: Before any house use is saved
- **WHEN** a new true-up year has no saved day yet
- **THEN** there is no such sentence, rather than one with 0%
