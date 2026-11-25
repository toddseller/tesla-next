# Spec Delta

## MODIFIED Requirements

### Requirement: A choice of readings on each affected page
The Solar page, Impact, Patterns and Top Ten SHALL show a switch reading "Corrected" and "As Tesla reported" when what they show includes a corrected day, named and labeled "Grid readings", its label a hinted term (see term-hints). Corrected SHALL be chosen unless the address has `readings=tesla`. Choosing SHALL replace the address and show every figure on the page, daily and 5-minute, in that view. A page whose days include no corrected day SHALL show no switch.

#### Scenario: A range in the corrected years
- **WHEN** a viewer opens the Solar page for October 2025
- **THEN** the switch shows with Corrected chosen, after its "Grid readings" label, and the figures are corrected

#### Scenario: Choosing Tesla's figures
- **WHEN** the viewer picks "As Tesla reported" on Impact for 2025
- **THEN** the address gains `readings=tesla` and every figure on the page, the car charging split included, is as Tesla reported it

#### Scenario: A range after the fix
- **WHEN** a viewer opens the Solar page for May 2026
- **THEN** no switch shows

#### Scenario: A range before PG&E's readings
- **WHEN** a viewer opens Impact for 2022
- **THEN** no switch shows, and the figures are as Tesla reported them

#### Scenario: Top Ten's two choices
- **WHEN** a viewer on `/top?vpp=with` picks "As Tesla reported"
- **THEN** the address keeps `vpp=with` and gains `readings=tesla`
