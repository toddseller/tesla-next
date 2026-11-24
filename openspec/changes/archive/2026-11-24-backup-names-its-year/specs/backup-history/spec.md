## ADDED Requirements

### Requirement: The Backup section names its year
The Backup section's heading SHALL name what it shows, after a middle dot: the true-up year ("Backup · '26 - '27", This year included), or "Backup · All time", so the section can't be read as covering the page's range.

#### Scenario: Opening the page on 2026-11-09
- **WHEN** a visitor opens `/impact`
- **THEN** the section's heading reads "Backup · '26 - '27"

#### Scenario: The page on All time, the section on this year
- **WHEN** a visitor opens Impact's All time on 2026-11-23 with no `backup` in the address
- **THEN** the section's heading reads "Backup · '26 - '27" under the page's All time figures

#### Scenario: All time picked
- **WHEN** a visitor picks All time in the section
- **THEN** its heading reads "Backup · All time", and no arrows show

## MODIFIED Requirements

### Requirement: The Backup section's year
The Impact page SHALL show a Backup section with its own year picker, apart from the page's date range, working as the page's range presets do: This year (the current true-up year, October 1 to September 30) and All time, the chosen one selected. On a true-up year, previous and next arrows SHALL step one true-up year, from '21 - '22 to this one, the button naming the year shown. Below 640 pixels wide the presets SHALL be one menu between the arrows.

#### Scenario: Opening the page on 2026-11-09
- **WHEN** a visitor opens `/impact`
- **THEN** the section shows '26 - '27, its presets read This year and All time with This year selected, and its next arrow is disabled

#### Scenario: On a phone
- **WHEN** a visitor opens `/impact` on 2026-11-09 on a 390-pixel-wide screen
- **THEN** the section's year is one "This year" menu button between the previous and next arrows, and its menu lists This year and All time

#### Scenario: Stepping back
- **WHEN** a visitor on 2026-11-09 presses the previous arrow twice
- **THEN** the section shows '24 - '25, the selected button reads "'24 - '25", and the heading reads "Backup · '24 - '25"

#### Scenario: The first year
- **WHEN** the section shows '21 - '22
- **THEN** its previous arrow is disabled
