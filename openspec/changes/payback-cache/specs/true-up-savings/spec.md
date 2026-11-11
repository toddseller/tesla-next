# Spec Delta

## ADDED Requirements

### Requirement: A year's savings are kept
The server SHALL keep each true-up year's savings it works out and answer every reader from them: a settled year's, one that ended more than 31 days ago, until a data rewrite or a server start; any other year's for the current site day. When a `totals` event arrives for today or yesterday, it SHALL work the unsettled kept years out again, before the payback, a request made meanwhile waiting for them; if that fails, it SHALL keep the previous savings.

#### Scenario: A second visit
- **WHEN** the current true-up year is shown twice on the same day with no new totals between
- **THEN** the second visit's savings card comes from the kept savings, without working them out again

#### Scenario: A settled year the next day
- **WHEN** '24 - '25 was shown on 2026-11-11 and is shown again on 2026-11-12
- **THEN** it comes from the kept savings, without working them out again

#### Scenario: Today's totals arrive
- **WHEN** a `totals` event arrives for today on 2026-11-11, with '26 - '27 and '25 - '26 kept
- **THEN** '26 - '27's savings are worked out again, then the payback from them, and '25 - '26, settled since 2026-10-31, is not

#### Scenario: The night's notice for yesterday
- **WHEN** at 00:15 a `totals` event arrives for yesterday, finishing it
- **THEN** the unsettled kept years are worked out again, as for today's

#### Scenario: Any other range
- **WHEN** the savings route is asked for 2026-01-01 to 2026-03-31
- **THEN** it answers as before and nothing is kept for that range, since only a true-up year's savings are kept
