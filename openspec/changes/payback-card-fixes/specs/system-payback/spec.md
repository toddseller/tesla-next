## MODIFIED Requirements

### Requirement: The Payback card
With a costs file, the True-Up Tracker SHALL show a Payback card for the system's whole life, whatever range is picked, giving solar's year, the year solar pays for the whole system, and the Powerwalls' year side by side, and saying which years are estimated. On wider screens its timeline SHALL run across the card with each marker's dot centred on the line, the line solid up to today and dashed from today to the whole-system year; on a phone it SHALL run down the card as a list of steps joined by a line, solid in solar's colour from PTO through today and grey after it, ending at the last step.

#### Scenario: Any year picked
- **WHEN** '22 - '23 or All time is shown
- **THEN** the Payback card shows the same years

#### Scenario: The timeline across the card
- **WHEN** the card is shown at 1280 pixels, with solar paid back in 2025, today in 2026 and the whole system projected for 2028
- **THEN** every marker's dot sits centred on the line, the line is solid in solar's colour up to today and dashed from today to 2028

#### Scenario: The timeline down a phone
- **WHEN** the card is shown at 375 pixels
- **THEN** its steps from 2021 to 2031 are joined by a line, in solar's colour from 2021 through today and grey after it, with no line after 2031, and today's dot is a hollow ring
