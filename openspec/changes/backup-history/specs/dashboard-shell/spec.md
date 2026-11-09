# Spec Delta

## ADDED Requirements

### Requirement: Off grid and storm watch in the top bar
The top bar's live status SHALL add a pill before the Powerwall pill while the latest live status reports the site off the grid or in storm watch: "OFF GRID TEST" for `off_grid_intentional`; "OFF GRID" for any other island status starting `off_grid`, followed by "SINCE" and the time the current stretch began when the server holds an off-grid stretch; and "STORM WATCH" while storm watch is active and the site is on the grid. Otherwise there SHALL be no added pill.

#### Scenario: An outage with its stretch stored
- **WHEN** the latest status reports `off_grid_unintentional` and the current stretch is `off_grid_unintentional` from 6:25 AM
- **THEN** the top bar reads OFF GRID SINCE 6:25 AM beside the Powerwall pill

#### Scenario: An outage in its first minutes
- **WHEN** the latest status reports `off_grid_unintentional` and the current stretch is still `on_grid`, not yet stored by anton
- **THEN** the top bar reads OFF GRID, with no time

#### Scenario: A test
- **WHEN** the latest status reports `off_grid_intentional`
- **THEN** the top bar reads OFF GRID TEST

#### Scenario: Storm watch
- **WHEN** the latest status reports `on_grid` and storm watch active
- **THEN** the top bar reads STORM WATCH beside the Powerwall pill

#### Scenario: An outage during storm watch
- **WHEN** the latest status reports `off_grid_unintentional` and storm watch active
- **THEN** the top bar reads OFF GRID and not STORM WATCH

#### Scenario: On the grid
- **WHEN** the latest status reports `on_grid` without storm watch, or has neither field
- **THEN** the top bar shows only the Powerwall pill

#### Scenario: A stale status
- **WHEN** the last status, more than two minutes old, reported `off_grid_unintentional`
- **THEN** the top bar reads LAST with a gray dot and keeps the OFF GRID pill, as it keeps the Powerwall pill
