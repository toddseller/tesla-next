## ADDED Requirements

### Requirement: The year's lead sentence
Under its "Top Ten" heading, the page SHALL say in one sentence what the current site year has placed in the four rankings as shown, with VPP event days in or out as chosen, counted by kind (solar day, export day, export month, outage). The sentence SHALL follow the rankings as they reload.

#### Scenario: Places but no record
- **WHEN** on 2026-11-22 the rankings hold one solar day, three export days and two export months from 2026, and no record
- **THEN** the sentence reads "2026 hasn't set a record, but it put six entries in the top tens: a solar day, three export days and two export months."

#### Scenario: Switching VPP events
- **WHEN** including VPP event days moves a 2026 export day out of the top ten
- **THEN** the sentence counts five entries and two export days

### Requirement: A record this year
When the year holds a record, the sentence SHALL name it first, then count the year's other entries: "2026 set the record for the best export month, and put five more entries in the top tens." Two records SHALL both be named; with no other entries the sentence SHALL end after the records.

#### Scenario: One record
- **WHEN** 2026 holds the best export month and five other entries
- **THEN** the sentence reads "2026 set the record for the best export month, and put five more entries in the top tens."

#### Scenario: Two records and nothing else
- **WHEN** 2026 holds the best solar day and the longest outage, and no other entries
- **THEN** the sentence reads "2026 set the records for the best solar day and the longest outage."

### Requirement: Nothing from this year yet
When the year has placed nothing, the sentence SHALL name the newest record instead: "No entries from 2027 yet; the newest record is May 21, 2025's export day." With no records at all there SHALL be no sentence.

#### Scenario: January
- **WHEN** on 2027-01-05 no ranking holds a 2027 date, and the newest record is the export day of May 21, 2025
- **THEN** the sentence reads "No entries from 2027 yet; the newest record is May 21, 2025's export day."

#### Scenario: An empty database
- **WHEN** every ranking is empty
- **THEN** the heading has no sentence
