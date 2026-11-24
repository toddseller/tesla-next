## MODIFIED Requirements

### Requirement: The open day is in the address
When the Solar page's address has a `day` parameter, a `YYYY-MM-DD` date from 2021-10-10, the site's first day of service, to today in the site's time zone, the page SHALL show that day's day view, rendered on the server with its data. Any other `day` value SHALL redirect to the address without `day`, keeping its other parameters and adding `unshown=1`, so the range is shown at an address that names it, with the line about the link that solar-range-chart's "Default and invalid ranges" describes.

#### Scenario: A shared day
- **WHEN** a visitor opens `/solar?start=2026-10-01&end=2026-10-31&day=2026-10-14`
- **THEN** the page shows October 14, 2026's day view, with its chart data in the first response

#### Scenario: A day in the future
- **WHEN** a visitor opens `/solar?day=2030-01-01` on 2026-11-07
- **THEN** the visitor is redirected to `/solar?unshown=1`, which shows the current month's range with "That link asked for dates the site doesn't have, so this shows November 2026." under the title

#### Scenario: A malformed day in a range
- **WHEN** a visitor opens `/solar?start=2026-10-01&end=2026-10-31&day=soon`
- **THEN** the visitor is redirected to `/solar?start=2026-10-01&end=2026-10-31&unshown=1`, which shows October 2026 with "That link asked for dates the site doesn't have, so this shows October 2026."
