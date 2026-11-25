# Spec Delta

## ADDED Requirements

### Requirement: Day links fit a finger
Each link to a day in the backup section (an event's date, a storm day's date, and the Longest and Closest call tiles' days) SHALL have a tap area at least 24 px tall and no wider than the link. The larger area SHALL change neither the link's text nor the height of its row or tile.

#### Scenario: An event's date on a phone
- **WHEN** a visitor on a 390 x 844 phone taps 2 px below an event's date
- **THEN** the Solar page opens that day, and the event's row is as tall as before

#### Scenario: The Longest tile
- **WHEN** a visitor reads the Longest tile's date
- **THEN** it has a tap area at least 24 px tall, and the tile is as tall as before
