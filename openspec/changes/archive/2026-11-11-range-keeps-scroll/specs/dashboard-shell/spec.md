## ADDED Requirements

### Requirement: Picking a range keeps the reader's place
On every page with range presets, choosing a preset, an Earlier true-up year, or dates from the custom range picker SHALL change the shown range without scrolling the page. The page SHALL stay scrolled where it was, and the range change SHALL still be a new entry in the browser's history.

#### Scenario: A short window on Solar
- **WHEN** a viewer on the Solar page, in a window short enough that the forecast card pushes "Solar by date range" below the fold, scrolls down to the chart and picks This year
- **THEN** the chart shows This year and the page stays scrolled to the chart

#### Scenario: Dates from the picker
- **WHEN** a viewer scrolled down on the Impact page picks October 1 to 31, 2026 in the custom range picker
- **THEN** the page shows October 2026 and stays scrolled where it was

#### Scenario: An earlier true-up year
- **WHEN** a viewer scrolled down on `/true-up` picks '22 - '23 from the Earlier menu
- **THEN** the page shows that year and stays scrolled where it was

#### Scenario: Back after a range change
- **WHEN** a viewer on This month picks This year and then goes back in the browser
- **THEN** the page shows This month again
