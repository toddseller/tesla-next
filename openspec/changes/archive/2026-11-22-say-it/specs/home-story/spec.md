## ADDED Requirements

### Requirement: Now says what goes to PG&E
When the grid is exporting 0.05 kW or more and something supplies the house, the Now sentence's first clause SHALL add the power sent to PG&E, its verbs agreeing with what supplies the house ("the Powerwalls" taking plural verbs).

#### Scenario: Sending to PG&E
- **WHEN** solar supplies all of the house's 0.8 kW and sends 1.2 kW to the grid, with the Powerwalls idle at 100%
- **THEN** the sentence reads "Solar supplies the house and sends 1.2 kW to PG&E. The Powerwalls are idle at 100%."

#### Scenario: A VPP evening
- **WHEN** after sunset the Powerwalls supply 6.0 kW at 80%, all of the house's 1.0 kW and 5.0 kW to the grid
- **THEN** the sentence reads "The Powerwalls supply the house and send 5.0 kW to PG&E; solar is at 0 after sunset. The Powerwalls are supplying 6.0 kW, 80% full."

### Requirement: Today ahead of or behind the forecast
Between the day's expected and still to come, the Today chapter SHALL say how far the forecast's kWh made by now is ahead of or behind its kWh expected by the same time, each to one decimal as the Solar page compares them, or "on the forecast" when they read the same.

#### Scenario: Behind the forecast
- **WHEN** at 2:15 PM today has made 15.6 kWh and 20.6 kWh was expected by 2:15 PM
- **THEN** the chapter shows "5.0 kWh behind the forecast"

#### Scenario: On the forecast
- **WHEN** today has made 12.4 kWh and 12.4 kWh was expected by the same time
- **THEN** the chapter shows "0.0 kWh on the forecast"

## MODIFIED Requirements

### Requirement: Now in a sentence
The Now chapter SHALL lead, under the word Now, with one sentence from the live status, the scene beside it carrying the figures: what supplies the house, largest first; that solar is at 0 after sunset or before sunrise when it is; what the Powerwalls are doing and how full they are; and, when the live status carries the car, its charge or charging power. The sentence SHALL change with each live status. A flow under 0.05 kW, which the scene shows at 0, SHALL not count as supplying the house.

#### Scenario: Stale
- **WHEN** the latest live status arrived at 10:41 AM and is 5 minutes old
- **THEN** the sentence is replaced by "No live update since 10:41 AM."

#### Scenario: After sunset
- **WHEN** the house uses 1.0 kW, all from the grid, after sunset, with the Powerwalls idle at 100% and the car at 50%, not charging
- **THEN** the sentence reads "The grid supplies the house; solar is at 0 after sunset. The Powerwalls are idle at 100%, and the car is at 50%."

#### Scenario: Midday
- **WHEN** solar supplies all of the house's 1.1 kW, the Powerwalls charge at 3.1 kW at 86% and the car charges at 5.1 kW
- **THEN** the sentence reads "Solar supplies the house. The Powerwalls are charging at 3.1 kW, 86% full, and the car is charging at 5.1 kW."

#### Scenario: Before sunrise
- **WHEN** at 5:00 AM the house uses 2.4 kW from the grid with the Powerwalls idle at 20% and no car in the status
- **THEN** the sentence reads "The grid supplies the house; solar is at 0 before sunrise. The Powerwalls are idle at 20%."

### Requirement: Today against the forecast
The Today chapter SHALL lead with today's solar so far in kWh to one decimal, as the forecast card's today tile gives it, then today's expected kWh to one decimal (the sum of the forecast's hours when it has them) as the forecast card says it, and the kWh still to come: the forecast hours left after now (the day's expected without hours, none after sundown). Without an expected kWh it SHALL show the kWh so far alone.

#### Scenario: Ahead of the forecast
- **WHEN** at 3:39 PM today has made 21.7 kWh, 18 kWh is expected for the day, 17.8 kWh was expected by 3:35 PM, and the forecast's 3 PM hour expects 0.4 kWh with no hour after it
- **THEN** the chapter leads with 21.7 kWh, then "made, of 18.0 kWh expected", "3.9 kWh ahead of the forecast" and "0.2 kWh still to come", each figure with its unit beside it

#### Scenario: After sundown
- **WHEN** at 7:25 PM the day's hours sum to 19.7 kWh and the forecast card says the day's sunlight is over
- **THEN** the chapter shows "of 19.7 kWh expected" and "0.0 kWh still to come"

#### Scenario: No forecast
- **WHEN** there are too few days with a forecast to give an expected kWh and today has made 3.0 kWh
- **THEN** the chapter shows 3.0 kWh and no expected figure

