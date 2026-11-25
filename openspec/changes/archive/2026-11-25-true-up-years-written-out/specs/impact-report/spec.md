## MODIFIED Requirements

### Requirement: The year-earlier days
Since today is only partly over, for a range of more than one day that includes today the year-earlier days SHALL stop at yesterday's date a year earlier, and a range that starts today, a lone today included, SHALL have none. A finished calendar month, calendar year or true-up year SHALL be compared by name ("October 2025", "2025", "2024-25"); any other range, including one under way, with "the same days last year".

#### Scenario: True-up year so far
- **WHEN** the range is 2026-27 on 2026-11-22
- **THEN** it is compared with 2025-10-01 to 2025-11-21, as "the same days last year"

#### Scenario: The first of the month
- **WHEN** the range is December 2026 on 2026-12-01, 18% self-powered so far
- **THEN** the sentence reads "18% self-powered in December so far." with no comparison

#### Scenario: Yesterday
- **WHEN** the range is 2026-11-22 on 2026-11-23, 40% self-powered, and 2025-11-22 was 33%
- **THEN** the sentence reads "40% self-powered yesterday; this day last year was 33%."
