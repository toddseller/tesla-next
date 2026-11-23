## MODIFIED Requirements

### Requirement: The forecast card
The Solar page's range view SHALL show a "Solar forecast" card below the range chart, served with the page, with a tile for today and one for each of the next three days, site time, and a footnote saying the figures are the forecast sunlight scaled by the panels' last 30 days, that bars run to a good day with its kWh, and that a forecast is usually within about 4 kWh, coastal fog being hardest to call. A day's own view SHALL NOT show the card.

#### Scenario: Opening the Solar page
- **WHEN** a viewer opens `/solar` on November 10, 2026
- **THEN** the first response holds the Solar forecast card, with Today, Tomorrow, Thursday and Friday, below the range chart

#### Scenario: A day's view
- **WHEN** a viewer opens `/solar?day=2026-11-09`
- **THEN** the page shows that day without the forecast card
