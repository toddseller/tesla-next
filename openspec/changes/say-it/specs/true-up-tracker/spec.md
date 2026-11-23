## MODIFIED Requirements

### Requirement: Savings card
With one true-up year from '23 - '24 on shown, a card below the tiles, "What the system saved" (see true-up-savings), SHALL show the saving in whole dollars ("so far" for the current year) of the no-system cost, and a key giving what was paid (PG&E and WestLight Energy), what solar saved, and the Powerwalls. The shown dollars SHALL add up, the Powerwalls' amount being solar's saving less the saving, and cost or saved read from it; a cost SHALL be shown as taken from solar's saving: the key then names the bar's two parts, Paid and Saved, with solar's saving and the Powerwalls' cost in the line under Saved.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, costing $6,693.86 with no system, $966.56 with solar only and $1,118.07 actual ($825.00 PG&E, $293.07 WestLight)
- **THEN** the card reads $5,576 saved of $6,694, and its key reads Paid $1,118 (PG&E $825, WestLight $293) and Saved $5,576, with "Solar $5,727 against buying it all from the grid, less the Powerwalls' $151" under it

#### Scenario: The current year
- **WHEN** the current year is shown
- **THEN** the card reads its saving so far, through the last day counted

#### Scenario: '23 - '24
- **WHEN** '23 - '24 is shown
- **THEN** the savings card is shown

#### Scenario: Before '24 - '25, All time or a custom range
- **WHEN** '22 - '23, All time or a custom range is shown
- **THEN** there is no savings card
