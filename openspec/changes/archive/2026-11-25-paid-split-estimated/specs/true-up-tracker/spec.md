## MODIFIED Requirements

### Requirement: Savings card
With one true-up year from '23 - '24 on shown, a card below the tiles, "What the system saved" (see true-up-savings), SHALL show the saving in whole dollars ("so far" for the current year) of the no-system cost, and a key giving what was paid (PG&E and WestLight Energy, marked as estimated, since the card reprices billed cycles from PG&E's readings rather than taking the statement's charge), what solar saved, and the Powerwalls. The shown dollars SHALL add up, the Powerwalls' amount being solar's saving less the saving, and cost or saved read from it; a cost SHALL be shown as taken from solar's saving.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, costing $6,693.86 with no system, $966.56 with solar only and $1,118.07 actual ($825.00 PG&E, $293.07 WestLight)
- **THEN** the card reads $5,577 saved of $6,695, and its key reads Paid $1,118 with "Estimated: PG&E $825 · WestLight $293" under it, and Saved $5,577, with "Solar $5,727 against buying it all from the grid, less the Powerwalls' $150" under it

#### Scenario: The current year
- **WHEN** the current year is shown
- **THEN** the card reads its saving so far, through the last day counted

#### Scenario: '23 - '24
- **WHEN** '23 - '24 is shown
- **THEN** the savings card is shown

#### Scenario: Before '24 - '25, All time or a custom range
- **WHEN** '22 - '23, All time or a custom range is shown
- **THEN** there is no savings card

### Requirement: The savings key when the Powerwalls cost money
When the Powerwalls cost money, the savings card's key SHALL name the bar's two parts, Paid and Saved, with solar's saving less the Powerwalls' cost in the line under Saved; a year they saved money SHALL keep Solar saved beside its own part of the bar.

#### Scenario: The Powerwalls cost $151
- **WHEN** '25 - '26 is shown, solar saving $5,727 and the Powerwalls costing $151, shown as $150 so the dollars add up
- **THEN** the key reads Saved $5,577, with "Solar $5,727 against buying it all from the grid, less the Powerwalls' $150" under it
