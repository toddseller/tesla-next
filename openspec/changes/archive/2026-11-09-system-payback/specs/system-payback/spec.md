# Spec Delta

## Purpose

Says whether the solar and the Powerwalls have paid for themselves, from what each cost, kept private on the server, and what each has saved or earned since the system went into service.

## ADDED Requirements

### Requirement: The costs stay private
The system's costs SHALL be read from a file on the server named by `SYSTEM_COSTS_FILE`, never from the repository. No cost, net cost, amount left or share of cost recovered SHALL appear in any page or route answer, only years. Without the file, or with one that can't be read, the page SHALL show no Payback card and the route SHALL answer null.

#### Scenario: No costs file
- **WHEN** `SYSTEM_COSTS_FILE` is not set
- **THEN** `/api/payback` answers `{"data": null}` and the True-Up Tracker has no Payback card

#### Scenario: Nothing but years
- **WHEN** `/api/payback` answers with a costs file present
- **THEN** its answer holds years and estimate markers, and no dollar amount of cost

### Requirement: The system's net cost
Each part's net cost SHALL be its price plus its share of the sales tax, in proportion to the two prices, less the federal credit at the file's rate on that total.

#### Scenario: Placeholder costs
- **WHEN** the file gives solar $25,000, the Powerwalls $20,000, $3,000 of sales tax and a 26% credit
- **THEN** solar's net cost is $19,733.33 ($25,000 plus $1,666.67 of tax, less 26%) and the Powerwalls' is $15,786.67

### Requirement: Solar's savings by year
Solar's savings SHALL count each true-up year from '21 - '22 on: for a year with priced savings, what solar saved (see true-up-savings); for '21 - '22 and '22 - '23, an estimate, the first priced year's saving times that year's solar output over the first priced year's, times that year's average E-TOU-C cost over the first priced year's, from PCE and PG&E's joint rate comparisons. The current year SHALL count its saving so far.

#### Scenario: An estimated year
- **WHEN** '23 - '24 saved $5,000 on 10,000 kWh of solar at an average cost of $0.35931 a kWh, and '21 - '22 made 9,500 kWh at $0.30334
- **THEN** '21 - '22's estimate is $5,000 × 0.95 × 0.30334 / 0.35931, $4,010.09

### Requirement: When solar paid for itself
Solar's payback date SHALL be when its savings, counted year by year from October 22, 2021, reach its net cost, the year it happens counted at an even rate through its days. Before then it SHALL be projected at the average of the priced years. The card SHALL give the year, and say when it is a projection or rests on estimated years.

#### Scenario: Paid back within a year
- **WHEN** solar's net cost is $19,733.33, $18,000 had been saved by September 30, 2024, and '24 - '25 saved $6,000
- **THEN** it paid for itself 105 days into '24 - '25, and the card reads paid for itself in 2025

#### Scenario: '21 - '22 from PTO
- **WHEN** '21 - '22's estimate is $4,010.09 for its 365 days
- **THEN** $3,779.37 counts, its 344 days from October 22, 2021

#### Scenario: Not yet paid back
- **WHEN** $15,000 of $19,733.33 has been saved by September 30, 2025, and the priced years average $6,000
- **THEN** the card reads projected to pay for itself in 2026

### Requirement: When solar pays for the whole system
The card SHALL also give the year solar's savings alone reach the solar and Powerwall net costs together, found the same way as solar's own payback date, and say when it is a projection or rests on estimated years.

#### Scenario: Projected
- **WHEN** the two net costs total $35,520.00, $30,000 has been saved by September 30, 2026, and the priced years average $6,000
- **THEN** the rest takes about 336 days into '26 - '27, and the card reads solar projected to pay for the whole system in 2027

#### Scenario: Already reached
- **WHEN** solar's savings passed the total during '27 - '28
- **THEN** the card reads solar paid for the whole system in 2028

### Requirement: The Powerwalls' payback
The Powerwalls' payback SHALL count, over the priced years only, what they added to the bill and earned in VPP credits (a season's payout, or its estimate). The card SHALL give the year that net would cover their cost at its average rate, or, when that is more than 10 years from now (their warranty) or the net is not positive, say they won't pay for themselves in dollars and give their outage record (see backup-history).

#### Scenario: Three priced years
- **WHEN** the Powerwalls netted $850 over three priced years against a $15,786.67 net cost
- **THEN** at about $283 a year the rest would take about 53 more years, so the card says they won't pay for themselves in dollars

#### Scenario: The outage record
- **WHEN** the card says they won't pay for themselves
- **THEN** it gives their outages since PTO, the hours off the grid and the longest, linking to the Backup section

### Requirement: The Payback card
With a costs file, the True-Up Tracker SHALL show a Payback card for the system's whole life, whatever range is picked, giving solar's year, the year solar pays for the whole system, and the Powerwalls' year side by side, and saying which years are estimated.

#### Scenario: Any year picked
- **WHEN** '22 - '23 or All time is shown
- **THEN** the Payback card shows the same years

### Requirement: Payback data
`GET /api/payback` SHALL answer with status 200 and `{"data": {...}}` holding solar's payback year and the year solar pays for the whole system, each with whether it is projected and whether estimated years count toward it, and the Powerwalls' payback year or that they won't pay back, or `{"data": null}` without a costs file.

#### Scenario: The route
- **WHEN** `/api/payback` is requested with a costs file
- **THEN** it answers the card's years, marking that '21 - '22 and '22 - '23 were estimated
