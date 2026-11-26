# Spec Delta

## ADDED Requirements

### Requirement: The switch beside its note on the range pages
On the Solar page's range view and on Impact, the readings switch SHALL sit at the foot of the range card, in one row with the note saying which readings the figures use, not among the page header's controls. On a phone the note SHALL come first and the switch under it, as wide as the card. The switch SHALL still show only when the range includes a corrected day.

#### Scenario: Solar in the corrected years
- **WHEN** a viewer opens the Solar page for October 2025
- **THEN** the switch shows inside the range card, beside the corrected note, and the header holds only the heading, presets and dates button

#### Scenario: Impact in the corrected years
- **WHEN** a viewer opens Impact for 2025
- **THEN** the switch shows inside the card headed by the range's dates, beside the corrected note

#### Scenario: A phone
- **WHEN** a viewer opens the Solar page for October 2025 in a 390 pixel wide window
- **THEN** the note shows first and the switch under it, as wide as the card

#### Scenario: Choosing a preset that brings the switch
- **WHEN** a viewer on Impact's This month on 2026-11-25 chooses This year
- **THEN** the switch appears in the range card and nothing in the header moves
