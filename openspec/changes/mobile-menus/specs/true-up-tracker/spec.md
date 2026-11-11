# Spec Delta

## MODIFIED Requirements

### Requirement: Year picker
The page SHALL offer, each changing the address: This year (the current true-up year) and the two years before it as buttons labeled like "'25 - '26"; an Earlier menu with every older year, newest first; All time (2021-10-01 to the current year's end); and the date-range picker the other pages use. The control matching the shown range SHALL be marked as selected. In a window narrower than 640 pixels the year buttons, Earlier's years and All time SHALL be one menu, as the dashboard shell's range presets on a phone are.

#### Scenario: In 2026
- **WHEN** a visitor opens the page on 2026-11-08
- **THEN** the buttons are This year, '25 - '26 and '24 - '25, and Earlier lists '23 - '24, '22 - '23 and '21 - '22

#### Scenario: In 2036
- **WHEN** a visitor opens the page on 2036-11-08
- **THEN** there are still three year buttons, This year, '35 - '36 and '34 - '35, and Earlier lists the thirteen years from '33 - '34 to '21 - '22

#### Scenario: An earlier year picked
- **WHEN** a visitor picks '22 - '23 from Earlier
- **THEN** the address becomes `/true-up?start=2022-10-01&end=2023-09-30`, and the Earlier button reads '22 - '23 and is marked as selected

#### Scenario: An earlier year picked on a phone
- **WHEN** a visitor on a 390-pixel-wide screen picks '22 - '23 from the menu
- **THEN** the address becomes `/true-up?start=2022-10-01&end=2023-09-30`, and the menu's button reads '22 - '23

#### Scenario: All time
- **WHEN** a visitor picks All time on 2026-11-08
- **THEN** the page shows 2021-10-01 to 2027-09-30
