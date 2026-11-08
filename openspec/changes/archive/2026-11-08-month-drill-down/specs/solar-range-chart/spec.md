# Spec Delta

## MODIFIED Requirements

### Requirement: Bar details
Pointing at a bar, or tapping it on a touch screen, SHALL show its label and its solar, grid and house values. A daily bar's details SHALL also say that clicking opens the day, and a period bar's that clicking shows its days.

#### Scenario: Pointing at a day
- **WHEN** a visitor points at the bar for October 14, 2026
- **THEN** the details show Solar 44.4 kWh, Grid -8.3 kWh, House 34.0 kWh and that clicking opens the day

#### Scenario: Pointing at a month
- **WHEN** a visitor showing the 2026-2027 true-up year points at the bar for October 2026
- **THEN** the details show its solar, grid and house values and that clicking shows its days

### Requirement: Opening a day
Clicking a daily bar SHALL open that day's day view, adding the day to the address and keeping the range. Clicking a period bar SHALL show that period's daily bars, its first and last day becoming the range in the address as a new entry in the browser's history.

#### Scenario: Open a day
- **WHEN** a visitor showing October 2026 clicks the bar for October 14
- **THEN** the address becomes `/?start=2026-10-01&end=2026-10-31&day=2026-10-14` and the day view for October 14 is shown

#### Scenario: Monthly bars
- **WHEN** a visitor showing the true-up year 2026-10-01 to 2027-09-30 clicks the bar for October 2026
- **THEN** the address becomes `/?start=2026-10-01&end=2026-10-31` and October 2026's daily bars are shown, each opening its day

#### Scenario: Open a month-long period
- **WHEN** a visitor showing 2026-01-15 to 2026-06-14 clicks the second bar
- **THEN** the address becomes `/?start=2026-02-15&end=2026-03-14` and that period's daily bars are shown

#### Scenario: A partial first month
- **WHEN** a visitor showing 2026-01-15 to 2026-06-30 clicks the first bar
- **THEN** the address becomes `/?start=2026-01-15&end=2026-01-31`

#### Scenario: Back to the year
- **WHEN** a visitor opened October 2026 from the true-up year and goes back in the browser
- **THEN** the true-up year's monthly bars are shown again
