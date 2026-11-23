## MODIFIED Requirements

### Requirement: The open day is in the address
When the Solar page's address has a `day` parameter, a `YYYY-MM-DD` date from 2021-10-10, the site's first day of service, to today in the site's time zone, the page SHALL show that day's day view, rendered on the server with its data. Any other `day` value SHALL redirect to the address without `day`, keeping its other parameters, so the range is shown at an address that names it.

#### Scenario: A shared day
- **WHEN** a visitor opens `/solar?start=2026-10-01&end=2026-10-31&day=2026-10-14`
- **THEN** the page shows October 14, 2026's day view, with its chart data in the first response

#### Scenario: A day in the future
- **WHEN** a visitor opens `/solar?day=2030-01-01`
- **THEN** the visitor is redirected to `/solar`, which shows the current month's range

#### Scenario: A malformed day in a range
- **WHEN** a visitor opens `/solar?start=2026-10-01&end=2026-10-31&day=soon`
- **THEN** the visitor is redirected to `/solar?start=2026-10-01&end=2026-10-31`
