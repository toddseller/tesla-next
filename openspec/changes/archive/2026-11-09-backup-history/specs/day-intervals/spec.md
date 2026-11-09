# Spec Delta

## ADDED Requirements

### Requirement: The day's off-grid and storm watch spans
The day intervals response SHALL list the day's off-grid spans, each backup event overlapping the day with its start, end and kind (see backup-history), and its storm watch spans, each stretch of the site's state with storm watch active that overlaps the day, with its start and end (none for one still open). Spans SHALL be given whole, not cut at midnight.

#### Scenario: An outage across midnight
- **WHEN** the day 2024-12-14 is requested and an outage ran from 05:55:41 that day for 35.4 hours
- **THEN** the response lists that outage with its full start and end, and so does the response for 2024-12-15

#### Scenario: A day without either
- **WHEN** a day with no backup event and no storm watch is requested
- **THEN** both lists are empty

#### Scenario: Storm watch still on
- **WHEN** today is requested while a storm watch stretch that began at 14:02:10 is still open
- **THEN** the storm watch list holds it with its start and no end
