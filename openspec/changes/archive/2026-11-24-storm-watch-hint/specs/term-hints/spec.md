# Spec Delta

## MODIFIED Requirements

### Requirement: Where the terms are hinted
Each page SHALL hint each of its terms once, where a visitor first meets it, and leave the rest of the page's wording as it is. A term that doesn't appear on the page (no surplus, no storm watch day) SHALL have no hint. The top bar is not part of a page's count: its hint stands apart from the page's own.

#### Scenario: No surplus
- **WHEN** a past year's true-up tile shows an amount due, so Net Surplus Compensation isn't mentioned
- **THEN** there is no Net Surplus Compensation hint

#### Scenario: Switches already explained
- **WHEN** a visitor reads the Corrected / As Tesla reported switch or Top Ten's VPP switch
- **THEN** there is no hint on them; the note under the readings switch and Top Ten's footnote explain them

#### Scenario: Storm watch in the top bar and on the page
- **WHEN** storm watch is active and a visitor opens `/true-up` for a year with a storm watch day
- **THEN** both the top bar's STORM WATCH and the Powerwalls' parts' "Storm watch" are hinted, with the same definition

## ADDED Requirements

### Requirement: The top bar's term
The top bar SHALL hint "STORM WATCH" in its storm watch pill, on every page, whenever the pill shows. The pill's other pills (OFF GRID, OFF GRID TEST) SHALL have no hint.

#### Scenario: Storm watch active
- **WHEN** a visitor on any page taps STORM WATCH in the top bar
- **THEN** the storm watch definition opens beside it, and tapping elsewhere closes it

#### Scenario: Off the grid
- **WHEN** the top bar reads OFF GRID or OFF GRID TEST
- **THEN** the pill has no hint
