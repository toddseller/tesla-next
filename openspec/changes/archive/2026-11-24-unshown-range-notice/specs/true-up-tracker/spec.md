## MODIFIED Requirements

### Requirement: Default and invalid ranges
When `start` and `end` are both missing, the page SHALL show the current true-up year (see true-up-cycles). When either is given but `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL redirect to its address without `start` and `end`, keeping its other parameters and adding `unshown=1`, so the address names the range shown and the page knows to say so. An address with `unshown=1` SHALL show one line under the page's title naming the range it shows instead, as the browser tab's title names it ("That link asked for dates the site doesn't have, so this shows '26 - '27."), and SHALL then remove `unshown` from the address without reloading, so a reload or a copied link shows the page without the line.

#### Scenario: No range in November
- **WHEN** a visitor opens `/true-up` on 2026-11-08
- **THEN** the page shows 2026-10-01 to 2027-09-30, with no line about the link

#### Scenario: No range before the October read
- **WHEN** a visitor opens `/true-up` on 2026-10-04, the day before the October read
- **THEN** the page shows 2025-10-01 to 2026-09-30

#### Scenario: A range past the horizon
- **WHEN** a visitor opens `/true-up?start=2030-10-01&end=2031-09-30` on 2026-11-08
- **THEN** the visitor is redirected to `/true-up?unshown=1`, which shows 2026-10-01 to 2027-09-30 with "That link asked for dates the site doesn't have, so this shows '26 - '27." under the title

#### Scenario: The line leaves the address
- **WHEN** the page has shown the line for `/true-up?unshown=1`
- **THEN** the address reads `/true-up`, and reloading it shows the page without the line
