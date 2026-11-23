## MODIFIED Requirements

### Requirement: Since 2021 explains the true-up
The Since 2021 chapter SHALL explain the current true-up year as True-Up's year explanation does, in the same words. When the since-2021 share is 100% or more and the current year's is below 100%, it SHALL first say that the since-2021 share rests on the early years: "That 100% rests on the early years, when solar covered more than the house used."

#### Scenario: Matched but still importing
- **WHEN** the chapter shows 100% matched since 2021, and this true-up year solar has covered 73% of the house's use and imported 671.3 kWh more than it sent
- **THEN** the sentence reads "That 100% rests on the early years, when solar covered more than the house used. This true-up year solar has covered 73% of the house's use so far, so the house has drawn 671 kWh more from PG&E than it sent."

#### Scenario: Not yet matched
- **WHEN** the chapter shows 96% matched since 2021
- **THEN** the explanation gives the current year's sentence alone

### Requirement: No costs on the home page
The home page SHALL NOT show what the system cost, its net cost, the amount left or the share of its cost recovered, only years, and the month solar paid back once it has. PG&E's bill, as True-Up estimates it, MAY appear.

#### Scenario: Reading the page
- **WHEN** a visitor reads every chapter
- **THEN** no dollar figure about what the system cost appears

## ADDED Requirements

### Requirement: Since 2021's dollar estimate
Under the current true-up year's net, the Since 2021 chapter SHALL give True-Up's dollar estimate for the year, as its headline gives it: the range, then "on track to owe at the <month year> true-up". Without dollar projections it SHALL give none.

#### Scenario: The estimate
- **WHEN** True-Up projects $610 to $654 due at the October 2027 true-up
- **THEN** the chapter gives "$610 to $654" under the net, then "on track to owe at the October 2027 true-up"

#### Scenario: No dollar projections
- **WHEN** True-Up has only a kWh projection for the current year
- **THEN** the chapter gives the net and no dollar figure
