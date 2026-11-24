# Spec Delta

## MODIFIED Requirements

### Requirement: Today's chart
The Today chapter SHALL chart the site day: solar made filled up to now, the forecast's expected kWh by hour as a dashed line across the whole day with the hours to come dimmed and captioned "still to come", and the Powerwalls charging and the grid exporting drawn below zero up to now. Its time axis SHALL be marked 12 AM at both ends, and 6 AM, 12 PM and 6 PM between. A day without an hourly forecast SHALL draw solar and the flows below zero alone.

#### Scenario: Mid-afternoon
- **WHEN** a visitor opens `/` at 3:39 PM with today's hourly forecast stored
- **THEN** the chart fills solar to 3:39 PM, dashes the forecast from sunrise to sunset, dims the hours after 3:39 PM with "still to come" in them and shows the charging and export below zero, on an axis marked 12 AM, 6 AM, 12 PM, 6 PM and 12 AM

### Requirement: Habits
The Habits chapter SHALL chart the always-on load by month, one line per year on a January to December axis in watts, as Patterns gives each month's figure. The current year SHALL be in the home color, last year in a darker gray than the years before it, and a key under the chart SHALL name the current year, last year and, when there are any, "earlier years". The chapter SHALL link to Patterns.

#### Scenario: This November
- **WHEN** Patterns shows November so far at 864 W
- **THEN** the 2026 line ends at November at 864 W, and the key names 2026

#### Scenario: Last year stands apart
- **WHEN** the chart holds 2022 to 2026 on 2026-11-24
- **THEN** 2025 is drawn darker than 2022 to 2024, and the key reads 2026, 2025 and earlier years

#### Scenario: No years before last
- **WHEN** the chart holds only 2025 and 2026
- **THEN** the key reads 2026 and 2025 alone

### Requirement: Habits' figures
Beside its chart, the Habits chapter SHALL say since which month the always-on load has run above (or below) the same month a year earlier, when that has held for three months or more, and otherwise how the latest month compares. It SHALL give the latest month and the same month a year earlier as Patterns labels them, the watts between them, signed, followed by their difference in kWh a day as Patterns gives it, and this year's Powerwall energy out.

#### Scenario: This November against last
- **WHEN** Patterns shows November so far at 864 W, November 2025 at 643 W and a difference of +5 kWh a day
- **THEN** the chapter gives 864 W and 643 W with Patterns' labels, then +221 W with "about +5 kWh a day more than a year ago"

#### Scenario: Below last year
- **WHEN** the latest month ran 400 W against 820 W a year earlier, a difference of -10 kWh a day
- **THEN** the chapter gives -420 W with "about -10 kWh a day less than a year ago"

#### Scenario: A run of months above last year
- **WHEN** July to November 2026 each ran above the same month of 2025 and June did not
- **THEN** the chapter says "Since July it has run above last year"
