## MODIFIED Requirements

### Requirement: The Backup section's year
The Impact page SHALL show a Backup section with its own year picker, apart from the page's date range, while the page shows neither All time nor a true-up year, working as the page's range presets do: True-up year (the current true-up year, October 1 to September 30, named as the page's own True-up year preset so "This year" on the page means only the calendar year) and All time, the chosen one selected. On a true-up year, previous and next arrows SHALL step one true-up year, from 2021-22 to this one, the button naming the year shown. Below 640 pixels wide the presets SHALL be one menu between the arrows.

#### Scenario: Opening the page on 2026-11-09
- **WHEN** a visitor opens `/impact`
- **THEN** the section shows 2026-27, its presets read True-up year and All time with True-up year selected, and its next arrow is disabled

#### Scenario: No second This year
- **WHEN** a visitor opens `/impact`
- **THEN** the only button reading "This year" is the page's preset for January 1 to December 31

#### Scenario: On a phone
- **WHEN** a visitor opens `/impact` on 2026-11-09 on a 390-pixel-wide screen
- **THEN** the section's year is one "True-up year" menu button between the previous and next arrows, and its menu lists True-up year and All time

#### Scenario: Stepping back
- **WHEN** a visitor on 2026-11-09 presses the previous arrow twice
- **THEN** the section shows 2024-25, the selected button reads "2024-25", and the heading reads "Backup · 2024-25"

#### Scenario: The first year
- **WHEN** the section shows 2021-22
- **THEN** its previous arrow is disabled

### Requirement: The Backup year is in the address
The Backup section's year SHALL be in the address as `backup`, `24-25` for 2024-25 and `all` for All time; no `backup`, or any other value, SHALL show this year. Choosing SHALL replace the address without a new history entry and leave the page's range as it was. While the section follows the page's year, the addresses the page makes SHALL leave `backup` out.

#### Scenario: An earlier year picked
- **WHEN** a visitor picks 2023-24 from Earlier
- **THEN** the address gains `backup=23-24` with the range unchanged, and the Earlier button reads 2023-24 and is marked as selected

#### Scenario: All time
- **WHEN** a visitor picks All time
- **THEN** the address gains `backup=all` and the section covers every event since October 2021

#### Scenario: Another range
- **WHEN** the Impact page shows only today with `backup=24-25`
- **THEN** the Backup section still covers 2024-25

#### Scenario: Moving the page to All time
- **WHEN** the page shows this month with `backup=24-25` and the visitor picks the page's All time
- **THEN** the new address has no `backup`, and the section covers All time

#### Scenario: Leaving a followed year
- **WHEN** the page shows All time and the visitor picks the page's This month
- **THEN** the new address has no `backup`, and the section shows this true-up year with its picker

### Requirement: Blips per year
Under the summary the section SHALL give the number of blips: for one true-up year, that year's count; for All time, each true-up year's count from 2021-22 on, oldest first, a year without blips reading 0. It SHALL give the counts only.

#### Scenario: One year
- **WHEN** 2022-23 is shown and it had 27 blips
- **THEN** the line reads 27 blips

#### Scenario: All time
- **WHEN** All time is shown and 2024-25 had no blips
- **THEN** the line lists every true-up year from 2021-22 with its count, 2024-25 reading 0

### Requirement: The Backup section follows the page's year
When the Impact page shows All time or a true-up year, October 1 to September 30, the current one included, the Backup section SHALL show that same span, whatever `backup` the address holds, and SHALL show no year picker or arrows, so the page and the section can't give two answers.

#### Scenario: The page on All time
- **WHEN** a visitor opens Impact's All time on 2026-11-24
- **THEN** the section covers every event since October 2021, its heading reads "Backup · All time", and it shows no picker or arrows

#### Scenario: The page on a past true-up year
- **WHEN** the page shows October 1, 2023 to September 30, 2024
- **THEN** the section covers 2023-24, its heading reads "Backup · 2023-24", and it shows no picker or arrows

#### Scenario: The page on this true-up year with another backup year in the address
- **WHEN** the page shows October 1, 2026 to September 30, 2027 with `backup=24-25` in the address
- **THEN** the section covers 2026-27

#### Scenario: The page on a calendar year
- **WHEN** the page shows January 1 to December 31, 2026
- **THEN** the section keeps its own year and its picker

### Requirement: The Backup heading names its span
The Backup section's heading SHALL name what it shows, after a middle dot: the true-up year ("Backup · 2026-27", the current True-up year included), or "Backup · All time", so the section can't be read as covering another range than it does.

#### Scenario: Opening the page on 2026-11-09
- **WHEN** a visitor opens `/impact`
- **THEN** the section's heading reads "Backup · 2026-27"

#### Scenario: The page on All time
- **WHEN** a visitor opens Impact's All time on 2026-11-23 with no `backup` in the address
- **THEN** the section's heading reads "Backup · All time" under the page's All time figures

#### Scenario: All time picked
- **WHEN** a visitor picks All time in the section
- **THEN** its heading reads "Backup · All time", and no arrows show
