# Spec Delta

## ADDED Requirements

### Requirement: Savings card
With one true-up year from '24 - '25 on shown, the page SHALL show a card below the tiles, "What the system saved" (see true-up-savings): the saving (no-system cost less actual cost) in whole dollars, "so far" for the current year, and the no-system cost it comes out of; and a key giving what was paid, split into PG&E and WestLight Energy, what solar saved, and the Powerwalls.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, costing $6,694.67 with no system, $967.23 with solar only and $1,118.07 actual ($825.00 PG&E, $293.07 WestLight)
- **THEN** the card reads $5,577 saved of $6,695, and its key reads Paid $1,118 (PG&E $825, WestLight $293) and Solar saved $5,727

#### Scenario: The current year
- **WHEN** the current year is shown
- **THEN** the card reads its saving so far, through the last day counted

#### Scenario: Before '24 - '25, All time or a custom range
- **WHEN** '23 - '24, All time or a custom range is shown
- **THEN** there is no savings card

### Requirement: Savings bar
The card SHALL draw the no-system cost as one bar split into paid, Powerwalls saved and solar saved, each part's length in proportion to its dollars and in the grid, Powerwall and solar colors. The bar SHALL be announced as an image whose label reads out each part.

#### Scenario: A year the Powerwalls saved money
- **WHEN** a year is shown with $905 paid, $216 saved by the Powerwalls and $2,289 by solar
- **THEN** the bar's parts are in the proportion 905 to 216 to 2,289, and a screen reader hears all three amounts

### Requirement: The Powerwalls in the key
The key SHALL give the Powerwalls' effect on the bill, "saved" or "cost" with the amount, and beside it the year's VPP credit from the VPP credit tile: the season's payout, or its estimate marked as one. When the Powerwalls cost money, the bar SHALL show only paid and saved, and the key SHALL say that under NEM2 exporting solar earns about what importing it later costs, so storing it pays only between 4 and 9 p.m.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, its Powerwalls having added -$150.84, with the 2026 season's VPP credit estimated at $367.60
- **THEN** the key reads Powerwalls cost $151 on the bill, VPP credit $368 (estimate), with the NEM2 sentence, and the bar has a paid part and a saved part only

#### Scenario: A paid season
- **WHEN** '24 - '25 is shown, the 2025 season paid $728.26
- **THEN** the Powerwalls' entry gives the VPP credit as $728

#### Scenario: No season yet
- **WHEN** the current year is shown on 2026-11-08, with no VPP events marked for 2027
- **THEN** the Powerwalls' entry gives no VPP credit

### Requirement: The card names its estimates
The card SHALL say its figures are estimates of PG&E's and WestLight Energy's charges; how many of the year's days before April 27, 2026 were rebuilt from PG&E's meter or used without it, when there are any; and, when the last day counted is more than 12 months after the newest WestLight rate's date, that WestLight's rates are from that date.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, with 205 days rebuilt and January 28, 2026 without PG&E's reading
- **THEN** the card says 205 days before April 27, 2026 were rebuilt from PG&E's meter and 1 is as Tesla read it

#### Scenario: Rates out of date
- **WHEN** the current year is shown on 2027-11-01 and the newest WestLight rate is from 2026-03-01
- **THEN** the card says WestLight's rates are from March 2026

### Requirement: The card on a phone
On a 375-pixel-wide screen the card SHALL fit the page's single column with no horizontal scrolling, its key stacked as one label and amount per row.

#### Scenario: Phone
- **WHEN** '25 - '26 is shown on a 375-pixel-wide screen
- **THEN** the bar spans the card and each key row shows its label and amount without scrolling sideways

### Requirement: Savings stay current
When the page reloads its data for a `totals` event or a reopened stream (see The range stays current), it SHALL reload the savings too. A failed reload SHALL keep the shown savings.

#### Scenario: Viewing the current year
- **WHEN** the current year is shown and a `totals` event arrives for today
- **THEN** the savings card updates in place
