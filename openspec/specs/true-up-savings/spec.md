# true-up-savings Specification

## Purpose
Estimates what a true-up year's electricity cost the house, and what it would have cost with solar alone or with no system, so the True-Up Tracker can show what solar and the Powerwalls saved.

## Requirements

### Requirement: Three cases of each day
Each day with data SHALL have its grid energy in three cases, each as imports, exports and the net in peak hours (intervals starting 4 p.m. to 8:55 p.m. site time): actual, the grid as the True-Up Tracker counts it; solar only, from each 5-minute interval's house use less its solar, a positive difference imported and a negative one exported; no system, the house's whole use imported and nothing exported.

#### Scenario: A sunny interval
- **WHEN** an interval's house used 300 Wh, solar made 900 Wh and the Powerwalls stored 600 Wh
- **THEN** solar only exports 600 Wh in it, and no system imports 300 Wh

#### Scenario: An evening interval
- **WHEN** an interval at 6 p.m.'s house used 400 Wh, all from the Powerwalls, with no solar
- **THEN** solar only imports 400 Wh in it, counted in peak hours, and actual imports nothing

### Requirement: Days before the meter fix rebuilt from PG&E's meter
For a day before April 27, 2026 with PG&E's reading, the intervals' grid imports in peak hours SHALL be scaled to PG&E's peak imports, their imports in other hours to PG&E's other imports, and their exports likewise. Each interval's house use SHALL be its stored use plus what scaling added to its imports, less what it added to its exports. The day SHALL count as estimated.

#### Scenario: Tesla read half
- **WHEN** a day's intervals imported 4 kWh in peak hours and PG&E's meter recorded 8 kWh
- **THEN** each of that day's peak-hour imports is doubled, and its house use grows by what was added

#### Scenario: The day matches the meter
- **WHEN** a day before the fix with PG&E's reading is rebuilt
- **THEN** its actual case's imports, exports and peak net equal PG&E's for that day

#### Scenario: Nothing to scale
- **WHEN** the intervals imported nothing in a day's peak hours and PG&E's meter recorded 2 kWh
- **THEN** the 2 kWh is spread evenly over that day's peak-hour intervals

#### Scenario: No PG&E reading
- **WHEN** a day before April 27, 2026 has no PG&E reading
- **THEN** its intervals are used as stored, and the day counts as estimated

### Requirement: PG&E's charges in each case
Each case's PG&E charges SHALL be its billing cycles' NEM charges, each priced from that case's days as the true-up cost prices a cycle, summed over the started cycles. In the actual and solar-only cases, which are on NEM, the year's PG&E cost SHALL be the larger of those charges and the minimum delivery charges from the year's first day to its last day with data. The no-system case SHALL take its charges as they are.

#### Scenario: Credit in both NEM cases
- **WHEN** a year's actual NEM charges are -$58.03 and its solar-only charges are -$12.40, with $120.45 of minimum delivery charges
- **THEN** both cases cost $120.45 from PG&E

#### Scenario: Importing
- **WHEN** a year's actual NEM charges are $827.82 with $60.09 of minimum delivery charges
- **THEN** the actual case costs $827.82 from PG&E

### Requirement: WestLight's generation charges
Each case's WestLight charges SHALL be, per billing cycle, split by season and rate as PG&E's are, each period's net (peak, off-peak) times WestLight's generation rate for it; plus the revision's ECO100 premium per kWh on the periods netting an import; less its Net Generation Bonus per kWh on the periods netting an export, each line rounded to the cent.

#### Scenario: The October 2026 bill
- **WHEN** a cycle from 2026-09-03 to 2026-10-04 nets -58.9291 kWh in summer peak, 340.5411 in summer off-peak, -0.0372 in winter peak and 70.1781 in winter off-peak, at that bill's rates
- **THEN** its WestLight charges are $16.60: $4.11 of ECO100 at $0.01, -$0.59 of Net Generation Bonus at $0.01, and $13.08 of generation

#### Scenario: The November 2024 bill
- **WHEN** a cycle from 2024-10-04 to 2024-11-03 nets 104 kWh in winter off-peak and 56 in winter peak, at the 2024-08-01 rates with ECO100 at $0.01
- **THEN** its WestLight charges are $21.84: $12.23 and $8.01 of generation, $1.60 of ECO100, and no Net Generation Bonus

#### Scenario: The June 2025 bill
- **WHEN** a cycle from 2025-05-05 to 2025-06-03 nets -395 kWh in winter off-peak, -50 in summer off-peak, -92 in winter peak and -13 in summer peak, at the 2025-02-10 rates with ECO100 at $0.015 and the bonus at $0.01
- **THEN** its WestLight charges are -$70.17: -$44.01, -$5.74, -$12.46 and -$2.46 of generation, -$5.50 of Net Generation Bonus, and no ECO100

### Requirement: A year's WestLight cost
A year's WestLight cost in each case SHALL be the sum of its started cycles' WestLight charges, a credit counting in full, since WestLight cashes credit balances out.

#### Scenario: Credit in summer
- **WHEN** a year's cycles' WestLight charges sum to -$42.10
- **THEN** that case's WestLight cost is -$42.10

### Requirement: WestLight's rates
WestLight's E-TOU-C generation rates SHALL be a list of dated revisions, each with summer and winter peak and off-peak rates, an ECO100 premium and a Net Generation Bonus, from the revision in effect on 2024-08-01 on. A day SHALL be priced at the newest revision effective on or before it.

#### Scenario: A day past the newest revision
- **WHEN** a day is after the newest stored revision's date
- **THEN** it is priced at the newest revision, and the savings name that revision's date

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

### Requirement: Savings route
`GET /api/true-up-savings?start_date=&end_date=` SHALL answer with status 200 and `{"data": ...}`, the savings for that range or null, for every range from 2021-10-01 to 732 days after today. Other requests SHALL get status 400 and a message.

#### Scenario: A true-up year
- **WHEN** `/api/true-up-savings?start_date=2024-10-01&end_date=2025-09-30` is requested
- **THEN** it answers '24 - '25's savings

#### Scenario: A bad date
- **WHEN** `/api/true-up-savings?start_date=2024-13-01&end_date=2025-09-30` is requested
- **THEN** it answers status 400 with a message

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

### Requirement: The batteries' efficiency
The efficiency peak-only refills with SHALL be the Powerwalls' discharge over their charge on the year's used days, from the 5-minute data, so it carries the used days' standby draw and neither held days' top-ups nor VPP events.

#### Scenario: A held day only charging
- **WHEN** a year's used day discharged 5.4 kWh of 6 kWh charged, and its held day charged 7 kWh and discharged nothing
- **THEN** the efficiency is 0.9

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
