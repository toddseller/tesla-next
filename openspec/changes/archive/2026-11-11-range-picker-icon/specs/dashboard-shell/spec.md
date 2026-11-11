# Spec Delta

## ADDED Requirements

### Requirement: The dates button
Beside each page's range presets, the dates button that opens the custom range picker SHALL be a calendar icon in a 44-pixel square, with no dates written on it. Its name for assistive technology and its tooltip SHALL give the shown range's dates, like "Choose dates, Oct 1 – 31, 2026". It SHALL show as selected, as a preset button does, when no preset (Earlier years included) matches the shown range.

#### Scenario: A preset range
- **WHEN** a viewer opens the Impact page on This month, November 2026
- **THEN** the dates button is a calendar icon named "Choose dates, Nov 1 – 30, 2026", and it is not shown as selected

#### Scenario: A custom range
- **WHEN** a viewer shows October 1 to 31, 2026 on the Solar page
- **THEN** the dates button shows as selected, and no preset does

#### Scenario: An earlier true-up year
- **WHEN** a viewer on `/true-up` picks '22 - '23 from the Earlier menu
- **THEN** the Earlier button shows as selected and the dates button does not

## MODIFIED Requirements

### Requirement: Range presets on a phone
In a window narrower than 640 pixels, each group of range presets SHALL be one button naming the selected preset, or "Custom" when none matches, that opens a menu of the group's presets in order, any Earlier years in Earlier's place, newest first. The selected one SHALL be marked. Choosing one SHALL close the menu and do what its button does. The dates button SHALL sit beside the menu's button.

#### Scenario: Impact on a phone
- **WHEN** a viewer opens the Impact page on This month in a 390 pixel wide window
- **THEN** a "This month" menu button and the dates button share one row, and the menu lists Today, This week, This month, This year, True-up year and All time with This month marked

#### Scenario: Choosing from the menu
- **WHEN** that viewer chooses This year from the menu
- **THEN** the menu closes and the page shows This year, as the This year button does on a wide screen

#### Scenario: A range no preset gives
- **WHEN** a viewer on a phone shows October 1 to 31, 2026 on the Solar page
- **THEN** the menu button reads "Custom" and no preset in the menu is marked

#### Scenario: True-Up on a phone
- **WHEN** a viewer opens `/true-up` on 2026-11-08 in a 390 pixel wide window
- **THEN** the menu lists This year, '25 - '26, '24 - '25, '23 - '24, '22 - '23, '21 - '22 and All time, and the dates button sits beside the menu's button

#### Scenario: A wide window
- **WHEN** a viewer opens the Impact page in a 640 pixel wide window
- **THEN** the presets are a row of buttons, as before

#### Scenario: The readings switch
- **WHEN** a viewer opens the Impact page on a phone
- **THEN** Corrected and As Tesla reported are still two buttons, not a menu
