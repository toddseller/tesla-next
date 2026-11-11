# Spec Delta

## ADDED Requirements

### Requirement: The day's payback is kept
The server SHALL keep the payback figures it worked out for the current site day and answer the Payback card and `/api/payback` from them. When a `totals` event arrives for today or yesterday, it SHALL work them out again and answer from the new figures, a request made meanwhile waiting for them; if working them out fails, it SHALL keep answering the previous figures. A new site day, a server start or a data rewrite anton announces SHALL start them afresh.

#### Scenario: A second visit
- **WHEN** the True-Up Tracker is opened twice on the same day with no new totals between
- **THEN** the second visit's Payback card comes from the kept figures, without working them out again

#### Scenario: Today's totals arrive
- **WHEN** a `totals` event arrives for today
- **THEN** the payback is worked out again, and the Payback card's reload, and the next visit, show the new figures

#### Scenario: The night's notice for yesterday
- **WHEN** at 00:15 a `totals` event arrives for yesterday, finishing it
- **THEN** the payback is worked out again, as for today's

#### Scenario: Midnight
- **WHEN** the first request of a new site day asks for the payback
- **THEN** it is worked out for that day, not taken from the day before

#### Scenario: A rewrite
- **WHEN** anton announces a data rewrite
- **THEN** the kept payback is dropped and worked out again
