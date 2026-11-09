# Spec Delta

## ADDED Requirements

### Requirement: Cost data
`GET /api/true-up-cost?start_date=&end_date=` SHALL answer with status 200 and a true-up year's dollars as this spec defines them, for every range from 2021-10-01 to 732 days after today, all its fields null but the newest rates' date unless the range is a true-up year. Other requests SHALL get status 400 and a message.

#### Scenario: A true-up year
- **WHEN** a client requests `/api/true-up-cost` for 2025-10-01 to 2026-09-30
- **THEN** the answer is status 200 with that year's charges, amount due and VPP season

#### Scenario: A range that isn't a true-up year
- **WHEN** All Time or a custom range is requested
- **THEN** every field is null but `rates_effective`

## REMOVED Requirements

### Requirement: Cost data matches Flask's
**Reason**: anton-tesla-api-ws retired its `/api/v2` routes on November 9, 2026, so there is nothing left to compare with.
**Migration**: "Cost data" describes the route.
