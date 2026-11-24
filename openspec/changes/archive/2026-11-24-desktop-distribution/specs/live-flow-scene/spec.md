## RENAMED Requirements

- FROM: `### Requirement: Today's totals under the scene on a phone`
- TO: `### Requirement: Today's totals under the scene`

## MODIFIED Requirements

### Requirement: Today's totals under the scene
At every width, Distribution SHALL show under the scene and its replay controls "Today so far": today's solar and six totals as the home page's Today shows them, car apart, and a link to today on the Solar page. Below 640 pixels the figures SHALL sit two to a row, from 640 pixels four to a row, and from 1024 pixels all seven in one row. The browser SHALL fetch them, so the page still renders from the live status alone, and SHALL fetch them again on each totals event for today and when the live stream returns. Without them there SHALL be no block.

#### Scenario: A phone in the morning
- **WHEN** a visitor opens `/distribution` on a 390-pixel-wide screen
- **THEN** under the scene they see today's solar, labeled "generated", the house's use, the car's charging, energy from and sent to the grid, and the Powerwalls in and out, and "Today, hour by hour" linking to today on the Solar page

#### Scenario: The database is slow or down
- **WHEN** today's figures are slow to come or fail
- **THEN** the scene shows as it always has, and the block appears only once they arrive

#### Scenario: A wide screen
- **WHEN** a visitor opens `/distribution` at 1440 pixels wide and scrolls below the scene
- **THEN** they see "Today so far" with its seven figures in one row and the link to today on the Solar page
