## MODIFIED Requirements

### Requirement: The forecast card
The Solar page's range view SHALL show a "Solar forecast" card below the range chart, served with the page, with a tile for today and one for each of the next three days, site time, and a footnote saying the figures are the forecast sunlight scaled by the panels' last 30 days, that bars run to a good day with its kWh, and that a forecast is usually within about 4 kWh, coastal fog being hardest to call. The card SHALL show only when the range includes today. A day's own view SHALL NOT show the card.

#### Scenario: Opening the Solar page
- **WHEN** a viewer opens `/solar` on November 10, 2026
- **THEN** the first response holds the Solar forecast card, with Today, Tomorrow, Thursday and Friday, below the range chart

#### Scenario: A past range
- **WHEN** a viewer opens `/solar?start=2023-04-01&end=2023-04-30` on November 10, 2026
- **THEN** the page shows April 2023's bars without the forecast card

#### Scenario: A range running past today
- **WHEN** a viewer opens the true-up year 2026-10-01 to 2027-09-30 on November 10, 2026
- **THEN** the page shows the forecast card below the chart

#### Scenario: A day's view
- **WHEN** a viewer opens `/solar?day=2026-11-09`
- **THEN** the page shows that day without the forecast card
