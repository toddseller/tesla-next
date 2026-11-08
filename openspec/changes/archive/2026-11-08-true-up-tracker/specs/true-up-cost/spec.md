# Spec Delta

## Purpose

Prices the house's NEM true-up the way PG&E bills it on E-TOU-C with WestLight Energy generation, from the rates, statements, bills and VPP payouts anton-tesla-api-ws stores, and projects the current year's.

## ADDED Requirements

### Requirement: Cycle segments
A billing cycle's calculated charges SHALL be the sum of its segments' charges. A cycle SHALL be split into segments wherever the season changes (June 1 to summer, October 1 to winter) and wherever a new stored rate revision takes effect. Each segment SHALL use its own days' energy, its own rates, and a baseline allowance of its days times the season's daily quantity.

#### Scenario: Cycle across October 1
- **WHEN** the cycle from September 3 to October 4, 2026 is priced
- **THEN** it has a summer segment of 28 days through September 30 and a winter segment of 4 days from October 1, with allowances of 182 and 30 kWh, as on PG&E's bill

### Requirement: Segment charges
A segment's NEM charges SHALL be the sum of these lines, each rounded half up to the cent: each period's net times its total rate; the baseline credit; the non-bypassable rate times the imports, less it times the net; less each period's net times its generation rate plus the bundled PCIA; and the net times the 2016-vintage PCIA.

#### Scenario: September 3 to 30, 2026, as billed
- **WHEN** the segment has -58.9291 kWh net at peak, 340.5411 kWh off-peak, 182 kWh of allowance and the June 1, 2026 rates
- **THEN** its lines are -$30.78, $136.01, -$14.81, -$20.60 and $10.38, as on PG&E's bill, and the total is within a cent of the bill's $82.50

#### Scenario: October 1 to 4, 2026, as billed
- **WHEN** the segment has -0.0372 kWh net at peak, 70.1781 kWh off-peak and 30 kWh of allowance at winter rates
- **THEN** it totals $18.91, within a cent of PG&E's bill

### Requirement: Baseline credit
The baseline credit SHALL apply to the segment's net usage held between minus and plus its allowance: net usage up to the allowance is credited, and net exports up to the allowance are charged back at the same rate, since they offset baseline usage.

#### Scenario: Net above the allowance
- **WHEN** a segment has 281.6 kWh net and 182 kWh of allowance
- **THEN** the credit is 182 kWh at the baseline credit rate

#### Scenario: Net exported beyond the allowance
- **WHEN** the segment from June 5 to July 5, 2026 has 402 kWh net exported and 201.5 kWh of allowance
- **THEN** the baseline line is a charge of 201.5 kWh at the baseline credit rate, $16.40

#### Scenario: Net exported within the allowance
- **WHEN** a segment has 186 kWh net exported and 188.5 kWh of allowance
- **THEN** the baseline line is a charge of 186 kWh at the baseline credit rate

### Requirement: Cycle charges and their source
Each billing cycle SHALL have NEM charges from PG&E's imported statement or bill when one covers it, marked as from the statement; otherwise calculated over its days with data so far when stored rates cover them, marked as calculated; otherwise none. A cycle with PG&E's figure SHALL also give the calculated estimate, when rates and data allow, and PG&E's net kWh; other cycles SHALL give neither.

#### Scenario: A billed cycle
- **WHEN** the cycle ending at the November 4, 2025 read has PG&E's $113.41 on 364 kWh net, and its days price to $113.72
- **THEN** its NEM charges are $113.41 from the statement, its estimate is $113.72 and its PG&E net is 364 kWh

#### Scenario: The open cycle
- **WHEN** the cycle from October 5, 2026 has data through October 21 and no PG&E figure
- **THEN** its charges are calculated for October 5 to 21, with no estimate or PG&E net

#### Scenario: Before the stored rates
- **WHEN** '22 - '23 has no statement and no rates are stored before September 2023
- **THEN** its cycles have no charges

### Requirement: Amount due at true-up
A finished year's amount due SHALL be its cycles' NEM charges minus the minimum delivery charges already paid, and $0 when that is negative. With a statement, both SHALL be the statement's. Without one, a finished year whose every cycle is calculated SHALL count each day's minimum delivery at the rate in effect that day, each run of days at one rate rounded to the cent.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is requested
- **THEN** its amount due is $767.73, from the statement, after $60.09 of minimum delivery charges

#### Scenario: '23 - '24 calculated
- **WHEN** '23 - '24's 12 calculated cycles total $600 in NEM charges over 364 days, 147 of them at $0.37612 and 217 at $0.39167 of minimum delivery
- **THEN** its minimum delivery charges are $140.28, and its amount due is $459.72, calculated

### Requirement: Credit left over at true-up
A finished, calculated year with NEM charges below zero SHALL give that unused credit, which PG&E doesn't pay out. When its net kWh is exported, it SHALL give the surplus kWh and estimate Net Surplus Compensation: the surplus times the stored rate for its true-up month, the month of the October read that ends it.

#### Scenario: '23 - '24 as priced
- **WHEN** '23 - '24's NEM charges total -$58.03 with 412.3 kWh net exported, truing up in October 2024 at $0.03656
- **THEN** the amount due is $0, with $58.03 of unused credit and $15.07 of estimated Net Surplus Compensation

#### Scenario: No rate for the true-up month
- **WHEN** a finished year exported on balance but its true-up month has no stored rate
- **THEN** the surplus kWh is given and Net Surplus Compensation is not estimated

### Requirement: Projected year-end net
For the current true-up year, the year-end net in kWh SHALL be projected once per comparable year: the net so far, plus that year's net for the rest of the open cycle (prorated by its days left) and for every later cycle. Comparable years SHALL be the finished true-up years from '24 - '25 on with a net for each cycle. The projection SHALL NOT depend on the year's dollars.

#### Scenario: Two comparable years
- **WHEN** the current year has 100 kWh net imported with the open cycle half over, '25 - '26 netted 200 kWh in that cycle and 1,800 kWh after it, and '24 - '25 netted 100 kWh and 1,500 kWh
- **THEN** the projections are 1,650 kWh from '24 - '25 and 2,000 kWh from '25 - '26

#### Scenario: A comparable year with a cycle missing
- **WHEN** '24 - '25 lacks a net for one of its cycles and '25 - '26 has all of them
- **THEN** only '25 - '26 is projected from

#### Scenario: No rates stored
- **WHEN** the current year is requested with no rate revision stored and a comparable year
- **THEN** the charges so far and dollar projections are null, and the kWh projection is given

### Requirement: Projected running net band
With a kWh projection, each cycle of the current year from the open one to the last SHALL have the lowest and highest projected running net at its end across the comparable years; cycles before the open one SHALL have none.

#### Scenario: October
- **WHEN** the current year is requested on October 21, 2026 with only its first cycle open, and two years are comparable
- **THEN** the band has a low and a high for all 12 cycles, and the last cycle's are the two years' projected year-end nets

#### Scenario: Later in the year
- **WHEN** the fourth cycle is open
- **THEN** the first three cycles have no low or high

### Requirement: Projected true-up in dollars
For the current year, with comparable years and stored rates, the amount due SHALL be projected once per comparable year: the charges so far, plus that year's charges for the rest of the open cycle (prorated by its days left) and every later cycle, recalculated from that year's energy at the newest stored rates.

#### Scenario: Two comparable years
- **WHEN** the charges so far are $20 with the open cycle half over, and '24 - '25 and '25 - '26 repriced give $50 and $60 for the open cycle and $700 and $780 after it
- **THEN** the projections are $745 for '24 - '25 and $830 for '25 - '26

### Requirement: Last year's running net
For a true-up year with one before it, the previous year's label and its running net at the end of each of its cycles SHALL be given; a cycle without a net SHALL have none.

#### Scenario: The current year
- **WHEN** the current year is requested with one cycle started
- **THEN** last year is '25 - '26, with a running net for all 12 of its cycles

#### Scenario: The first year
- **WHEN** '21 - '22 is requested
- **THEN** there is no last year

### Requirement: VPP season
A true-up year's VPP season SHALL be the one in the year it ends, from 2024 on: its payout and payment date when recorded, and an estimate of $2.00 per kWh the Powerwalls exported on the days from May 1 to October 31 marked as VPP days, with those kWh. Days not marked SHALL NOT count.

#### Scenario: 2026 so far
- **WHEN** the 2026 season's marked days have exported 183.8 kWh from the Powerwalls and no payout is recorded
- **THEN** '25 - '26's season is 2026 with an estimate of $367.60

#### Scenario: Before the first season
- **WHEN** '22 - '23 is requested
- **THEN** it has no VPP season

### Requirement: Cost data matches Flask's
`GET /api/true-up-cost?start_date=&end_date=` SHALL answer with status 200 and data equal to Flask's `/api/v2/true_up_cost` for every range from 2021-10-01 to 732 days after today, all its fields null but the newest rates' date unless the range is a true-up year, until change 7 (cutover) retires it. Other requests SHALL get status 400 and a message.

#### Scenario: Every true-up year
- **WHEN** a script requests each true-up year from `/api/true-up-cost` and from Flask's `/api/v2/true_up_cost`
- **THEN** the answers are equal, field by field

#### Scenario: A range that isn't a true-up year
- **WHEN** All Time or a custom range is requested
- **THEN** every field is null but `rates_effective`, as from Flask
