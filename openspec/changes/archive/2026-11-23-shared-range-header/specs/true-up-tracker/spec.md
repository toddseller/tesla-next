## MODIFIED Requirements

### Requirement: Year picker
The page SHALL offer the tail of the dashboard shell's preset core, each changing the address: True-up year (the current true-up year) and All time (2021-10-01 to the current year's end); True-up year's step buttons, which step a true-up year by a year; and the date-range picker the other pages use. The control matching the shown range SHALL be marked as selected. In a window narrower than 640 pixels True-up year and All time SHALL be one menu, as the dashboard shell's range presets on a phone are.

#### Scenario: In 2026
- **WHEN** a visitor opens the page on 2026-11-08
- **THEN** the presets are True-up year and All time, with True-up year marked as selected

#### Scenario: In 2036
- **WHEN** a visitor opens the page on 2036-11-08
- **THEN** the presets are still True-up year and All time, with no year buttons and no Earlier menu

#### Scenario: An earlier year picked
- **WHEN** a visitor showing the current year presses Previous true-up year on 2026-11-08
- **THEN** the address becomes `/true-up?start=2025-10-01&end=2026-09-30`, the True-up year preset stays marked and reads '25 - '26, and the page shows '25 - '26 with its tiles and headline

#### Scenario: An earlier year picked on a phone
- **WHEN** a visitor on a 390-pixel-wide screen showing the current year presses Previous true-up year on 2026-11-08
- **THEN** the address becomes `/true-up?start=2025-10-01&end=2026-09-30`, and the menu's button reads '25 - '26

#### Scenario: Before the October read
- **WHEN** a visitor opens the page on 2026-10-04, the day before the October read
- **THEN** True-up year shows 2025-10-01 to 2026-09-30, the current true-up year

#### Scenario: All time
- **WHEN** a visitor picks All time on 2026-11-08
- **THEN** the page shows 2021-10-01 to 2027-09-30

### Requirement: The headline
When a true-up year has something its tiles don't say, the page SHALL lead with it as a headline sentence under the "True-Up Tracker" heading, at the shared lead size with its figures in mono, in place of the subtitle. The heading SHALL stay at its full size. Without a headline the heading and subtitle SHALL stay as they are.

#### Scenario: A headline
- **WHEN** the current year has a dollar projection
- **THEN** "True-Up Tracker" heads the page at 22 pixels and the headline sits under it at the size of Solar's and Impact's lead sentences

#### Scenario: All time
- **WHEN** All time is shown
- **THEN** the page has no headline, and "True-Up Tracker" heads it with its subtitle
