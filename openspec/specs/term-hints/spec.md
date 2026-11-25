# term-hints Specification

## Purpose
Explains, where they appear, the terms a visitor new to solar and PG&E's billing can't be expected to know.

## Requirements

### Requirement: A tappable term
A hinted term SHALL read as part of its sentence with a dotted underline, and tapping, clicking or focusing and activating it SHALL open a small popover with its definition, which Escape or a tap elsewhere SHALL close. The term SHALL be announced to assistive technology as a button named by the term as written, opening its definition. A hint SHALL never navigate.

#### Scenario: Tapping VPP
- **WHEN** a visitor taps "VPP" in the True-Up page's VPP tile
- **THEN** a popover opens beside it with the VPP definition, and tapping elsewhere closes it

#### Scenario: By keyboard
- **WHEN** a keyboard user tabs to "NEM" in the charges tile and presses Enter
- **THEN** the definition opens, and Escape closes it, returning focus to the term

### Requirement: One definition per term
Each term SHALL have one definition, the same wherever it is hinted: the true-up (with how a true-up year's label like 2025-26 reads), the 4 to 9 p.m. peak, NEM, NEM2, Net Surplus Compensation, VPP, WestLight Energy, storm watch and grid readings.

#### Scenario: Storm watch in two places
- **WHEN** "Storm watch" is hinted on the True-Up page and in the Solar day view
- **THEN** both open the same definition

#### Scenario: Grid readings on two pages
- **WHEN** "Grid readings" is hinted on Impact and on Top Ten
- **THEN** both open the same definition

### Requirement: Where the terms are hinted
Each page SHALL hint each of its terms once, where a visitor first meets it, and leave the rest of the page's wording as it is. A term that doesn't appear on the page (no surplus, no storm watch day) SHALL have no hint. The top bar is not part of a page's count: its hint stands apart from the page's own.

#### Scenario: No surplus
- **WHEN** a past year's true-up tile shows an amount due, so Net Surplus Compensation isn't mentioned
- **THEN** there is no Net Surplus Compensation hint

#### Scenario: Switches already explained
- **WHEN** a visitor reads the Corrected / As Tesla reported switch or Top Ten's VPP switch
- **THEN** the readings switch's "Grid readings" label is hinted, and its choices are not; the VPP switch has no hint, Top Ten's footnote explaining it

#### Scenario: Storm watch in the top bar and on the page
- **WHEN** storm watch is active and a visitor opens `/true-up` for a year with a storm watch day
- **THEN** both the top bar's STORM WATCH and the Powerwalls' parts' "Storm watch" are hinted, with the same definition

### Requirement: The True-Up page's terms
The True-Up page SHALL hint "True-Up" in its title, "Peak (4 to 9 p.m.)" in the net tile, "NEM" in the charges tile (or a past year's true-up tile), "Net Surplus Compensation" in a past year's true-up tile, "VPP" in the VPP tile's title, "WestLight" in the savings card's estimates note, "NEM2" in the savings card's line about storing solar, and "Storm watch" in the Powerwalls' parts.

#### Scenario: The True-Up page
- **WHEN** a visitor opens `/true-up` for the current year
- **THEN** "True-Up", "Peak (4 to 9 p.m.)", "NEM", "VPP" and "WestLight" are each hinted once, and the figures and wording are unchanged

### Requirement: The day view's terms
The Solar day view SHALL hint "Storm watch" in its list of spans.

#### Scenario: A storm watch span
- **WHEN** a day had a storm watch span
- **THEN** its "Storm watch" in the list under the charts is hinted

### Requirement: The top bar's term
The top bar SHALL hint "STORM WATCH" in its storm watch pill, on every page, whenever the pill shows. The pill's other pills (OFF GRID, OFF GRID TEST) SHALL have no hint.

#### Scenario: Storm watch active
- **WHEN** a visitor on any page taps STORM WATCH in the top bar
- **THEN** the storm watch definition opens beside it, and tapping elsewhere closes it

#### Scenario: Off the grid
- **WHEN** the top bar reads OFF GRID or OFF GRID TEST
- **THEN** the pill has no hint

### Requirement: The readings switch's term
Wherever the readings switch shows, a label "Grid readings" SHALL come before it and be hinted. Its definition SHALL say that from October 6, 2023 to April 26, 2026 Tesla read about half the grid energy PG&E's meter recorded, that Corrected uses PG&E's readings for those days, and that As Tesla reported shows Tesla's own.

#### Scenario: Tapping Grid readings
- **WHEN** a visitor on the Solar page for October 2025 taps "Grid readings"
- **THEN** a popover opens with the grid readings definition, and the switch's choice is unchanged

#### Scenario: No switch, no hint
- **WHEN** a visitor opens the Solar page for May 2026
- **THEN** there is neither the switch nor a "Grid readings" hint
