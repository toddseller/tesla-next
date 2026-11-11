# Spec Delta

## MODIFIED Requirements

### Requirement: The Backup section's year
The Impact page SHALL show a Backup section with its own year picker, apart from the page's date range: This year (the current true-up year, October 1 to September 30) and the two true-up years before it as buttons labeled like "'25 - '26", an Earlier menu with every older true-up year from '21 - '22, newest first, and All time last. The chosen control SHALL be marked as selected. In a window narrower than 640 pixels these SHALL be one menu, as the dashboard shell's range presets on a phone are.

#### Scenario: Opening the page on 2026-11-09
- **WHEN** a visitor opens `/impact`
- **THEN** the section shows '26 - '27, and its controls read This year, '25 - '26, '24 - '25, Earlier and All time, in that order

#### Scenario: On a phone
- **WHEN** a visitor opens `/impact` on 2026-11-09 on a 390-pixel-wide screen
- **THEN** the section's year is one "This year" menu button, and its menu lists This year, '25 - '26, '24 - '25, '23 - '24, '22 - '23, '21 - '22 and All time
