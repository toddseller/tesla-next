# Spec Delta

## MODIFIED Requirements

### Requirement: WestLight's rates
WestLight's E-TOU-C generation rates SHALL be a list of dated revisions, each with summer and winter peak and off-peak rates, an ECO100 premium and a Net Generation Bonus, from the revision in effect on 2023-09-01 on. A day SHALL be priced at the newest revision effective on or before it. Revisions before 2024-08-01 SHALL be marked as estimated: PG&E's E-TOU-C generation rate for each period in effect then, times that period's ratio of WestLight's first known rate (2024-08-01) to PG&E's generation rate in effect that day, with ECO100's premium and the Net Generation Bonus at 1 cent.

#### Scenario: A day past the newest revision
- **WHEN** a day is after the newest stored revision's date
- **THEN** it is priced at the newest revision, and the savings name that revision's date

#### Scenario: An estimated revision
- **WHEN** PG&E's summer peak generation rate is $0.21555 on 2024-08-01, when WestLight's is $0.20001, and $0.23623 from 2024-06-01
- **THEN** WestLight's estimated summer peak rate from 2024-06-01 is $0.21920, $0.23623 × 0.20001 / 0.21555, marked as estimated

### Requirement: A true-up year's savings
For a true-up year from '23 - '24 on, the first with PG&E's rates and readings stored, the savings SHALL give each case's cost (PG&E plus WestLight), what solar saved (no system less solar only), what the Powerwalls added (solar only less actual) and its split into held, VPP event, storm watch and used days, the number of each, the peak-only case's cost and the batteries' efficiency, the number of estimated days, the last day counted, the dates of the newest PG&E and WestLight rates used, and whether any WestLight rate used was estimated. The current year SHALL count its days so far. Any other range SHALL have no savings.

#### Scenario: '24 - '25
- **WHEN** '24 - '25 costs $7,508.26 with no system, $799.98 with solar only and $946.82 actual
- **THEN** solar saved $6,708.28 and the Powerwalls added -$146.84

#### Scenario: '23 - '24, with estimated generation rates
- **WHEN** '23 - '24 is requested
- **THEN** there are savings, saying that WestLight's rates used were estimated

#### Scenario: Before WestLight's known rates
- **WHEN** '22 - '23 is requested, before even the estimated rates
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
