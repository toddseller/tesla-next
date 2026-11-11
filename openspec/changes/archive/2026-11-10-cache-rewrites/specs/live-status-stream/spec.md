## ADDED Requirements

### Requirement: Rewrites refresh what the server worked out
When anton-tesla-api-ws notifies `data_rewritten`, the server SHALL forget the figures it keeps for finished days, months and years and work them out again from the stored data, so a page requested after that shows figures from the data as rewritten, without a restart.

#### Scenario: An interval backfill
- **WHEN** anton backfills April 2026's intervals and notifies `data_rewritten`, and the Patterns page is then requested
- **THEN** its April 2026 always-on load and hour grid come from the backfilled intervals, not from the figures the server kept before

#### Scenario: A true-up import
- **WHEN** anton imports a true-up statement and notifies `data_rewritten`, and the True-Up page is then requested
- **THEN** its Payback card prices the finished years from the stored data again

### Requirement: A reconnect counts as a rewrite
When the server's notification connection comes back after it broke, the server SHALL refresh what it worked out as it does on a `data_rewritten` notice, since a notice sent while it was broken is lost. A reconnect after a minute without a live status, when anton has gone quiet rather than the connection breaking, SHALL NOT count as a rewrite.

#### Scenario: The database restarts during a backfill
- **WHEN** the notification connection drops, anton's backfill notifies while it is down, and the connection comes back
- **THEN** the server forgets and works out its kept figures again

#### Scenario: Tesla's API fails for an hour
- **WHEN** anton sends no live status for an hour and the server reconnects each minute
- **THEN** the server keeps its figures, and works none of them out again for those reconnects

### Requirement: Rewrite notices stay on the server
Open streams SHALL NOT receive `data_rewritten` notices, as a live status or as an event.

#### Scenario: A notice while a page is open
- **WHEN** anton notifies `data_rewritten` while a page's stream is open
- **THEN** the stream receives nothing for it, and the page's live status is unchanged
