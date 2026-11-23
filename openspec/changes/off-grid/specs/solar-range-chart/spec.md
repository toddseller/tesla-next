## MODIFIED Requirements

### Requirement: Default and invalid ranges
When `start` and `end` are both missing, the page SHALL show the current month in the site's time zone, from its first to its last day. When either is given but `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL redirect to its address without `start` and `end`, keeping its other parameters, so the address names the range shown.

#### Scenario: No range
- **WHEN** a visitor opens `/solar` on 2026-11-07
- **THEN** the page shows November 1 to 30, 2026

#### Scenario: A malformed range
- **WHEN** a visitor opens `/solar?start=nope&end=2026-10-31` on 2026-11-07
- **THEN** the visitor is redirected to `/solar`, which shows November 2026

#### Scenario: A range before the site existed
- **WHEN** a visitor opens `/solar?start=1900-01-01&end=2026-10-31&readings=reported`
- **THEN** the visitor is redirected to `/solar?readings=reported`, which shows the current month

#### Scenario: Only a start
- **WHEN** a visitor opens `/solar?start=2026-10-01`
- **THEN** the visitor is redirected to `/solar`
