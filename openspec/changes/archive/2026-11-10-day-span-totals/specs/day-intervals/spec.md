# Spec Delta

## ADDED Requirements

### Requirement: Each flow's energy
Each record SHALL also give each flow's energy over its interval in Wh, unrounded, or null where its power is null, so that a run of records adds up to exactly what the day's totals do.

#### Scenario: A flow's power and energy
- **WHEN** an interval sent 412 Wh from the grid to the home
- **THEN** its record gives that flow as 4.94 kW and 412 Wh

#### Scenario: Adding up a day
- **WHEN** a day's records' Wh for a flow are added up
- **THEN** the sum divided by 1,000 equals the day's total for that flow exactly
