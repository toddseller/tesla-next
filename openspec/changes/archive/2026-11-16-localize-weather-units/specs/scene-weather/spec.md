# Spec Delta

## MODIFIED Requirements

### Requirement: Wind readout
Tapping or clicking the vane SHALL show the wind beside it: speed and gusts in whole units of the viewer's wind unit (display-units spec) and the direction it blows from as one of eight compass points, as "18 mph, gusts 35 mph, from SW"; without gusts "18 mph from SW"; below 2 mph "Calm"; without a recent reading "No wind reading". The vane SHALL be reachable and opened by keyboard. Tapping elsewhere, the vane again, or Escape SHALL close it. It SHALL follow new readings while open.

#### Scenario: Tap in a storm
- **WHEN** the latest reading is 29 km/h from 225 degrees with gusts of 56 km/h, the viewer's wind unit is mph and the vane is tapped
- **THEN** the readout shows "18 mph, gusts 35 mph, from SW"

#### Scenario: Tap in a storm in km/h
- **WHEN** the latest reading is 29 km/h from 225 degrees with gusts of 56 km/h, the viewer's wind unit is km/h and the vane is tapped
- **THEN** the readout shows "29 km/h, gusts 56 km/h, from SW"

#### Scenario: Calm in km/h
- **WHEN** the latest reading is 3 km/h from 90 degrees, the viewer's wind unit is km/h and the vane is tapped
- **THEN** the readout shows "Calm"

#### Scenario: Closing
- **WHEN** the readout is open and the viewer taps the sky
- **THEN** the readout closes

#### Scenario: Keyboard
- **WHEN** a keyboard user tabs to the vane and presses Enter
- **THEN** the readout opens, and Escape closes it

#### Scenario: Before anton sends the wind
- **WHEN** the live data carries no wind speed or direction and the vane is tapped
- **THEN** the readout shows "No wind reading" and the vane stands still
