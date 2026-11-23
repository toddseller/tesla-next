## MODIFIED Requirements

### Requirement: Default and invalid ranges
When `start` and `end` are both missing, the page SHALL show the current true-up year (see true-up-cycles). When either is given but `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL redirect to its address without `start` and `end`, keeping its other parameters, so the address names the range shown.

#### Scenario: No range in November
- **WHEN** a visitor opens `/true-up` on 2026-11-08
- **THEN** the page shows 2026-10-01 to 2027-09-30

#### Scenario: No range before the October read
- **WHEN** a visitor opens `/true-up` on 2026-10-04, the day before the October read
- **THEN** the page shows 2025-10-01 to 2026-09-30

#### Scenario: A range past the horizon
- **WHEN** a visitor opens `/true-up?start=2030-10-01&end=2031-09-30` on 2026-11-08
- **THEN** the visitor is redirected to `/true-up`, which shows 2026-10-01 to 2027-09-30
