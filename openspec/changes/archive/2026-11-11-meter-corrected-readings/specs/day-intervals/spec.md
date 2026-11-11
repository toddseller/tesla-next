# Spec Delta

## ADDED Requirements

### Requirement: Corrected grid flows in the day's records
For a day before 2026-04-27 with a PG&E reading in `meter_day`, the day intervals response SHALL correct its records' grid flows and totals as `meter-correction` describes for 5-minute figures. With `readings=tesla` it SHALL answer with Tesla's flows as stored. Any other value, or none, SHALL answer corrected.

#### Scenario: A corrected day
- **WHEN** a client requests `/api/intervals?date=2025-12-10`
- **THEN** the records' grid import and home use from the grid include PG&E's difference, and the totals' grid import and export equal PG&E's reading for the day

#### Scenario: Tesla's flows
- **WHEN** a client requests `/api/intervals?date=2025-12-10&readings=tesla`
- **THEN** the records and totals are Tesla's as stored

#### Scenario: A day after the fix
- **WHEN** a client requests `/api/intervals?date=2026-05-10`
- **THEN** the records are Tesla's as stored, with or without `readings=tesla`
