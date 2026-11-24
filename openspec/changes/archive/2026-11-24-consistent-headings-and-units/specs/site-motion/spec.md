## MODIFIED Requirements

### Requirement: True-Up's figures count up when first seen
When the True-Up Tracker is first viewed, its tiles' and savings card's amounts (kWh, dollars and percentages) SHALL count up from zero to their values in 400 ms, easing out. Calendar years SHALL show as they are. A figure SHALL count up only on the page's first view, never on a reload or a new range. Counting SHALL not change the size of anything, and the final figure SHALL be in the page for assistive technology from the start.

#### Scenario: Opening the page
- **WHEN** a viewer opens the True-Up Tracker, its tiles reading 1.8 MWh imported and a placeholder $410 of charges so far
- **THEN** both figures count up from 0 to their values in 400 ms, and the tiles keep their size while they count

#### Scenario: The Payback card's years
- **WHEN** the Payback card shows solar paid back in 2025
- **THEN** its heading reads 2025 at once, without counting

#### Scenario: A reload
- **WHEN** a `totals` event changes the charges so far after the page has opened
- **THEN** the figure changes without counting from zero

#### Scenario: A screen reader
- **WHEN** a screen reader reads a tile while it counts
- **THEN** it reads the final figure

#### Scenario: Reduced motion
- **WHEN** a viewer with reduced motion on opens the True-Up Tracker
- **THEN** each card's figures appear at their values at once
