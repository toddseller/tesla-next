# Spec Delta

## ADDED Requirements

### Requirement: Now says when a storm watch holds the Powerwalls
While the live status reports storm watch active and the site on the grid, the Now sentence SHALL give storm watch as the reason for what the Powerwalls are doing: idle Powerwalls are "holding at" their charge "for a storm watch", and charging Powerwalls are charging "for a storm watch" before how full they are. Supplying Powerwalls, and any status off the grid or without storm watch, SHALL read as the Now sentence otherwise does.

#### Scenario: A storm watch evening
- **WHEN** after sunset the house uses 1.0 kW, all from the grid, storm watch is active on the grid, and the Powerwalls are idle at 98%
- **THEN** the sentence reads "The grid supplies the house; solar is at 0 after sunset. The Powerwalls are holding at 98% for a storm watch."

#### Scenario: Filling up for a storm watch
- **WHEN** after sunset the grid supplies the house's 1.0 kW and charges the Powerwalls at 5.0 kW at 72%, storm watch active on the grid
- **THEN** the sentence reads "The grid supplies the house; solar is at 0 after sunset. The Powerwalls are charging at 5.0 kW for a storm watch, 72% full."

#### Scenario: Charge not known
- **WHEN** storm watch is active on the grid, the Powerwalls are idle, and the live status carries no charge
- **THEN** the sentence's second part reads "The Powerwalls are holding for a storm watch."

#### Scenario: An outage during a storm watch
- **WHEN** the live status reports `off_grid_unintentional` with storm watch active, and the Powerwalls are idle at 100% while solar supplies the house
- **THEN** the sentence reads "Solar supplies the house. The Powerwalls are idle at 100%."

#### Scenario: Supplying during a storm watch
- **WHEN** storm watch is active on the grid and the Powerwalls supply 1.2 kW at 95%, all of the house's 1.2 kW, before sunrise
- **THEN** the sentence reads "The Powerwalls supply the house; solar is at 0 before sunrise. The Powerwalls are supplying 1.2 kW, 95% full."
