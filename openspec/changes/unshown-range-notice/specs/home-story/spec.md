## MODIFIED Requirements

### Requirement: A day from the year
The year chart SHALL label each month along its side and, in the current year, mark today's row. Pointing at or tapping a row, or dragging across the chart, SHALL show that day's date and solar kWh with a link that opens the day on the Solar page. In a window 768 pixels wide or more, where the readout sits beside the chart, the readout and the column it sits in SHALL stay in view while any part of the chart is on screen, so the readout of a row near the chart's foot can be read without scrolling back up.

#### Scenario: Tapping June 13
- **WHEN** a visitor taps the row for June 13, 2026
- **THEN** the chapter shows "June 13, 2026" with its solar kWh and a link to `/solar?start=2026-06-01&end=2026-06-30&day=2026-06-13`

#### Scenario: Dragging on a phone
- **WHEN** a visitor drags a finger down the chart from June into July
- **THEN** the readout follows each day under the finger

#### Scenario: Scrolling past it on a phone
- **WHEN** a visitor on a 390 by 844 screen scrolls down the page
- **THEN** the chart is at most half the screen's height, so most of the screen still scrolls the page

#### Scenario: Pointing at November on a laptop
- **WHEN** a visitor on a 1440 by 900 screen scrolls until the chart's November rows are on screen and points at November 10
- **THEN** the readout beside the chart is on screen and shows November 10 with its solar kWh
