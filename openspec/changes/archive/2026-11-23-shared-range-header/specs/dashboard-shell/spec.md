## ADDED Requirements

### Requirement: The range header
Solar's range view, Impact and True-Up SHALL head the page the same way: the page's heading at 22 pixels, its range controls in the same row in a window at least 640 pixels wide, and the page's lead sentence on its own line under that row, at the same size on all three. In a narrower window the order SHALL be the heading, the lead sentence, then the range controls.

#### Scenario: Three pages at 1440
- **WHEN** a viewer opens Solar, Impact and True-Up in turn, each on its default range, in a 1440 by 900 window
- **THEN** each heading is 22 pixels with its range controls on its row, and each lead sentence is under that row in the same size

#### Scenario: On a phone
- **WHEN** a viewer opens Impact in a 390 pixel wide window
- **THEN** the heading comes first, the lead sentence second and the range controls third

### Requirement: The preset core
Every page with range presets SHALL offer the core presets in this order: This month, This year, True-up year, All time. A page MAY put presets of its own before the core, and MAY leave out core presets that don't fit its data, but SHALL NOT reorder the core or put anything between its presets.

#### Scenario: The same order
- **WHEN** a viewer looks at the presets on Solar, Impact and True-Up
- **THEN** whichever core presets each shows appear in the order This month, This year, True-up year, All time

### Requirement: Stepping the range
A preset SHALL be marked as selected when it gives the shown range, or when the shown range has its shape: a day, a Sunday to Saturday week, a calendar month, a January to December year or an October to September true-up year. The selected preset SHALL hold a previous and a next button that step the range by that shape, each named for its step, like "Previous month". Stepping SHALL change the address as a preset does.

#### Scenario: A month back
- **WHEN** a viewer on Solar showing November 2026 presses Previous month
- **THEN** the address becomes `/solar?start=2026-10-01&end=2026-10-31`, the page shows October 2026, and the This month preset stays marked

#### Scenario: A true-up year back
- **WHEN** a viewer on `/true-up` showing 2026-10-01 to 2027-09-30 presses Previous true-up year
- **THEN** the page shows 2025-10-01 to 2026-09-30, and the True-up year preset stays marked

#### Scenario: A week
- **WHEN** a viewer on Impact showing Sunday 2026-11-08 to Saturday 2026-11-14 presses Next week on 2026-11-23
- **THEN** the page shows 2026-11-15 to 2026-11-21, and This week stays marked

#### Scenario: A range no preset's shape fits
- **WHEN** a viewer shows 2026-10-10 to 2026-10-20, or a single day on Solar, which has no day preset
- **THEN** no preset is marked and there are no step buttons

### Requirement: A stepped preset names its range
While a preset is marked for a range other than its own, it SHALL read that range's name instead of its label: "October 2026", "2025", "'25 - '26", "Nov 15 – 21, 2026" or "Nov 22, 2026". Choosing it SHALL bring back its own range, and its tooltip SHALL say so, like "Back to this month".

#### Scenario: Stepped back a month
- **WHEN** a viewer on Solar presses Previous month on November 2026
- **THEN** the marked preset reads "October 2026", and choosing it shows November 2026 again

#### Scenario: Not stepped
- **WHEN** a viewer shows This month
- **THEN** the marked preset reads "This month"

### Requirement: Steps stay within the data
The next button SHALL be disabled when the next span would start after today in the site's time zone, and the previous button when the previous span would end before 2021-10-10, the site's first day of service.

#### Scenario: The current month
- **WHEN** a viewer shows November 2026 on 2026-11-23
- **THEN** Next month is disabled and Previous month is not

#### Scenario: The first month
- **WHEN** a viewer shows October 2021
- **THEN** Previous month is disabled

#### Scenario: The first true-up year
- **WHEN** a viewer on `/true-up` shows 2021-10-01 to 2022-09-30
- **THEN** Previous true-up year is disabled, since that year ends before the first day of service

### Requirement: Month and year lists in the picker
Each month the date-range picker shows SHALL be captioned by a month list and a year list instead of the month's name, offering only months and years from October 2021 to the current month. Choosing from either SHALL move the picker to that month, keeping any start day already picked.

#### Scenario: To 2022
- **WHEN** a viewer on Solar showing November 2026 opens the picker in a 390 pixel wide window and chooses 2022 in the year list
- **THEN** the picker shows November 2022

#### Scenario: The first year
- **WHEN** a viewer chooses 2021 in a picker's year list
- **THEN** its month list offers only October to December

## MODIFIED Requirements

### Requirement: Range presets on a phone
In a window narrower than 640 pixels, each group of range presets SHALL be one button naming the selected preset as its button reads, or "Custom" when none is selected, that opens a menu of the group's presets in order, any Earlier years in Earlier's place, newest first. The selected one SHALL be marked. Choosing one SHALL close the menu and do what its button does. The selected preset's step buttons SHALL sit either side of the menu's button, and the dates button beside them.

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

### Requirement: The dates button
Beside each page's range presets, the dates button that opens the custom range picker SHALL be a calendar icon in a 44-pixel square, with no dates written on it. Its name for assistive technology and its tooltip SHALL give the shown range's dates, like "Choose dates, Oct 1 – 31, 2026". It SHALL show as selected, as a preset button does, when no preset is selected.

#### Scenario: A preset range
- **WHEN** a viewer opens the Impact page on This month, November 2026
- **THEN** the dates button is a calendar icon named "Choose dates, Nov 1 – 30, 2026", and it is not shown as selected

#### Scenario: A custom range
- **WHEN** a viewer shows October 10 to 20, 2026 on the Solar page
- **THEN** the dates button shows as selected, and no preset does

#### Scenario: An earlier true-up year
- **WHEN** a viewer on `/true-up` on 2026-11-23 presses Previous true-up year
- **THEN** the True-up year preset shows as selected, reading "'25 - '26", and the dates button does not

### Requirement: Picking a range keeps the reader's place
On every page with range presets, choosing a preset, a step button, or dates from the custom range picker SHALL change the shown range without scrolling the page. The page SHALL stay scrolled where it was, and the range change SHALL still be a new entry in the browser's history.

#### Scenario: A short window on Solar
- **WHEN** a viewer on the Solar page, in a window short enough that the forecast card pushes "Solar by date range" below the fold, scrolls down to the chart and picks This year
- **THEN** the chart shows This year and the page stays scrolled to the chart

#### Scenario: Dates from the picker
- **WHEN** a viewer scrolled down on the Impact page picks October 1 to 31, 2026 in the custom range picker
- **THEN** the page shows October 2026 and stays scrolled where it was

#### Scenario: An earlier true-up year
- **WHEN** a viewer scrolled down on `/true-up` presses Previous true-up year
- **THEN** the page shows that year and stays scrolled where it was

#### Scenario: Back after a range change
- **WHEN** a viewer on This month picks This year and then goes back in the browser
- **THEN** the page shows This month again
