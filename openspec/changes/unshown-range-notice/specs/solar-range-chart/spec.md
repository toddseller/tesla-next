## MODIFIED Requirements

### Requirement: Default and invalid ranges
When `start` and `end` are both missing, the page SHALL show the current month in the site's time zone, from its first to its last day. When either is given but `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL redirect to its address without `start` and `end`, keeping its other parameters and adding `unshown=1`, so the address names the range shown and the page knows to say so. A range view whose address has `unshown=1` SHALL show one line under the page's title naming the range it shows instead, as the browser tab's title names it ("That link asked for dates the site doesn't have, so this shows November 2026."), and SHALL then remove `unshown` from the address without reloading, so a reload or a copied link shows the page without the line. The day view shows the day its address names, so it SHALL show no such line and SHALL remove `unshown` from the address the same way.

#### Scenario: No range
- **WHEN** a visitor opens `/solar` on 2026-11-07
- **THEN** the page shows November 1 to 30, 2026, with no line about the link

#### Scenario: A malformed range
- **WHEN** a visitor opens `/solar?start=nope&end=2026-10-31` on 2026-11-07
- **THEN** the visitor is redirected to `/solar?unshown=1`, which shows November 2026 with "That link asked for dates the site doesn't have, so this shows November 2026." under the title

#### Scenario: A range past the horizon
- **WHEN** a visitor opens `/solar?start=2030-01-01&end=2030-01-31` on 2026-11-07
- **THEN** the visitor is redirected to `/solar?unshown=1`, which shows November 2026 with the line about the link

#### Scenario: A range before the site existed
- **WHEN** a visitor opens `/solar?start=1900-01-01&end=2026-10-31&readings=reported`
- **THEN** the visitor is redirected to `/solar?readings=reported&unshown=1`, which shows the current month with the line about the link

#### Scenario: Only a start
- **WHEN** a visitor opens `/solar?start=2026-10-01`
- **THEN** the visitor is redirected to `/solar?unshown=1`

#### Scenario: The line leaves the address
- **WHEN** the page has shown the line for `/solar?readings=reported&unshown=1`
- **THEN** the address reads `/solar?readings=reported`, and reloading it shows the current month without the line

#### Scenario: A bad range with a day
- **WHEN** a visitor opens `/solar?start=nope&end=2026-10-31&day=2026-10-14`
- **THEN** the visitor is redirected to `/solar?day=2026-10-14&unshown=1`, which shows October 14's day view with no line, and the address then reads `/solar?day=2026-10-14`
