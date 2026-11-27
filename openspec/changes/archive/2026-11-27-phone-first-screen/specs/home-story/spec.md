## MODIFIED Requirements

### Requirement: The first screen on a phone
On a screen 390 pixels wide and 844 tall, the status line, the sentence, the house scene and the start of the Today chapter SHALL be visible without scrolling, with no horizontal scrolling anywhere on the page. This SHALL hold for the longest live sentence and with the weather sentence showing.

#### Scenario: Opening on a phone
- **WHEN** a visitor opens `/` on a 390 by 844 screen
- **THEN** they see the status line, the sentence, the house scene and today's solar so far before scrolling

#### Scenario: The longest sentence
- **WHEN** a visitor opens `/` on a 390 by 844 screen while the live sentence reads "Solar and the Powerwalls supply the house and send 2.3 kW to PG&E. The Powerwalls are supplying 1.5 kW, 86% full, and the car is charging at 11.5 kW." and the weather sentence shows
- **THEN** today's solar so far ends above the bottom of the screen

#### Scenario: Wider screens unchanged
- **WHEN** a visitor opens `/` in a window 768 pixels or wider
- **THEN** the opening line, the chapter words and the live sentence keep their sizes
