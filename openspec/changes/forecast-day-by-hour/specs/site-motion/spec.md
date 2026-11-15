## MODIFIED Requirements

### Requirement: The estimate draws before what happened
Where a chart shows an estimate next to what actually happened, the estimate SHALL draw first, left to right at an even pace. What happened SHALL start drawing when the estimate is halfway across, easing out. This applies to the day view's Solar chart and to the forecast card's Today bar and Today by hour chart. The forecast card's hourly chart SHALL draw in again each time another day is chosen.

#### Scenario: The day view's Solar chart
- **WHEN** the Solar view of a day with an expected line draws in
- **THEN** the expected line draws left to right over 600 ms at an even pace, and the flows start drawing 300 ms in, over 600 ms, easing out

#### Scenario: The forecast card's Today bar
- **WHEN** the forecast card first shows today's bar
- **THEN** the expected track uncovers over 450 ms at an even pace, and the made bar starts growing into it 225 ms in

#### Scenario: A day with no expected line
- **WHEN** the Solar view draws a day from the first week of service, which has no expected line
- **THEN** the flows draw in left to right as the only layer, with no wait

#### Scenario: Choosing a day ahead
- **WHEN** the viewer presses Thursday's tile on the forecast card
- **THEN** Thursday's faded columns draw in as the only layer, with no wait

#### Scenario: Back to Today
- **WHEN** the viewer presses Today's tile with Thursday chosen
- **THEN** today's faded columns draw in first and its made columns start halfway, as when the card first shows
