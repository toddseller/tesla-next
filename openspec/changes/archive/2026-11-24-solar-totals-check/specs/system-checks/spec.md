# Spec Delta

## ADDED Requirements

### Requirement: Each day's solar total against its intervals
Over the 7 days to yesterday, site time, each day's stored solar total SHALL be compared with the sum of its stored 5-minute solar intervals. The check SHALL fail when any day's two figures differ by more than 0.5 kWh, naming every such day with both figures. Only days with both a solar total and at least one interval stored SHALL be compared.

#### Scenario: A daily total frozen at midday
- **WHEN** the weekly run is on February 5, 2024, and February 4's solar total is 5.9 kWh while its intervals add to 15.7 kWh
- **THEN** the check fails, saying `February 4, 2024's total is 5.9 kWh, its 5-minute intervals add to 15.70 kWh`

#### Scenario: A healthy week
- **WHEN** every day of the 7 has a solar total within 0.5 kWh of its intervals' sum
- **THEN** the check passes, naming the 7 days and how many were compared

#### Scenario: Two days off
- **WHEN** two days of the 7 are each more than 0.5 kWh off their intervals
- **THEN** the one failing line names both days, each with its two figures

#### Scenario: Exactly 0.5 kWh apart
- **WHEN** a day's total is 20.0 kWh and its intervals add to 20.5 kWh
- **THEN** that day doesn't fail the check

#### Scenario: A day missing one side
- **WHEN** a day of the 7 has a solar total but no interval stored, or intervals but no solar total
- **THEN** that day is left out of the comparison and doesn't fail the check

#### Scenario: Today left out
- **WHEN** today's solar total so far is 3.0 kWh and its intervals so far add to 6.0 kWh
- **THEN** today isn't compared and doesn't fail the check

#### Scenario: Nothing to compare
- **WHEN** none of the 7 days has both a solar total and an interval stored
- **THEN** the check passes, saying no day of the 7 could be compared
