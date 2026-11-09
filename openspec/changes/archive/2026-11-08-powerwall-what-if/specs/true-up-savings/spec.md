# Spec Delta

## ADDED Requirements

### Requirement: Used, held and VPP event days
Each day SHALL be a VPP event day when it is marked as a VPP day, as the VPP credit counts them. Any other day SHALL be held when the Powerwalls discharged less than 1 kWh between 4 and 9 p.m. while the house's use in those hours exceeded its solar by more than 1 kWh, and used otherwise. The shortfall SHALL come from the house's use and solar, rebuilt as for the three cases, so days before the meter fix are classified like any other.

#### Scenario: A poor-solar day held in Savings mode
- **WHEN** a day's Powerwalls discharged nothing from 4 to 9 p.m. while the house used 6.2 kWh more than its solar in those hours
- **THEN** the day is held

#### Scenario: A sunny day in Self-Powered mode
- **WHEN** a day's Powerwalls discharged 6.5 kWh from 4 to 9 p.m.
- **THEN** the day is used

#### Scenario: Nothing to cover
- **WHEN** a day's solar covered the house from 4 to 9 p.m. within 1 kWh and the Powerwalls stayed idle
- **THEN** the day is used, since there was nothing to hold back from

#### Scenario: A VPP event
- **WHEN** a day marked as a VPP day had the Powerwalls export 12 kWh to the grid in the evening
- **THEN** the day is a VPP event day, neither held nor used

### Requirement: The Powerwalls' effect split
What the Powerwalls added SHALL be split into three parts by pricing the year with more of its days as solar only, the rest as they were: the held part is the price with held days as solar only, less the actual cost; the VPP part is the price with held and VPP event days as solar only, less the held price; the used part is the solar-only cost less that price. The three parts SHALL sum to what the Powerwalls added.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 costs $1,118.07 actual, $1,034.99 with its held days as solar only, $1,077.49 with its held and VPP event days as solar only, and $967.23 solar only
- **THEN** the held days added -$83.08, the VPP event days $42.50 and the used days -$110.26, summing to -$150.84

### Requirement: Peak-only case
A peak-only case SHALL price the year with its held and VPP event days as they were and each used day as solar only, except that the Powerwalls cover the house's shortfall in each 4 to 9 p.m. interval, every kWh covered taken back off that day's solar-only exports divided by the batteries' efficiency, and imported off-peak when the exports run short.

#### Scenario: A summer day
- **WHEN** a used day's solar-only case imports 5 kWh from 4 to 9 p.m. and exports 20 kWh off-peak, with an efficiency of 0.9
- **THEN** its peak-only case imports nothing from 4 to 9 p.m. and exports 14.44 kWh off-peak

#### Scenario: Not enough to refill
- **WHEN** a used day's solar-only case imports 5 kWh from 4 to 9 p.m. and exports 3 kWh, with an efficiency of 0.9
- **THEN** its peak-only case exports nothing and imports 2.56 kWh off-peak

#### Scenario: A held day or a VPP event
- **WHEN** a day is held, or a VPP event day
- **THEN** its peak-only case is the day as it was, since the owner holds charge and takes part in events whatever the mode

### Requirement: The batteries' efficiency
The efficiency peak-only refills with SHALL be the Powerwalls' discharge over their charge on the year's used days, from the 5-minute data, so it carries the used days' standby draw and neither held days' top-ups nor VPP events.

#### Scenario: A held day only charging
- **WHEN** a year's used day discharged 5.4 kWh of 6 kWh charged, and its held day charged 7 kWh and discharged nothing
- **THEN** the efficiency is 0.9

## MODIFIED Requirements

### Requirement: A true-up year's savings
For a true-up year from '24 - '25 on, the first with WestLight's rates known, the savings SHALL give each case's cost (PG&E plus WestLight), what solar saved (no system less solar only), what the Powerwalls added (solar only less actual) and its split into held, VPP event and used days, the number of each, the peak-only case's cost and the batteries' efficiency, the number of estimated days, the last day counted, and the dates of the newest PG&E and WestLight rates used. The current year SHALL count its days so far. Any other range SHALL have no savings.

#### Scenario: '24 - '25
- **WHEN** '24 - '25 costs $7,549.41 with no system, $814.54 with solar only and $946.82 actual
- **THEN** solar saved $6,734.87 and the Powerwalls added -$132.28

#### Scenario: Before WestLight's known rates
- **WHEN** '23 - '24 is requested
- **THEN** there are no savings

#### Scenario: Not a true-up year
- **WHEN** 2025-01-01 to 2025-12-31 is requested
- **THEN** there are no savings

#### Scenario: The Powerwalls cost money
- **WHEN** a year's actual cost is above its solar-only cost
- **THEN** the Powerwalls added a negative amount, given as it is

#### Scenario: Peak-only against what happened
- **WHEN** '25 - '26's peak-only case costs $985.39 against $1,118.07 actual
- **THEN** its savings give both costs, so the card can say peak-only would have cost $132.68 less
