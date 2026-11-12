## ADDED Requirements

### Requirement: Opening a period keeps the reader's place
Clicking a period bar SHALL show that period's daily bars without scrolling the page. Clicking a daily bar SHALL still open the day view at the top of the page.

#### Scenario: A month of the true-up year
- **WHEN** a viewer scrolled down to the chart of the true-up year 2026-10-01 to 2027-09-30 clicks the bar for October 2026
- **THEN** October 2026's daily bars are shown and the page stays scrolled to the chart

#### Scenario: A day
- **WHEN** a viewer scrolled down to the chart of October 2026 clicks the bar for October 14
- **THEN** the day view for October 14 opens at the top of the page
