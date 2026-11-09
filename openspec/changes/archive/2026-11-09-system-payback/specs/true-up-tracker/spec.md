# Spec Delta

## MODIFIED Requirements

### Requirement: Savings card
With one true-up year from '23 - '24 on shown, the page SHALL show a card below the tiles, "What the system saved" (see true-up-savings): the saving (no-system cost less actual cost) in whole dollars, "so far" for the current year, and the no-system cost it comes out of; and a key giving what was paid, split into PG&E and WestLight Energy, what solar saved, and the Powerwalls.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, costing $6,693.86 with no system, $966.56 with solar only and $1,118.07 actual ($825.00 PG&E, $293.07 WestLight)
- **THEN** the card reads $5,576 saved of $6,694, and its key reads Paid $1,118 (PG&E $825, WestLight $293) and Solar saved $5,727

#### Scenario: The current year
- **WHEN** the current year is shown
- **THEN** the card reads its saving so far, through the last day counted

#### Scenario: '23 - '24
- **WHEN** '23 - '24 is shown
- **THEN** the savings card is shown

#### Scenario: Before '24 - '25, All time or a custom range
- **WHEN** '22 - '23, All time or a custom range is shown
- **THEN** there is no savings card

### Requirement: The card names its estimates
The card SHALL say its figures are estimates of PG&E's and WestLight Energy's charges; how many of the year's days before April 27, 2026 were rebuilt from PG&E's meter or used without it, when there are any; when the last day counted is more than 12 months after the newest WestLight rate's date, that WestLight's rates are from that date; and when any WestLight rate used was estimated, that WestLight's generation rates are estimated from PG&E's.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, with 205 days rebuilt and January 28, 2026 without PG&E's reading
- **THEN** the card says 205 days before April 27, 2026 were rebuilt from PG&E's meter and 1 is as Tesla read it

#### Scenario: Rates out of date
- **WHEN** the current year is shown on 2027-11-01 and the newest WestLight rate is from 2026-03-01
- **THEN** the card says WestLight's rates are from March 2026

#### Scenario: '23 - '24
- **WHEN** '23 - '24 is shown
- **THEN** the card says WestLight's generation rates that year are estimated from PG&E's

## ADDED Requirements

### Requirement: The Payback card on the page
The True-Up Tracker SHALL show the Payback card (see system-payback) below the cycle list, for every range, rendered with the page and reloaded when the savings are.

#### Scenario: A totals event
- **WHEN** a `totals` event arrives for today
- **THEN** the Payback card updates in place, with no page reload
