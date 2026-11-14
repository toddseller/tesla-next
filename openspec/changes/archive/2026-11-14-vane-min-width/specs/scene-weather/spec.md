# Spec Delta

## ADDED Requirements

### Requirement: Vane arrow stays visible end-on
When the vane points toward or away from the viewer, its arrow SHALL stay at least a minimum width on screen, narrow but plainly visible by day and at night, and SHALL still show by its tilt whether it points toward or away. While it shakes about a direction near end-on, the arrow SHALL keep to the side of the post that the wind's direction gives, not flick from side to side. Away from end-on it SHALL look as before.

#### Scenario: Wind toward the viewer
- **WHEN** the latest reading has wind from about 152 degrees, where the arrow points straight at the viewer
- **THEN** the arrow shows at its minimum width, its tip down toward the viewer

#### Scenario: Wind away from the viewer
- **WHEN** the latest reading has wind from about 332 degrees, where the arrow points straight away
- **THEN** the arrow shows at its minimum width, its tip up into the picture

#### Scenario: Gusty wind near end-on
- **WHEN** a gusty wind from 150 degrees shakes the vane across end-on
- **THEN** the arrow stays on one side of the post, never narrower than its minimum

#### Scenario: Side-on is unchanged
- **WHEN** the latest reading has wind from 270 degrees
- **THEN** the arrow looks as it did before this change, side-on to the left
