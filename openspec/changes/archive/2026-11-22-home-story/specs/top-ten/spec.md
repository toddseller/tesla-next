# Spec Delta

## MODIFIED Requirements

### Requirement: Dates open the Solar page
Every date on the page SHALL link to the Solar page: a day to its month with that day open (`/solar?start=<first of month>&end=<last of month>&day=<day>`), a month to that month (`/solar?start=<first>&end=<last>`).

#### Scenario: A solar day
- **WHEN** a visitor picks June 13, 2022
- **THEN** the Solar page opens at `/solar?start=2022-06-01&end=2022-06-30&day=2022-06-13`

#### Scenario: An export month
- **WHEN** a visitor picks May 2024
- **THEN** the Solar page opens at `/solar?start=2024-05-01&end=2024-05-31`
