# Spec Delta

## ADDED Requirements

### Requirement: Replay controls fit a finger
In a window narrower than 1024 pixels, each of the replay bar's controls (previous day, the day, next day, play and pause, speed and LIVE) SHALL be at least 44 px tall, and the scrubber SHALL take a touch anywhere in a band 44 px tall while its track still draws as a thin line. In a wider window, where the bar shows over the scene, the controls SHALL keep their size.

#### Scenario: Phone
- **WHEN** the live page is open on a 390 x 844 phone
- **THEN** every control in the bar is at least 44 px tall, and touching 15 px above the scrubber's track moves the scrubber there

#### Scenario: Desktop
- **WHEN** the live page is open in a 1440 x 900 window
- **THEN** the bar is as tall as before, and the POWERWALL label stays fully readable above it
