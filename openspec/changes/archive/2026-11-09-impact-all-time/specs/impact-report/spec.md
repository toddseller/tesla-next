## MODIFIED Requirements

### Requirement: Range presets
The page SHALL offer six presets, each changing the address to its range, all from today in the site's time zone: Today, This week (Sunday to Saturday), This month, This year (January 1 to December 31), True-up year (October 1 to September 30 of the true-up year containing today) and All time (the site's first day of service, 2021-10-10, to today). A preset matching the shown range SHALL be marked as selected.

#### Scenario: This week
- **WHEN** a visitor picks This week on Sunday 2026-11-08
- **THEN** the page shows 2026-11-08 to 2026-11-14, and This week is marked as selected

#### Scenario: This week on a Wednesday
- **WHEN** a visitor picks This week on 2026-11-11
- **THEN** the page shows 2026-11-08 to 2026-11-14

#### Scenario: True-up year in November
- **WHEN** a visitor picks True-up year on 2026-11-08
- **THEN** the page shows 2026-10-01 to 2027-09-30

#### Scenario: All time
- **WHEN** a visitor picks All time on 2026-11-09
- **THEN** the address becomes `/impact?start=2021-10-10&end=2026-11-09`, the page shows that range, and All time is marked as selected

#### Scenario: Today is the default
- **WHEN** a visitor opens `/impact` with no range
- **THEN** Today is marked as selected
