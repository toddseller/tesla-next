## MODIFIED Requirements

### Requirement: Bar shape and labels
Each bar SHALL round only its stack's top and bottom ends. The house mark SHALL be a short rounded line in the home color, a little wider than its bar and edged in the card's color, drawn over the bar. Flows SHALL take the dashboard shell's colors, with a legend naming Solar, Grid, Powerwall and House (shown as the mark), a note that below zero means more was sent to the grid than taken from it, or more stored in the Powerwalls than they gave back that day (that month, under monthly bars), and the value axis labeled in kWh.

#### Scenario: A stacked bar
- **WHEN** a bar has solar and grid above zero, and no Powerwall
- **THEN** only the top of the grid section and the bottom of the solar section are rounded

#### Scenario: Grid below zero
- **WHEN** a bar's grid is below zero and its Powerwall is not
- **THEN** the bottom of the grid section is rounded and the solar section's bottom, at zero, is square

#### Scenario: Powerwall on top
- **WHEN** a bar's solar, grid and Powerwall are all above zero
- **THEN** only the top of the Powerwall section and the bottom of the solar section are rounded

#### Scenario: Powerwall at the bottom
- **WHEN** a bar's grid and Powerwall are both below zero
- **THEN** the bottom of the Powerwall section is rounded, under the grid section

#### Scenario: The note under daily bars
- **WHEN** the range is October 2026
- **THEN** the note ends "than they gave back that day."

#### Scenario: The note under monthly bars
- **WHEN** the range is 2023
- **THEN** the note ends "than they gave back that month."
