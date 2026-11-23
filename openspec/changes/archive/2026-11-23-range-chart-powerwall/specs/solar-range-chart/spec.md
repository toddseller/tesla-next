## MODIFIED Requirements

### Requirement: Bar values
Each bar SHALL show its period's solar generated, grid (imported minus exported, below zero when more was exported), Powerwall (house use minus solar minus grid, below zero when the Powerwalls stored more than they gave) and house use, in kWh to one decimal place, from the `data` table, with PG&E's meter readings standing in for Tesla's grid figures, and the house use corrected by the difference, on days before 2026-04-27 that have them.

#### Scenario: A day that exported more than it imported
- **WHEN** October 14, 2026 generated 44.4 kWh, used 34.0 kWh in the house, and exported 8.3 kWh more than it imported
- **THEN** its bar holds 44.4 kWh of solar above zero, and 8.3 kWh of grid and 2.1 kWh of Powerwall below, with the house mark at 34.0 kWh

#### Scenario: Meter-corrected days
- **WHEN** the range is 2025-12-10, whose Tesla figures are 20 kWh in and 4 kWh out, and PG&E's meter read 40 kWh in and 8 kWh out
- **THEN** the bar's grid is 32.0 kWh

#### Scenario: House above its bar
- **WHEN** October 2, 2026 generated 28.1 kWh, imported 42.1 kWh net and used 73.8 kWh in the house
- **THEN** its bar stacks 3.6 kWh of Powerwall on solar and grid, reaching its house mark at 73.8 kWh

#### Scenario: A day that drew down the Powerwalls
- **WHEN** October 9, 2026 generated 22.5 kWh, imported 10.0 kWh net and used 44.4 kWh in the house
- **THEN** its bar stacks 11.9 kWh of Powerwall on top of solar and grid, up to the house mark

### Requirement: Bar shape and labels
Each bar SHALL round only its stack's top and bottom ends. The house mark SHALL be a short rounded line in the home color, a little wider than its bar and edged in the card's color, drawn over the bar. Flows SHALL take the dashboard shell's colors, with a legend naming Solar, Grid, Powerwall and House (shown as the mark), a note that below zero means more was sent to the grid than taken from it, or more stored in the Powerwalls than they gave back that day, and the value axis labeled in kWh.

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

### Requirement: Bar details
Pointing at a bar, or tapping it on a touch screen, SHALL show its label and its solar, grid, Powerwall and house values, the house's named "House, car included" as the chart's legend names it. A daily bar's details SHALL also say that clicking opens the day, and a period bar's that clicking shows its days.

#### Scenario: Pointing at a day
- **WHEN** a visitor points at the bar for October 14, 2026
- **THEN** the details show Solar 44.4 kWh, Grid -8.3 kWh, Powerwall -2.1 kWh, House, car included 34.0 kWh and that clicking opens the day

#### Scenario: Pointing at a month
- **WHEN** a visitor showing the 2026-2027 true-up year points at the bar for October 2026
- **THEN** the details show its solar, grid, Powerwall and house values and that clicking shows its days

### Requirement: Range data
`GET /api/range?start_date=&end_date=` SHALL answer with status 200 and `{"data": [...]}`, one item per bar as "Daily and monthly bars" and "Bar values" define them, each with its label (`date`), its first day (`day`), `solar`, `grid`, `powerwall` and `house`, for every range from 2021-10-01 to 732 days after today. Other requests SHALL get status 400 and a message.

#### Scenario: A valid range
- **WHEN** a client requests `/api/range?start_date=2026-10-01&end_date=2026-10-31`
- **THEN** the answer is status 200 with one item per day of October 2026 that has saved totals, each with its `powerwall`

#### Scenario: A malformed date
- **WHEN** a client requests `/api/range?start_date=nope&end_date=2026-01-31`
- **THEN** the response is 400 with a message, and no data is queried

#### Scenario: A range before the site existed
- **WHEN** a client requests `/api/range?start_date=1900-01-01&end_date=2026-10-31`
- **THEN** the response is 400 and its message names 2021-10-01

## ADDED Requirements

### Requirement: Bar stacking order
Each bar SHALL stack solar, positive grid and positive Powerwall from zero, in that order, negative grid below zero and negative Powerwall below that, and mark house use at its own value.

#### Scenario: Powerwall on top
- **WHEN** October 9, 2026 has 22.5 kWh of solar, 10.0 kWh of grid and 11.9 kWh of Powerwall
- **THEN** its bar stacks solar from zero, grid on solar and the Powerwall on top

#### Scenario: Powerwall below grid
- **WHEN** October 14, 2026 has 8.3 kWh of grid and 2.1 kWh of Powerwall below zero
- **THEN** the grid section hangs from zero and the Powerwall section hangs under it
