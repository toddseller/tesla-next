# Spec Delta

## Purpose

How the site's charts and figures move: when they draw in, how a changing figure moves to its new value, how a day step slides, and when nothing moves at all. Each page's own spec says what it shows; this one says how it arrives.

## ADDED Requirements

### Requirement: Charts draw in when the view changes
A chart SHALL draw in when its page is first viewed and when the viewer changes what it shows: a range, a preset or a day. Columns SHALL rise from the zero line, horizontal bars SHALL uncover from their left end, a stacked bar SHALL grow as one piece, rings SHALL sweep round from the top and dots SHALL fade and grow in. Each SHALL take 450 ms, easing out, with each item starting 15 ms after the one before, no later than 200 ms.

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
- **THEN** the self-powered ring doesn't sweep again; its slices move to the new shares, while the section bars draw in

#### Scenario: Many columns
- **WHEN** a range chart draws 31 columns
- **THEN** every column has started by 200 ms, so the chart takes no more than 650 ms

### Requirement: A reload never replays motion
A view's periodic reload of the same range or day SHALL NOT draw any chart in again. Only values that changed SHALL move, as a tween; values that didn't change SHALL stay still.

#### Scenario: The 5-minute reload
- **WHEN** the Solar page reloads the last 7 days' totals and only today's total has grown
- **THEN** no column redraws; today's column moves to its new height and the others stay still

#### Scenario: A reload with nothing new
- **WHEN** a reload returns the same figures as before
- **THEN** nothing on the page moves

### Requirement: Changed values move from their old figure
When a value already on screen changes, its mark and its figure SHALL move from the old value to the new one in 400 ms, easing out. They SHALL never restart from zero. This applies to the top bar's Powerwall charge, today's column on the range chart, the forecast card's Today bar, the day view's Total Generated and the Impact ring's slices and percentages.

#### Scenario: The Powerwall charge rises
- **WHEN** the top bar reads PW 92% and a live status reports 93%
- **THEN** the figure rolls from 92% to 93% in 400 ms

#### Scenario: Today's column grows
- **WHEN** new totals add 1.2 kWh to today on the range chart
- **THEN** today's column grows from its old height to its new one in 400 ms

#### Scenario: Another Impact range
- **WHEN** the viewer changes the Impact page from "This year" to "All time"
- **THEN** each slice of the ring moves from its old size to its new one, and the percentages in the middle and the legend roll to their new figures

### Requirement: The estimate draws before what happened
Where a chart shows an estimate next to what actually happened, the estimate SHALL draw first, left to right at an even pace. What happened SHALL start drawing when the estimate is halfway across, easing out. This applies to the day view's Solar chart and to the forecast card's Today bar and Today by hour chart.

#### Scenario: The day view's Solar chart
- **WHEN** the Solar view of a day with an expected line draws in
- **THEN** the expected line draws left to right over 600 ms at an even pace, and the flows start drawing 300 ms in, over 600 ms, easing out

#### Scenario: The forecast card's Today bar
- **WHEN** the forecast card first shows today's bar
- **THEN** the expected track uncovers over 450 ms at an even pace, and the made bar starts growing into it 225 ms in

#### Scenario: A day with no expected line
- **WHEN** the Solar view draws a day from the first week of service, which has no expected line
- **THEN** the flows draw in left to right as the only layer, with no wait

### Requirement: A day step slides the day
Stepping to another day in the day view SHALL slide the day's content 24 px in the direction of the step: out in 150 ms, then in from the other side in 250 ms. The day stepper, the back link and the days strip SHALL stay still. Total Generated SHALL roll to the new day's figure, and the new day's chart SHALL draw in, the estimate first.

#### Scenario: The next day
- **WHEN** the viewer presses the right arrow on April 10, 2026
- **THEN** April 10's content leaves to the left, April 11's comes in from the right, Total Generated rolls to April 11's figure and its chart draws in

#### Scenario: The previous day
- **WHEN** the viewer presses "Previous day"
- **THEN** the content leaves to the right and the earlier day comes in from the left

### Requirement: The live dot rings with each status
The top bar's live dot SHALL send out one soft ring, growing and fading over 700 ms, each time a live status arrives. It SHALL stay still between statuses.

#### Scenario: A status arrives
- **WHEN** a live status arrives
- **THEN** the dot sends out one ring that fades away within 700 ms

#### Scenario: No status
- **WHEN** no live status has arrived for 30 seconds
- **THEN** the dot has not moved in that time

### Requirement: Motion never moves the layout
No motion SHALL change the size or place of anything around it. Marks SHALL move by transform, opacity, clip-path or their own SVG drawing. The page's cumulative layout shift SHALL stay 0. Each figure's final value SHALL be in the page from the start for assistive technology, and the payback track SHALL not move.

#### Scenario: Bars uncovering
- **WHEN** the Patterns page's Always on bars draw in
- **THEN** the rows and figures beside them stay where they are throughout

#### Scenario: A screen reader during a roll
- **WHEN** a screen reader reads Total Generated while it rolls to a new day's figure
- **THEN** it reads the new day's figure, not one in between

### Requirement: Reduced motion turns it off
When the viewer's system asks for reduced motion, the site SHALL show every chart, bar and figure in its final state at once, with no drawing in, moving, sliding or ringing. Distribution's house scene keeps its own handling of the setting.

#### Scenario: Reduced motion on
- **WHEN** a viewer with reduced motion on steps to the next day
- **THEN** the new day's content, figures and chart appear at once in their final state

#### Scenario: A live status under reduced motion
- **WHEN** a live status changes the Powerwall charge for a viewer with reduced motion on
- **THEN** the figure changes at once and the dot sends no ring
