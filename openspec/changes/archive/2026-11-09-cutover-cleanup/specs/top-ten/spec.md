# Spec Delta

## ADDED Requirements

### Requirement: Top ten data
`GET /api/top-ten` SHALL answer with status 200 and a list of `solar`, `net_grid` and `to_grid_months` rankings, each row with its date label, its figure (exports as negative net figures) and its ISO date (`day`, or `month` as `YYYY-MM`). The export rankings SHALL leave VPP days out unless the request has `vpp=with`; any other `vpp` value SHALL read as without, as on the page.

#### Scenario: Without VPP days by default
- **WHEN** `/api/top-ten` is requested and May 30, 2024 is a VPP day
- **THEN** May 30, 2024 is not among the `net_grid` days

#### Scenario: With VPP days
- **WHEN** `/api/top-ten?vpp=with` is requested
- **THEN** May 30, 2024 leads the `net_grid` days at 60.0 kWh, and the `solar` ranking equals that of `/api/top-ten`

#### Scenario: The old parameter
- **WHEN** `/api/top-ten?vpp=without` is requested
- **THEN** the answer equals that of `/api/top-ten`

#### Scenario: An empty database
- **WHEN** `/api/top-ten` is requested before any day is saved
- **THEN** the answer is status 200 with three empty rankings

## REMOVED Requirements

### Requirement: Data matches Flask's
**Reason**: anton-tesla-api-ws retired its `/api/v2` routes on November 9, 2026, so there is nothing left to compare with.
**Migration**: "Top ten data" describes the route; its default now matches the page's.
