## MODIFIED Requirements

### Requirement: Range presets on a phone
In a window narrower than 640 pixels, each group of range presets SHALL be one button naming the selected preset as its button reads, or "Custom" when none is selected, that opens a menu of the group's presets in order. The selected one SHALL be marked. Choosing one SHALL close the menu and do what its button does. The selected preset's step buttons SHALL sit either side of the menu's button, and the dates button beside them.

#### Scenario: Impact on a phone
- **WHEN** a viewer opens the Impact page on This month in a 390 pixel wide window
- **THEN** the step buttons either side of a "This month" menu button, and the dates button, share one row, and the menu lists Today, This week, This month, This year, True-up year and All time with This month marked

#### Scenario: Choosing from the menu
- **WHEN** that viewer chooses This year from the menu
- **THEN** the menu closes and the page shows This year, as the This year button does on a wide screen

#### Scenario: A range no preset gives
- **WHEN** a viewer on a phone shows October 10 to 20, 2026 on the Solar page
- **THEN** the menu button reads "Custom" and no preset in the menu is marked

#### Scenario: True-Up on a phone
- **WHEN** a viewer opens `/true-up` on 2026-11-08 in a 390 pixel wide window
- **THEN** the menu lists True-up year and All time, the step buttons sit either side of the menu's button and the dates button beside them

#### Scenario: A wide window
- **WHEN** a viewer opens the Impact page in a 640 pixel wide window
- **THEN** the presets are a row of buttons, as before

#### Scenario: The readings switch
- **WHEN** a viewer opens the Impact page on a phone
- **THEN** Corrected and As Tesla reported are still two buttons, not a menu
