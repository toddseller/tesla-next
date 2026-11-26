# Spec Delta

## MODIFIED Requirements

### Requirement: Range controls beside the heading
In a window at least 1024 pixels wide, the page's heading and its range controls (the presets with the selected one's step buttons, and the dates button) SHALL share one row for every preset. The readings switch is not among them: it sits in the range card (see meter-correction), so choosing a preset that brings it changes nothing in that row. The lead sentence SHALL sit on its own line under that row.

#### Scenario: All time
- **WHEN** a viewer on Today, in a 1024 pixel wide window, chooses All time on 2026-11-11
- **THEN** the heading, presets and dates button stay in one row, and the readings switch appears in the range card, not in that row
