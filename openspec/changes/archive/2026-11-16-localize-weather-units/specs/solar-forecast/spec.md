# Spec Delta

## MODIFIED Requirements

### Requirement: Temperatures on the tiles
Today's tile SHALL show the latest weather reading's temperature in its lower right, across from the kWh so far, while that reading is less than 3 hours old. Each day ahead SHALL show its forecast high and low in its lower right, across from its sky, high first, like "64° / 52°". Temperatures SHALL be whole degrees in the viewer's temperature unit (display-units spec), with a bare "°". A tile without its temperature, or without both a high and a low, SHALL show none.

#### Scenario: A cool morning
- **WHEN** the latest reading, 10 minutes old, has 14.6 °C and the viewer's unit is °F
- **THEN** today's tile reads 58° in its lower right

#### Scenario: A cool morning in Celsius
- **WHEN** the latest reading, 10 minutes old, has 14.6 °C and the viewer's unit is °C
- **THEN** today's tile reads 15° in its lower right

#### Scenario: No recent reading
- **WHEN** the latest reading is 4 hours old
- **THEN** today's tile shows no temperature

#### Scenario: Tomorrow's high and low
- **WHEN** tomorrow's forecast has a high of 17.8 °C and a low of 11.1 °C and the viewer's unit is °F
- **THEN** tomorrow's tile reads 64° / 52° across from its sky

#### Scenario: Tomorrow's high and low in Celsius
- **WHEN** tomorrow's forecast has a high of 17.8 °C and a low of 11.1 °C and the viewer's unit is °C
- **THEN** tomorrow's tile reads 18° / 11° across from its sky

#### Scenario: A day stored before the high and low were kept
- **WHEN** Friday's forecast has no high or low
- **THEN** Friday's tile shows its sky alone
