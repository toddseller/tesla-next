## MODIFIED Requirements

### Requirement: Default and invalid ranges
When `start` and `end` are both missing, the page SHALL show today in the site's time zone, unless today's solar so far reads 0.0 kWh, when it SHALL show yesterday, so a visitor early in the day sees a whole day rather than nothing. When either is given but `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL redirect to its address without `start` and `end`, keeping its other parameters, so the address names the range shown.

#### Scenario: No range
- **WHEN** a visitor opens `/impact` on 2026-11-08 after the panels have made 0.4 kWh
- **THEN** the page shows November 8, 2026

#### Scenario: Before any solar
- **WHEN** a visitor opens `/impact` at 7:00 AM on 2026-11-08, before the panels have made a tenth of a kWh
- **THEN** the page shows November 7, 2026, and choosing Today in the presets shows November 8

#### Scenario: A malformed range
- **WHEN** a visitor opens `/impact?start=nope&end=2026-10-31&backup=25-26` on 2026-11-08 after the panels have made 0.4 kWh
- **THEN** the visitor is redirected to `/impact?backup=25-26`, which shows November 8, 2026

#### Scenario: Late in the evening
- **WHEN** a visitor in New York opens `/impact` at 1:00 AM on 2026-11-09 there, which is still November 8 at the site, after the day's solar
- **THEN** the page shows November 8, 2026
