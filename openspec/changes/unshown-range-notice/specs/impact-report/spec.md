## MODIFIED Requirements

### Requirement: Default and invalid ranges
When `start` and `end` are both missing, the page SHALL show today in the site's time zone, unless today's solar so far reads 0.0 kWh, when it SHALL show yesterday, so a visitor early in the day sees a whole day rather than nothing. When either is given but `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL redirect to its address without `start` and `end`, keeping its other parameters and adding `unshown=1`, so the address names the range shown and the page knows to say so. An address with `unshown=1` SHALL show one line under the page's title naming the range it shows instead, as the browser tab's title names it ("That link asked for dates the site doesn't have, so this shows Nov 8, 2026."), and SHALL then remove `unshown` from the address without reloading, so a reload or a copied link shows the page without the line.

#### Scenario: No range
- **WHEN** a visitor opens `/impact` on 2026-11-08 after the panels have made 0.4 kWh
- **THEN** the page shows November 8, 2026, with no line about the link

#### Scenario: Before any solar
- **WHEN** a visitor opens `/impact` at 7:00 AM on 2026-11-08, before the panels have made a tenth of a kWh
- **THEN** the page shows November 7, 2026, and choosing Today in the presets shows November 8

#### Scenario: A malformed range
- **WHEN** a visitor opens `/impact?start=nope&end=2026-10-31&backup=25-26` on 2026-11-08 after the panels have made 0.4 kWh
- **THEN** the visitor is redirected to `/impact?backup=25-26&unshown=1`, which shows November 8, 2026 with "That link asked for dates the site doesn't have, so this shows Nov 8, 2026." under the title

#### Scenario: The line leaves the address
- **WHEN** the page has shown the line for `/impact?backup=25-26&unshown=1`
- **THEN** the address reads `/impact?backup=25-26`, and reloading it shows the page without the line

#### Scenario: Late in the evening
- **WHEN** a visitor in New York opens `/impact` at 1:00 AM on 2026-11-09 there, which is still November 8 at the site, after the day's solar
- **THEN** the page shows November 8, 2026
