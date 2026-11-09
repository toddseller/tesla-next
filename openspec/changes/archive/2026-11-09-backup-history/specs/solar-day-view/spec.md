# Spec Delta

## ADDED Requirements

### Requirement: Off-grid and storm watch spans on the day's charts
Every view's charts SHALL shade the day's off-grid spans and storm watch spans across their full height, cut to the day, the two told apart by their shading. Below the charts the day view SHALL list each span: "Off grid" with its kind, or "Storm watch", from its start to its end in the site's time zone, "midnight" for an edge past the day and "now" for a span still open.

#### Scenario: An outage day
- **WHEN** the day view shows 2024-02-04, with an outage from 2:51 PM lasting 52.3 hours
- **THEN** every chart is shaded from 2:51 PM to midnight, and the list reads Off grid (outage) 2:51 PM to midnight

#### Scenario: A blip
- **WHEN** the day has an 18-second blip at 9:14 AM
- **THEN** it is listed as Off grid (blip) 9:14 AM to 9:14 AM, however thin its shading

#### Scenario: A day without spans
- **WHEN** the day has no off-grid or storm watch span
- **THEN** the charts carry no shading and no list is shown

### Requirement: Grid charging during storm watch
Each listed storm watch span SHALL give the energy the Powerwalls took from the grid during it on the shown day, in kWh to one decimal.

#### Scenario: Storm watch charging overnight
- **WHEN** storm watch ran from 8:00 PM to midnight and the Powerwalls charged 12.4 kWh from the grid in that time
- **THEN** the list reads Storm watch 8:00 PM to midnight, 12.4 kWh charged from the grid
