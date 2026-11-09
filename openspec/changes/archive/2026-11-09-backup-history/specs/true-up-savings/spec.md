# Spec Delta

## ADDED Requirements

### Requirement: Outages are dark without the Powerwalls
In the solar-only and no-system cases, the part of each 5-minute interval inside a backup event of the outage or blip kind (see backup-history) SHALL import and export nothing, since without the Powerwalls the house has no power while the grid is down. Tests and commissioning events SHALL count as on the grid. The actual case SHALL be unchanged.

#### Scenario: An evening outage
- **WHEN** an outage covers the whole 6 p.m. interval, in which the house used 400 Wh from the Powerwalls with no solar
- **THEN** solar only and no system import nothing in it, and actual imports nothing

#### Scenario: Half an interval
- **WHEN** an outage begins halfway through an interval whose house used 300 Wh with no solar
- **THEN** solar only and no system import 150 Wh in it

#### Scenario: A test
- **WHEN** a test covers an interval whose house used 200 Wh with no solar
- **THEN** solar only imports 200 Wh in it, as on any other day

## MODIFIED Requirements

### Requirement: Used, held and VPP event days
Each day SHALL be a VPP event day when it is marked as a VPP day, as the VPP credit counts them. Any other day SHALL be a storm watch day when a stretch of the site's state with storm watch active overlaps it in the site's time zone. Any other day SHALL be held when the Powerwalls discharged less than 1 kWh between 4 and 9 p.m. while the house's use in those hours exceeded its solar by more than 1 kWh, and used otherwise. The shortfall SHALL come from the house's use and solar, rebuilt as for the three cases, so days before the meter fix are classified like any other.

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

#### Scenario: Storm watch
- **WHEN** storm watch ran from 8 p.m. one day to 6 a.m. the next, neither marked as a VPP day
- **THEN** both days are storm watch days

#### Scenario: Storm watch on a VPP day
- **WHEN** a day marked as a VPP day also had storm watch
- **THEN** the day is a VPP event day

### Requirement: The Powerwalls' effect split
What the Powerwalls added SHALL be split into four parts by pricing the year with more of its days as solar only, the rest as they were: the held part is the price with held days as solar only, less the actual cost; the VPP part is the price with held and VPP event days as solar only, less the held price; the storm watch part is the price with held, VPP event and storm watch days as solar only, less the held and VPP price; the used part is the solar-only cost less that price. The four parts SHALL sum to what the Powerwalls added.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 costs $1,118.07 actual, $1,034.67 with its held days as solar only, $1,077.17 with its held and VPP event days as solar only, and $966.56 solar only, with no storm watch days
- **THEN** the held days added -$83.40, the VPP event days $42.50, the storm watch days $0.00 and the used days -$110.61, summing to -$151.51

#### Scenario: A year with storm watch
- **WHEN** a year costs $1,000.00 with its held and VPP event days as solar only and $1,030.00 with its storm watch days as solar only too
- **THEN** the storm watch days added $30.00 and the used part is the solar-only cost less $1,030.00

### Requirement: A true-up year's savings
For a true-up year from '24 - '25 on, the first with WestLight's rates known, the savings SHALL give each case's cost (PG&E plus WestLight), what solar saved (no system less solar only), what the Powerwalls added (solar only less actual) and its split into held, VPP event, storm watch and used days, the number of each, the peak-only case's cost and the batteries' efficiency, the number of estimated days, the last day counted, and the dates of the newest PG&E and WestLight rates used. The current year SHALL count its days so far. Any other range SHALL have no savings.

#### Scenario: '24 - '25
- **WHEN** '24 - '25 costs $7,508.26 with no system, $799.98 with solar only and $946.82 actual
- **THEN** solar saved $6,708.28 and the Powerwalls added -$146.84

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
- **WHEN** '25 - '26's peak-only case costs $985.01 against $1,118.07 actual
- **THEN** its savings give both costs, so the card can say peak-only would have cost $133.06 less

### Requirement: Peak-only case
A peak-only case SHALL price the year with its held, VPP event and storm watch days as they were and each used day as solar only, except that the Powerwalls cover the house's shortfall in each 4 to 9 p.m. interval, every kWh covered taken back off that day's solar-only exports divided by the batteries' efficiency, and imported off-peak when the exports run short.

#### Scenario: A summer day
- **WHEN** a used day's solar-only case imports 5 kWh from 4 to 9 p.m. and exports 20 kWh off-peak, with an efficiency of 0.9
- **THEN** its peak-only case imports nothing from 4 to 9 p.m. and exports 14.44 kWh off-peak

#### Scenario: Not enough to refill
- **WHEN** a used day's solar-only case imports 5 kWh from 4 to 9 p.m. and exports 3 kWh, with an efficiency of 0.9
- **THEN** its peak-only case exports nothing and imports 2.56 kWh off-peak

#### Scenario: A held day or a VPP event
- **WHEN** a day is held, or a VPP event day
- **THEN** its peak-only case is the day as it was, since the owner holds charge and takes part in events whatever the mode

#### Scenario: A storm watch day
- **WHEN** a day is a storm watch day
- **THEN** its peak-only case is the day as it was, since Tesla charges for storm watch whatever the mode
