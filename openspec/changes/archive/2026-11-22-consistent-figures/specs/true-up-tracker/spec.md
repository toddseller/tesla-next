## MODIFIED Requirements

### Requirement: VPP credit tile
With one true-up year shown that has a VPP season, the page SHALL add a Tesla VPP credit tile, saying Tesla pays it apart from PG&E's true-up: a paid season's payout and the month it was paid; an unpaid season's estimate, marked as such, with its kWh and when payment is expected (spring after the season); "Not started" with when the season runs, May 1 to October 31, before the season's May 1; and $0 with no events marked yet when the season has begun and its estimate is zero.

#### Scenario: '25 - '26 before the payout
- **WHEN** '25 - '26 is shown on 2026-11-08 with $367.60 estimated on 183.8 kWh
- **THEN** the tile reads $368 estimate, 2026 season, paid around spring 2027

#### Scenario: Paid season
- **WHEN** '24 - '25 is shown
- **THEN** the tile reads $728.26, 2025 season, paid April 2026

#### Scenario: Current year
- **WHEN** the current year is shown on 2026-11-08
- **THEN** the tile reads Not started, 2027 season, which runs May 1 to October 31

#### Scenario: A season under way with nothing marked
- **WHEN** the current year is shown on 2027-06-10 with no VPP events marked for 2027
- **THEN** the tile reads $0, 2027 season, no events marked yet

#### Scenario: Before the first season
- **WHEN** '22 - '23 is shown
- **THEN** there is no VPP tile

### Requirement: Savings card
With one true-up year from '23 - '24 on shown, a card below the tiles, "What the system saved" (see true-up-savings), SHALL show the saving in whole dollars ("so far" for the current year) of the no-system cost, and a key giving what was paid (PG&E and WestLight Energy), what solar saved, and the Powerwalls. The shown dollars SHALL add up, the Powerwalls' amount being solar's saving less the saving, and cost or saved read from it; a cost SHALL be shown as taken from solar's saving.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, costing $6,693.86 with no system, $966.56 with solar only and $1,118.07 actual ($825.00 PG&E, $293.07 WestLight)
- **THEN** the card reads $5,576 saved of $6,694, and its key reads Paid $1,118 (PG&E $825, WestLight $293) and Solar saved $5,727, with "Less the Powerwalls' $151 on the bill: $5,576 saved" under it

#### Scenario: The current year
- **WHEN** the current year is shown
- **THEN** the card reads its saving so far, through the last day counted

#### Scenario: '23 - '24
- **WHEN** '23 - '24 is shown
- **THEN** the savings card is shown

#### Scenario: Before '24 - '25, All time or a custom range
- **WHEN** '22 - '23, All time or a custom range is shown
- **THEN** there is no savings card

### Requirement: The Powerwalls in the key
The key SHALL give the Powerwalls' effect on the bill, "saved" or "cost" with the amount as the savings card shows it, and beside it the year's VPP credit from the VPP credit tile: the season's payout, or its estimate marked as one. When the Powerwalls cost money, the bar SHALL show only paid and saved, and the key SHALL say that under NEM2 exporting solar earns about what importing it later costs, so storing it pays only between 4 and 9 p.m. The effect's two parts and the peak-only line follow it (see The Powerwalls' effect explained).

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, its Powerwalls having added -$151.51, with the 2026 season's VPP credit estimated at $367.60
- **THEN** the key reads Powerwalls cost $151 on the bill, VPP credit $368 (estimate), with the NEM2 sentence, and the bar has a paid part and a saved part only

#### Scenario: A paid season
- **WHEN** '24 - '25 is shown, the 2025 season paid $728.26
- **THEN** the Powerwalls' entry gives the VPP credit as $728

#### Scenario: No season yet
- **WHEN** the current year is shown on 2026-11-08, with no VPP events marked for 2027
- **THEN** the Powerwalls' entry gives no VPP credit
