# Spec Delta

## MODIFIED Requirements

### Requirement: Habits' figures
Beside its chart, the Habits chapter SHALL say since which month the always-on load has run above (or below) the same month a year earlier, when that has held for three months or more, and otherwise how the latest month compares. It SHALL give the latest month and the same month a year earlier as Patterns labels them, and the watts between them, signed, followed by their difference in kWh a day as Patterns gives it. It SHALL NOT give the Powerwalls' energy out, which is not the house's habit.

#### Scenario: This November against last
- **WHEN** Patterns shows November so far at 864 W, November 2025 at 643 W and a difference of +5 kWh a day
- **THEN** the chapter gives 864 W and 643 W with Patterns' labels, then +221 W with "about +5 kWh a day more than a year ago"

#### Scenario: Below last year
- **WHEN** the latest month ran 400 W against 820 W a year earlier, a difference of -10 kWh a day
- **THEN** the chapter gives -420 W with "about -10 kWh a day less than a year ago"

#### Scenario: A run of months above last year
- **WHEN** July to November 2026 each ran above the same month of 2025 and June did not
- **THEN** the chapter says "Since July it has run above last year"

#### Scenario: No Powerwall figure
- **WHEN** 4.4 MWh has come out of the Powerwalls this year
- **THEN** Habits gives no Powerwall figure

### Requirement: Since 2021 explains the true-up
The Since 2021 chapter SHALL explain the current true-up year as True-Up's year explanation does, in the same words, its net to a tenth as the chapter's net figure gives it. When the since-2021 share is 100% or more and the current year's is below 100%, it SHALL first say that the since-2021 share rests on the early years: "That 100% rests on the early years, when solar covered more than the house used."

#### Scenario: Matched but still importing
- **WHEN** the chapter shows 100% matched since 2021, and this true-up year solar has covered 73% of the house's use and imported 671.3 kWh more than it sent
- **THEN** the sentence reads "That 100% rests on the early years, when solar covered more than the house used. This true-up year solar has covered 73% of the house's use so far, so the house has drawn 671.3 kWh more from PG&E than it sent.", the same 671.3 kWh as the net figure beside it

#### Scenario: Not yet matched
- **WHEN** the chapter shows 96% matched since 2021
- **THEN** the explanation gives the current year's sentence alone

### Requirement: The Powerwalls' payback in words
When the Payback card says the Powerwalls won't pay for themselves within their warranty, the Since 2021 chapter SHALL say so in words rather than give a year. Solar's payback SHALL be said once: by the chart's dotted line and its key once it is reached, and in words beside the figures only while it is projected.

#### Scenario: Beyond the warranty
- **WHEN** the Payback card gives no year for the Powerwalls because it lies beyond their 10-year warranty
- **THEN** the chapter says "The Powerwalls won't pay for themselves within their warranty"

#### Scenario: Solar paid back
- **WHEN** the Payback card gives solar paid back in March 2025
- **THEN** the key reads "dotted line: solar paid back, March 2025", and no sentence repeats it

#### Scenario: Solar projected
- **WHEN** the Payback card projects solar to pay for itself in 2027
- **THEN** no dotted line is drawn, and beside the figures the chapter says "Solar should pay for itself in 2027, projected."
