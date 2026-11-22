## MODIFIED Requirements

### Requirement: Bar details
Pointing at a bar, or tapping it on a touch screen, SHALL show its label and its solar, grid and house values, the house's named "House, car included" as the chart's legend names it. A daily bar's details SHALL also say that clicking opens the day, and a period bar's that clicking shows its days.

#### Scenario: Pointing at a day
- **WHEN** a visitor points at the bar for October 14, 2026
- **THEN** the details show Solar 44.4 kWh, Grid -8.3 kWh, House, car included 34.0 kWh and that clicking opens the day

#### Scenario: Pointing at a month
- **WHEN** a visitor showing the 2026-2027 true-up year points at the bar for October 2026
- **THEN** the details show its solar, grid and house values and that clicking shows its days
