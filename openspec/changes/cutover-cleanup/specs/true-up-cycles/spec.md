# Spec Delta

## ADDED Requirements

### Requirement: Cycle data
`GET /api/true-up-years` SHALL answer with the true-up years as "True-up years" defines them, and `GET /api/cycles?start_date=&end_date=` with status 200 and one row per billing cycle in the range as "A cycle's grid energy" defines it, NEM charges included (see true-up-cost), for every range from 2021-10-01 to 732 days after today. Other requests SHALL get status 400 and a message.

#### Scenario: A true-up year
- **WHEN** a client requests `/api/cycles` for 2025-10-01 to 2026-09-30
- **THEN** the answer is status 200 with a row for each of that year's billing cycles

#### Scenario: A malformed date
- **WHEN** a client requests `/api/cycles?start_date=nope&end_date=2026-09-30`
- **THEN** the answer is status 400 with a message

## REMOVED Requirements

### Requirement: Cycle data matches Flask's
**Reason**: anton-tesla-api-ws retired its `/api/v2` routes on November 9, 2026, so there is nothing left to compare with.
**Migration**: "Cycle data" describes the routes.
