## MODIFIED Requirements

### Requirement: The Payback card tells its story
On the True-Up Tracker's first view, the Payback card's timeline SHALL show only its grey track until half of it has scrolled into view. Then the line SHALL draw at an even pace that would cross the whole track in 3 s, stopping 600 ms at each mark while the mark lands: solid to solar's mark, on to Today, dashed to the whole system's mark, then the Powerwall warranty. It SHALL play once, and the timeline SHALL show complete when the page runs without JavaScript.

#### Scenario: Across the card
- **WHEN** the page is first viewed at 1280 pixels, with solar paid back in 2025, today in 2026 and the whole system projected for 2028, and the viewer scrolls down to the Payback card
- **THEN** once half its timeline is in view, the solid line draws to 2025 and stops while Solar paid back lands, goes on to Today, the dashed line draws to 2028 and stops while its mark lands, and the warranty mark lands last, all within about 4 s

#### Scenario: A mark lands
- **WHEN** the line reaches a mark
- **THEN** its dot pops in, overshooting a little before settling, and sends out one soft ring; its connector draws up; and its label fades in while growing past its size and settling back, Solar paid back's the most

#### Scenario: Solar's month
- **WHEN** Solar paid back has landed, solar having paid back in June 2025
- **THEN** "Jun '25" fades in under the label on wider screens, while the connector, drawn up to the label, shrinks down from it to make room; on a phone "Jun '25" fades in beside the label

#### Scenario: Down a phone
- **WHEN** the page is first viewed at 375 pixels and the Payback card is scrolled into view
- **THEN** the same story plays down its steps: the solid rail to 2025 and Today, the dashed rail to 2028, each step landing as the rail reaches it

#### Scenario: A reload
- **WHEN** a `totals` event updates the Payback card after it has told its story
- **THEN** the timeline shows its new state at once, without replaying

#### Scenario: Reduced motion
- **WHEN** a viewer with reduced motion on opens the True-Up Tracker
- **THEN** the Payback card's timeline shows complete at once

#### Scenario: Without JavaScript
- **WHEN** the page's JavaScript doesn't run
- **THEN** the Payback card's timeline shows complete

#### Scenario: A screen reader
- **WHEN** a screen reader reaches the timeline while the story plays
- **THEN** it reads every year at once, as before
