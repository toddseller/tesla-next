## MODIFIED Requirements

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
- **THEN** the True-up year preset shows as selected, reading "2025-26", and the dates button does not

### Requirement: Each page's title
Each page's document title SHALL name the page, then the range it shows when it has one, then "Tesla Solar Report", joined by " · "; the home page's SHALL be "Tesla Solar Report". A whole month SHALL read like "November 2026", a calendar year "2026", a true-up year "2026-27", and a day or any other range in short dates, like "Nov 14, 2026" or "Oct 1 – 15, 2026". The title SHALL name the range the page shows, not the one asked for, and follow it when it changes.

#### Scenario: Solar's current month
- **WHEN** a viewer opens `/solar` on 2026-11-23
- **THEN** the title is "Solar · November 2026 · Tesla Solar Report"

#### Scenario: A day on Solar
- **WHEN** a viewer opens Solar's day view for November 14, 2026
- **THEN** the title is "Solar · Nov 14, 2026 · Tesla Solar Report"

#### Scenario: Impact before any solar
- **WHEN** a viewer opens `/impact` on 2026-11-23 while today's solar reads 0.0 kWh, so the page shows yesterday
- **THEN** the title is "Impact · Nov 22, 2026 · Tesla Solar Report"

#### Scenario: True-Up's current year
- **WHEN** a viewer opens `/true-up` in the 2026-27 true-up year
- **THEN** the title is "True-Up · 2026-27 · Tesla Solar Report"

#### Scenario: A calendar year
- **WHEN** Solar shows January 1 to December 31, 2025
- **THEN** the title is "Solar · 2025 · Tesla Solar Report"

#### Scenario: Pages without a range
- **WHEN** a viewer opens Distribution, Patterns, Top Ten or Admin
- **THEN** the titles are "Distribution · Tesla Solar Report", "Patterns · Tesla Solar Report", "Top Ten · Tesla Solar Report" and "Admin · Tesla Solar Report"

### Requirement: A stepped preset names its range
While a preset is marked for a range other than its own, it SHALL read that range's name instead of its label: "October 2026", "2025", "2025-26", "Nov 15 – 21, 2026" or "Nov 22, 2026". Choosing it SHALL bring back its own range, and its tooltip SHALL say so, like "Back to this month".

#### Scenario: Stepped back a month
- **WHEN** a viewer on Solar presses Previous month on November 2026
- **THEN** the marked preset reads "October 2026", and choosing it shows November 2026 again

#### Scenario: Not stepped
- **WHEN** a viewer shows This month
- **THEN** the marked preset reads "This month"
