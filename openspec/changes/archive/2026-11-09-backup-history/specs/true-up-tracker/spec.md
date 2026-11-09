# Spec Delta

## MODIFIED Requirements

### Requirement: Savings card
With one true-up year from '24 - '25 on shown, the page SHALL show a card below the tiles, "What the system saved" (see true-up-savings): the saving (no-system cost less actual cost) in whole dollars, "so far" for the current year, and the no-system cost it comes out of; and a key giving what was paid, split into PG&E and WestLight Energy, what solar saved, and the Powerwalls.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, costing $6,693.86 with no system, $966.56 with solar only and $1,118.07 actual ($825.00 PG&E, $293.07 WestLight)
- **THEN** the card reads $5,576 saved of $6,694, and its key reads Paid $1,118 (PG&E $825, WestLight $293) and Solar saved $5,727

#### Scenario: The current year
- **WHEN** the current year is shown
- **THEN** the card reads its saving so far, through the last day counted

#### Scenario: Before '24 - '25, All time or a custom range
- **WHEN** '23 - '24, All time or a custom range is shown
- **THEN** there is no savings card

### Requirement: The Powerwalls in the key
The key SHALL give the Powerwalls' effect on the bill, "saved" or "cost" with the amount, and beside it the year's VPP credit from the VPP credit tile: the season's payout, or its estimate marked as one. When the Powerwalls cost money, the bar SHALL show only paid and saved, and the key SHALL say that under NEM2 exporting solar earns about what importing it later costs, so storing it pays only between 4 and 9 p.m. The effect's two parts and the peak-only line follow it (see The Powerwalls' effect explained).

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, its Powerwalls having added -$151.51, with the 2026 season's VPP credit estimated at $367.60
- **THEN** the key reads Powerwalls cost $152 on the bill, VPP credit $368 (estimate), with the NEM2 sentence, and the bar has a paid part and a saved part only

#### Scenario: A paid season
- **WHEN** '24 - '25 is shown, the 2025 season paid $728.26
- **THEN** the Powerwalls' entry gives the VPP credit as $728

#### Scenario: No season yet
- **WHEN** the current year is shown on 2026-11-08, with no VPP events marked for 2027
- **THEN** the Powerwalls' entry gives no VPP credit

### Requirement: The Powerwalls' effect explained
Under the Powerwalls' bill effect the key SHALL give its parts: what the held days added, as keeping charge on that many days; what the used days added, as storing solar on that many days; what the VPP event days added, as VPP events on that many days; and what the storm watch days added, as storm watch on that many days; each "saved" or "cost" with its amount in whole dollars, a part with no days left out. Set apart from those figures and labeled as a simulation, it SHALL say how much less or more peak-only on the used days would have cost.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown with 129 held days that added -$83.40, 232 used days that added -$110.61, 6 VPP event days that added $42.50, and a peak-only case costing $985.01 against $1,118.07 actual
- **THEN** the key reads $83 cost keeping charge on 129 days, $111 cost storing solar on 232 days, $43 saved on VPP events on 6 days, and that covering only 4 to 9 p.m. on those 232 days would have cost about $133 less (simulation)

#### Scenario: Peak-only costs more
- **WHEN** a year's peak-only case costs $12.40 more than what happened
- **THEN** the key says covering only 4 to 9 p.m. would have cost about $12 more (simulation)

#### Scenario: VPP events
- **WHEN** '24 - '25's 7 VPP event days added $73.28 to the bill
- **THEN** the key reads $73 saved on VPP events, 7 days, beside the VPP credit

#### Scenario: No used days
- **WHEN** every day of the year so far was held
- **THEN** the key gives the held part and no peak-only line

#### Scenario: Storm watch days
- **WHEN** a year's 3 storm watch days added -$18.40 to the bill
- **THEN** the key reads $18 cost on storm watch, 3 days

#### Scenario: No storm watch yet
- **WHEN** a year has no storm watch days
- **THEN** the key has no storm watch line
