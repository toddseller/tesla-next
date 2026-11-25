# Spec Delta

## ADDED Requirements

### Requirement: A term fits a finger
A hinted term's tap area SHALL be at least 24 px tall, wherever it is hinted, and as wide as its words. The larger area SHALL change neither the term's text, its underline nor the height of its line, so the sentence reads as it did.

#### Scenario: STORM WATCH on a phone
- **WHEN** storm watch is active and a visitor on a 390 x 844 phone taps 2 px above the top bar's STORM WATCH words
- **THEN** the storm watch definition opens, and the pill is as tall as before

#### Scenario: A term in a 13 px note
- **WHEN** a visitor reads True-Up's savings card, whose estimates note hints "WestLight"
- **THEN** "WestLight" has a tap area at least 24 px tall, and the note's lines are spaced as before
