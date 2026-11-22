## MODIFIED Requirements

### Requirement: Layout
On a 375-pixel-wide screen the page SHALL show its tiles, chart and cycle list in one column with no horizontal scrolling and nothing overlapping; on wider screens the tiles SHALL sit side by side as they fit, and from 1280 pixels five tiles SHALL sit on one row.

#### Scenario: Phone
- **WHEN** a viewer opens the current year on a 375-pixel-wide screen
- **THEN** every tile, the chart and every cycle's figures are visible without scrolling sideways

#### Scenario: Five tiles on a wide screen
- **WHEN** a viewer opens the current year at 1440 pixels, with its net, charges, projection, billed and VPP tiles
- **THEN** all five sit on one row, each figure whole within its tile
