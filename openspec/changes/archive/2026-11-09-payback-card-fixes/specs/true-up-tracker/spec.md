## MODIFIED Requirements

### Requirement: The Payback card on the page
The True-Up Tracker SHALL show the Payback card (see system-payback) right after the savings card, or after the tiles and metering note when no savings card is shown, for every range, rendered with the page and reloaded when the savings are.

#### Scenario: A totals event
- **WHEN** a `totals` event arrives for today
- **THEN** the Payback card updates in place, with no page reload

#### Scenario: A true-up year
- **WHEN** a true-up year with savings is shown
- **THEN** the Payback card follows the savings card and comes before the billing-cycle chart

#### Scenario: All time
- **WHEN** All time is shown, with no savings card
- **THEN** the Payback card follows the tiles and comes before the billing-cycle chart
