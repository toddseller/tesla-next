# Spec Delta

## ADDED Requirements

### Requirement: True-Up's figures count up when first seen
When the True-Up Tracker is first viewed, its tiles' and savings card's amounts (kWh, dollars and percentages) SHALL count up from zero to their values in 400 ms, easing out. Calendar years SHALL show as they are. A figure SHALL count up only on the page's first view, never on a reload or a new range. Counting SHALL not change the size of anything, and the final figure SHALL be in the page for assistive technology from the start.

#### Scenario: Opening the page
- **WHEN** a viewer opens the True-Up Tracker, its tiles reading 1,840 kWh imported and a placeholder $410 of charges so far
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

### Requirement: The Payback card tells its story
On the True-Up Tracker's first view, the Payback card's timeline SHALL show only its grey track until half of it has scrolled into view. Then the line SHALL draw at an even pace that would cross the whole track in 6 s, stopping 900 ms at each mark while the mark lands: solid to solar's mark, on to Today, dashed to the whole system's mark, then the Powerwall warranty. It SHALL play once, and the timeline SHALL show complete when the page runs without JavaScript.

#### Scenario: Across the card
- **WHEN** the page is first viewed at 1280 pixels, with solar paid back in 2025, today in 2026 and the whole system projected for 2028, and the viewer scrolls down to the Payback card
- **THEN** once half its timeline is in view, the solid line draws to 2025 and stops while Solar paid back lands, goes on to Today, the dashed line draws to 2028 and stops while its mark lands, and the warranty mark lands last

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

## MODIFIED Requirements

### Requirement: Charts draw in when the view changes
A chart SHALL draw in when its page is first viewed and when the viewer changes what it shows: a range, a preset or a day; Impact's charts instead move to a new range's figures. Columns SHALL rise from the zero line, horizontal bars SHALL uncover from their left end, a stacked bar SHALL grow as one piece, rings SHALL sweep round from the top and dots SHALL fade and grow in. Each SHALL take 450 ms, easing out, with each item starting 15 ms after the one before, no later than 200 ms.

#### Scenario: Opening the Solar page
- **WHEN** a viewer opens the Solar page on "This week"
- **THEN** the range chart's seven columns rise from the zero line, left to right, the last starting 90 ms after the first, each taking 450 ms

#### Scenario: Picking another range
- **WHEN** the viewer picks "This month" on the Solar page
- **THEN** the new range's columns rise from the zero line as on first view

#### Scenario: A stacked bar
- **WHEN** the Impact page's car charging section first shows a car's split of solar, Powerwall and grid
- **THEN** the whole split bar uncovers from its left end as one piece, so the shares never look different from what they are

#### Scenario: Impact's ring on another range
- **WHEN** the viewer picks another range on the Impact page
- **THEN** neither ring sweeps again; their slices move to the new shares, Solar offset's bars move to their new lengths, and each car's split moves its sources to their new stretches

#### Scenario: A car new to the range
- **WHEN** another range on the Impact page charged a car the last range didn't
- **THEN** that car's split uncovers from its left end as it first shows, while the other cars' splits move

#### Scenario: Many columns
- **WHEN** a range chart draws 31 columns
- **THEN** every column has started by 200 ms, so the chart takes no more than 650 ms

### Requirement: Changed values move from their old figure
When a value already on screen changes, its mark and its figure SHALL move from the old value to the new one in 400 ms, easing out. They SHALL never restart from zero. This applies to the top bar's solar, home and Powerwall charge, today's column on the range chart, the forecast card's Today bar, the day view's Total Generated, the Impact ring's slices and percentages, Impact's Solar offset bars, their kWh and the energy offset, and Impact's car charging kWh and each car's split and kWh.

#### Scenario: The Powerwall charge rises
- **WHEN** the top bar reads PW 92% and a live status reports 93%
- **THEN** the figure rolls from 92% to 93% in 400 ms

#### Scenario: Solar and home change
- **WHEN** the top bar reads SOLAR 6.2 kW and HOME 1.4 kW and a live status reports 5.8 kW and 2.1 kW
- **THEN** both figures roll to their new ones in 400 ms, from 6.2 and 1.4, never from 0

#### Scenario: Today's column grows
- **WHEN** new totals add 1.2 kWh to today on the range chart
- **THEN** today's column grows from its old height to its new one in 400 ms

#### Scenario: Another Impact range
- **WHEN** the viewer changes the Impact page from "This year" to "All time"
- **THEN** each slice of the ring moves from its old size to its new one, and the percentages in the middle and the legend roll to their new figures; Solar offset's bars grow or shrink from their old lengths, and the offset and their kWh roll

### Requirement: Motion never moves the layout
No motion SHALL change the size or place of anything around it. Marks SHALL move by transform, opacity, clip-path or their own SVG drawing. The page's cumulative layout shift SHALL stay 0. Each figure's final value SHALL be in the page from the start for assistive technology, and the Payback card's story SHALL draw its line and marks within the card's final size.

#### Scenario: Bars uncovering
- **WHEN** the Patterns page's Always on bars draw in
- **THEN** the rows and figures beside them stay where they are throughout

#### Scenario: A screen reader during a roll
- **WHEN** a screen reader reads Total Generated while it rolls to a new day's figure
- **THEN** it reads the new day's figure, not one in between

#### Scenario: The Payback story
- **WHEN** the Payback card's story plays
- **THEN** the card, its notes and the chart below stay where they are throughout
