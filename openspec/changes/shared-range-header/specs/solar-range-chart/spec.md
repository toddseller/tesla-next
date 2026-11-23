## MODIFIED Requirements

### Requirement: Range presets
The page SHALL offer the dashboard shell's four core presets, each changing the address to its range: This month (the current month), This year (January 1 to December 31 of the current year), True-up year (October 1 to September 30 of the true-up year containing today) and All time (2021-10-10, the site's first day of service, to today), all in the site's time zone. A preset matching the shown range SHALL be marked as selected.

#### Scenario: True-up year in November
- **WHEN** a visitor picks True-up year on 2026-11-07
- **THEN** the page shows 2026-10-01 to 2027-09-30, and True-up year is marked as selected

#### Scenario: True-up year on its last day
- **WHEN** a visitor picks True-up year on 2026-09-30
- **THEN** the page shows 2025-10-01 to 2026-09-30

#### Scenario: Late in the evening
- **WHEN** a visitor whose computer is in New York picks This month at 1:00 AM on 2026-12-01 there, which is still November 30 at the site
- **THEN** the page shows November 2026

#### Scenario: All time
- **WHEN** a visitor picks All time on 2026-11-23
- **THEN** the address becomes `/solar?start=2021-10-10&end=2026-11-23`, the page shows that range in periods, and All time is marked as selected
