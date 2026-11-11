# Spec Delta

## MODIFIED Requirements

### Requirement: The costs stay private
The system's costs SHALL be read from a file on the server named by `SYSTEM_COSTS_FILE`, never from the repository. No cost, net cost, amount left or share of cost recovered SHALL appear in any page or route answer, only years, and the month solar paid back once it has. Without the file, or with one that can't be read, the page SHALL show no Payback card and the route SHALL answer null.

#### Scenario: No costs file
- **WHEN** `SYSTEM_COSTS_FILE` is not set
- **THEN** `/api/payback` answers `{"data": null}` and the True-Up Tracker has no Payback card

#### Scenario: Nothing but years
- **WHEN** `/api/payback` answers with a costs file present
- **THEN** its answer holds years, estimate markers and the month solar paid back, and no dollar amount of cost

### Requirement: Payback data
`GET /api/payback` SHALL answer with status 200 and `{"data": {...}}` holding solar's payback year, and its month once solar has paid back, and the year solar pays for the whole system, each with whether it is projected and whether estimated years count toward it, and the Powerwalls' payback year or that they won't pay back, or `{"data": null}` without a costs file. A projected payback SHALL give its year alone.

#### Scenario: The route
- **WHEN** `/api/payback` is requested with a costs file, solar having paid back in June 2025
- **THEN** it answers the card's years and solar's month, `2025-06`, marking that '21 - '22 and '22 - '23 were estimated

#### Scenario: Not paid back yet
- **WHEN** solar's payback is projected for 2027
- **THEN** it answers the year 2027 and no month

### Requirement: The Payback card
With a costs file, the True-Up Tracker SHALL show a Payback card for the system's whole life, whatever range is picked, giving solar's year, the year solar pays for the whole system, and the Powerwalls' year side by side, and saying which years are estimated. On wider screens its timeline SHALL run across the card with each marker's dot centred on the line, solar's paid-back dot at the middle of its month and every other year's at mid-year, the line solid up to today and dashed from today to the whole-system year; on a phone it SHALL run down the card as a list of steps joined by a line, solid in solar's colour from PTO through today, dashed in solar's colour from today to the whole-system year and grey after it, ending at the last step.

#### Scenario: Any year picked
- **WHEN** '22 - '23 or All time is shown
- **THEN** the Payback card shows the same years

#### Scenario: The timeline across the card
- **WHEN** the card is shown at 1280 pixels, with solar paid back in 2025, today in 2026 and the whole system projected for 2028
- **THEN** every marker's dot sits centred on the line, solar's at mid-March 2025 when it paid back in March, the line is solid in solar's colour up to today and dashed from today to 2028

#### Scenario: The timeline down a phone
- **WHEN** the card is shown at 375 pixels, with the whole system projected for 2028
- **THEN** its steps from 2021 to 2031 are joined by a line, solid in solar's colour from 2021 through today, dashed in solar's colour from today to 2028 and grey after it, with no line after 2031, and today's dot is a hollow ring
