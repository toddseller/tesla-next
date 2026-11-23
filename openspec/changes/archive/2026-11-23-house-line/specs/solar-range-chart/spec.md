## MODIFIED Requirements

### Requirement: Bar values
Each bar SHALL show its period's solar generated, grid (imported minus exported, below zero when more was exported) and house use, in kWh to one decimal place, from the `data` table, with PG&E's meter readings standing in for Tesla's grid figures, and the house use corrected by the difference, on days before 2026-04-27 that have them. The bar SHALL stack solar and positive grid from zero, negative grid below zero, and mark house use at its own value.

#### Scenario: A day that exported more than it imported
- **WHEN** October 14, 2026 generated 44.4 kWh, used 34.0 kWh in the house, and exported 8.3 kWh more than it imported
- **THEN** its bar holds 44.4 kWh of solar above zero and 8.3 kWh of grid below, with the house mark at 34.0 kWh

#### Scenario: Meter-corrected days
- **WHEN** the range is 2025-12-10, whose Tesla figures are 20 kWh in and 4 kWh out, and PG&E's meter read 40 kWh in and 8 kWh out
- **THEN** the bar's grid is 32.0 kWh

#### Scenario: House above its bar
- **WHEN** October 2, 2026 generated 28.1 kWh, imported 42.1 kWh net and used 73.8 kWh in the house
- **THEN** its house mark is at 73.8 kWh, above the bar's top at 70.2 kWh, and the value axis reaches it

### Requirement: Bar shape and labels
Each bar SHALL round only the outer ends of its stack, its top and its bottom. The house mark SHALL be a short rounded line in the home color, a little wider than its bar and edged in the card's color, drawn over the bar. Flows SHALL take their colors as the dashboard shell sets them, with a legend naming Solar, Grid and House (shown as the mark), a note that grid below zero means more was sent to the grid than taken from it, and the value axis labeled in kWh.

#### Scenario: A stacked bar
- **WHEN** a bar has solar and grid above zero
- **THEN** only the top of the grid section and the bottom of the solar section are rounded

#### Scenario: Grid below zero
- **WHEN** a bar's grid is below zero
- **THEN** the bottom of the grid section is rounded and the solar section's bottom, at zero, is square
