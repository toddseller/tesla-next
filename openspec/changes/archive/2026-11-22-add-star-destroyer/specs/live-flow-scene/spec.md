# Spec Delta

## MODIFIED Requirements

### Requirement: Charging cable flow
While the garage is open with a car, the scene SHALL draw that car's charging cable as a gray line from beneath the Wall Connector to a plug in the car's charge port, drawn over the car, and flows into the car SHALL run along it, starting when the source's flow reaches the electrical panel.

#### Scenario: Solar charging R2D2
- **WHEN** solar charges R2D2 at 3.2 kW
- **THEN** a solar gradient runs down R2D2's cable from the Wall Connector to the plug in its charge port, as the solar flow reaches the panel

#### Scenario: Each car has its own cable
- **WHEN** Tesla T.I.E. Fighter is charging instead of R2D2
- **THEN** the gradient follows Tesla T.I.E. Fighter's cable, not R2D2's

#### Scenario: Tesla Star Destroyer charging
- **WHEN** Tesla Star Destroyer is charging
- **THEN** the garage is open with its own image, and the gradient follows its own cable to the plug at the top of its left taillight, not the other cars' cables

#### Scenario: Plugged in, not charging
- **WHEN** R2D2 is plugged in at 0 kW
- **THEN** its cable is shown in gray with no moving gradient
