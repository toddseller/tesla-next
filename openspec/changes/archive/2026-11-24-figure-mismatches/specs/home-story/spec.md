## MODIFIED Requirements

### Requirement: Today's totals
The Today chapter SHALL show today's totals so far in kWh to one decimal: the house's use, the car's charging, energy from the grid, energy sent to PG&E, and the Powerwalls' energy in and out, each the day view's figure for today, so the house's use leaves out the car as the day view does and, on a day with car data, is labelled "used by the house, without the car".

#### Scenario: A sunny afternoon
- **WHEN** the day view for today shows the house at 21.3 kWh, the car charged 3.1 kWh, 14.4 kWh from the grid, 11.0 kWh sent, and the Powerwalls 0.7 kWh in and 0.0 kWh out
- **THEN** the Today chapter shows the same six figures, the house's as "21.3 kWh used by the house, without the car"

#### Scenario: Just after midnight
- **WHEN** it is 12:05 AM and today has 0.1 kWh of house use and nothing else
- **THEN** the chapter shows 0.1 kWh for the house and 0.0 kWh for the rest, with no warning

#### Scenario: No car data
- **WHEN** today's day view has no car data, so its house figure holds any charging
- **THEN** the figure is labelled "used by the house"

### Requirement: Since 2021's figures
Beside its chart, the Since 2021 chapter SHALL give the solar since October 10, 2021, and say whether solar has generated as much as the house used and by what share, as Impact gives it for that range. The current true-up year's net SHALL be given once, in the chapter's true-up explanation, with no separate net figure beside it.

#### Scenario: As much as the house used
- **WHEN** Impact gives 75,611 kWh of solar and 100% of the house's use for October 10, 2021 to today
- **THEN** the chapter says solar has generated as much as the house used (100%) and gives 75.6 MWh

#### Scenario: The true-up so far
- **WHEN** the true-up year that began October 1, 2026 has imported 611.4 kWh more than it sent
- **THEN** 611.4 kWh appears once in the chapter, in its true-up explanation, and no figure is labelled "more imported than sent this true-up year"

### Requirement: Since 2021 explains the true-up
The Since 2021 chapter SHALL explain the current true-up year as True-Up's year explanation does, in the same words, its net to a tenth. When the since-2021 share is 100% or more and the current year's is below 100%, it SHALL first say that the since-2021 share rests on the early years: "That 100% rests on the early years, when solar covered more than the house used."

#### Scenario: Matched but still importing
- **WHEN** the chapter shows 100% matched since 2021, and this true-up year solar has covered 73% of the house's use and imported 671.3 kWh more than it sent
- **THEN** the sentence reads "That 100% rests on the early years, when solar covered more than the house used. This true-up year solar has covered 73% of the house's use so far, so the house has drawn 671.3 kWh more from PG&E than it sent."

#### Scenario: Not yet matched
- **WHEN** the chapter shows 96% matched since 2021
- **THEN** the explanation gives the current year's sentence alone

### Requirement: Since 2021's dollar estimate
Beside its chart, first among the chapter's figures, the Since 2021 chapter SHALL give True-Up's dollar estimate for the current true-up year, as its headline gives it: the range, then "on track to owe at the <month year> true-up". Without dollar projections it SHALL give none.

#### Scenario: The estimate
- **WHEN** True-Up projects $610 to $654 due at the October 2027 true-up
- **THEN** the chapter gives "$610 to $654", then "on track to owe at the October 2027 true-up"

#### Scenario: No dollar projections
- **WHEN** True-Up has only a kWh projection for the current year
- **THEN** the chapter gives no dollar figure, and the net still appears in its true-up explanation
