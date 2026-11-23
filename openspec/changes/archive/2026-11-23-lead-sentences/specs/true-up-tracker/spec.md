## ADDED Requirements

### Requirement: The headline
When a true-up year has something its tiles don't say, the page SHALL lead with it as a headline sentence (about 32 pixels, its figures in mono), the "True-Up Tracker" title becoming a small label above it and the subtitle giving way to it. Without a headline the title and subtitle SHALL stay as they are.

#### Scenario: All time
- **WHEN** All time is shown
- **THEN** the page has no headline, and "True-Up Tracker" heads it with its subtitle

### Requirement: The current year's headline
With dollar projections, the headline SHALL give the lowest and highest projected amount due in whole dollars, the true-up's month, and the charges so far when there are any: "On track to owe $611 to $657 at the October 2027 true-up; $180 in charges so far." With a kWh projection only, it SHALL give the projected year-end net. A muted line under it SHALL name the years the projection comes from.

#### Scenario: Two comparable years
- **WHEN** the current year projects $611.45 and $656.69, and 2,092.1 and 2,376.1 kWh imported, from '24 - '25 and '25 - '26, with $180.23 of charges so far
- **THEN** the headline reads "On track to owe $611 to $657 at the October 2027 true-up; $180 in charges so far.", over "Year-end 2,092 to 2,376 kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26"

#### Scenario: Without rates
- **WHEN** the current year has a kWh projection of 2,092.1 and 2,376.1 kWh imported and no dollar projections
- **THEN** the headline reads "On track to end '26 - '27 with 2,092 to 2,376 kWh imported.", over "If the rest of the year goes like '24 - '25 or '25 - '26"

#### Scenario: A projection crossing zero
- **WHEN** the kWh projection runs from 120 kWh exported to 80 kWh imported, without dollars
- **THEN** the headline reads "On track to end '26 - '27 between 120 kWh exported and 80 kWh imported."

#### Scenario: No projection yet
- **WHEN** the current year has no kWh projection
- **THEN** the page has no headline

### Requirement: A past year's headline
For a finished year whose amount due is known, and the year before's too, the headline SHALL give the amount in whole dollars against the year before's: "'25 - '26 ended owing $768 at the true-up, $213 more than '24 - '25." It SHALL read "less than" for a smaller amount and "the same as" for an equal one, and "ended with nothing due" when nothing was due. Without both amounts there SHALL be no headline.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, owing $767.73, and '24 - '25 owed $554.83
- **THEN** the headline reads "'25 - '26 ended owing $768 at the true-up, $213 more than '24 - '25."

#### Scenario: Less than the year before
- **WHEN** '26 - '27 is shown owing $500.00, and '25 - '26 owed $767.73
- **THEN** the headline reads "'26 - '27 ended owing $500 at the true-up, $268 less than '25 - '26."

#### Scenario: Nothing due
- **WHEN** '26 - '27 is shown with nothing due, and '25 - '26 owed $767.73
- **THEN** the headline reads "'26 - '27 ended with nothing due at the true-up, $768 less than '25 - '26."

#### Scenario: The year before unknown
- **WHEN** '23 - '24 is shown, and '22 - '23's amount isn't known
- **THEN** the page has no headline

## MODIFIED Requirements

### Requirement: Layout
On a 375-pixel-wide screen the page SHALL show its tiles, chart and cycle list in one column with no horizontal scrolling and nothing overlapping; on wider screens the tiles SHALL sit side by side as they fit, and from 1280 pixels every tile SHALL sit on one row.

#### Scenario: Phone
- **WHEN** a viewer opens the current year on a 375-pixel-wide screen
- **THEN** the headline, every tile, the chart and every cycle's figures are visible without scrolling sideways

#### Scenario: Five tiles on a wide screen
- **WHEN** a viewer opens the current year at 1440 pixels, with its net, charges, billed and VPP tiles
- **THEN** all four sit on one row, each figure whole within its tile

## REMOVED Requirements

### Requirement: Projection tile
**Reason**: The current year's headline gives the projection, and a tile repeating it under the headline says nothing new.
**Migration**: The projected amount due moves into the headline and the projected year-end net and its years into the muted line under it (see "The current year's headline").
