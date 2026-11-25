## MODIFIED Requirements

### Requirement: True-up years
The true-up years SHALL run from 2021-22 through the one containing today in the site's time zone, each with a label like "'25 - '26", a name like "2025-26", a range from October 1 to September 30, and the date of its October read (the day after its last billing cycle ends). The one containing today SHALL be the first whose October read is after today, and SHALL be marked current. Wherever the site shows a true-up year it SHALL use the year's name, and data such as a cycle's true-up year SHALL keep its label.

#### Scenario: A year's name and label
- **WHEN** the true-up year from 2025-10-01 to 2026-09-30 is listed
- **THEN** its label is "'25 - '26" and its name is "2025-26"

#### Scenario: After the October read
- **WHEN** the years are listed on October 10, 2026, after the October 5 read
- **THEN** the current true-up year is 2026-10-01 to 2027-09-30

#### Scenario: On the October read
- **WHEN** the years are listed on October 5, 2026
- **THEN** the current true-up year is 2026-10-01 to 2027-09-30, since the read day starts its first cycle

#### Scenario: The day before the October read
- **WHEN** the years are listed on October 4, 2026
- **THEN** the current true-up year is 2025-10-01 to 2026-09-30, with an October read of October 5, 2026
