# Spec Delta

## MODIFIED Requirements

### Requirement: Changed values move from their old figure
When a value already on screen changes, its mark and its figure SHALL move from the old value to the new one in 400 ms, easing out. They SHALL never restart from zero. This applies to the top bar's solar, home and Powerwall charge, today's column on the range chart, the forecast card's Today bar, the day view's Total Generated and the Impact ring's slices and percentages.

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
- **THEN** each slice of the ring moves from its old size to its new one, and the percentages in the middle and the legend roll to their new figures
