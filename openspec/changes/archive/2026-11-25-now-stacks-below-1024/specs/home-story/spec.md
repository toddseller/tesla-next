# Spec Delta

## MODIFIED Requirements

### Requirement: The house scene in Now
The Now chapter SHALL show the Distribution page's live house scene beside its sentence, drawn and updated as live-flow-scene and scene-weather specify, with its stale warning, and without the replay controls. Below 1024 pixels the scene SHALL sit under the sentence at the content's width.

#### Scenario: Opening the site
- **WHEN** a visitor opens `/` at 3:39 PM with solar at 0.7 kW and 0.5 kW coming from the grid
- **THEN** the Now chapter shows the same scene `/distribution` shows at that moment, with its flows, weather and labels, and no replay bar

#### Scenario: A phone
- **WHEN** a visitor opens `/` on a 390-pixel-wide screen
- **THEN** the scene sits under the sentence at the screen's width, and nothing scrolls sideways

#### Scenario: A tablet
- **WHEN** a visitor opens `/` in a 768-pixel-wide window
- **THEN** the scene sits under the sentence at the content's width, its labels apart, and nothing scrolls sideways

#### Scenario: A laptop
- **WHEN** a visitor opens `/` in a 1024-pixel-wide window
- **THEN** the scene sits beside the sentence

### Requirement: A day from the year
The year chart SHALL label each month along its side and, in the current year, mark today's row. Pointing at or tapping a row, or dragging across the chart, SHALL show that day's date and solar kWh with a link that opens the day on the Solar page. In a window 1024 pixels wide or more, where the readout sits beside the chart, the readout and the column it sits in SHALL stay in view while any part of the chart is on screen, so the readout of a row near the chart's foot can be read without scrolling back up. In a narrower window the readout, its day buttons and its link SHALL sit above the chart, and the chart SHALL be at most half the window's height, so a visitor who sees the whole chart also sees the day they tap.

#### Scenario: Tapping June 13
- **WHEN** a visitor taps the row for June 13, 2026
- **THEN** the chapter shows "June 13, 2026" with its solar kWh and a link to `/solar?start=2026-06-01&end=2026-06-30&day=2026-06-13`

#### Scenario: Dragging on a phone
- **WHEN** a visitor drags a finger down the chart from June into July
- **THEN** the readout follows each day under the finger

#### Scenario: Scrolling past it on a phone
- **WHEN** a visitor on a 390 by 844 screen scrolls down the page
- **THEN** the chart is at most half the screen's height, so most of the screen still scrolls the page

#### Scenario: Tapping a day on a phone
- **WHEN** a visitor on a 390 by 844 screen scrolls until the whole chart is on screen and taps a row in November
- **THEN** the readout above the chart is on screen and shows that November day with its solar kWh, and "Open the day" is on screen with it

#### Scenario: Tapping a day on a small tablet
- **WHEN** a visitor on a 744 by 1133 screen scrolls until the whole chart is on screen and taps a row in November
- **THEN** the chart is at most half the screen's height, and the readout above it is on screen showing that November day

#### Scenario: Pointing at November on a laptop
- **WHEN** a visitor on a 1440 by 900 screen scrolls until the chart's November rows are on screen and points at November 10
- **THEN** the readout beside the chart is on screen and shows November 10 with its solar kWh

#### Scenario: Tapping a day on a tablet
- **WHEN** a visitor in a 768 by 1024 window scrolls until the whole chart is on screen and taps a row in November
- **THEN** the readout, its day buttons and "Open the day" sit above the chart and are on screen showing that November day, and nothing scrolls sideways
