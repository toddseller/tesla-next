# Spec Delta

## MODIFIED Requirements

### Requirement: Replay bar
The live page SHALL have a replay bar, always shown at every window width in the place the position requirement sets, with the day shown, controls for the previous and next day and a date picker from the first day of service to today in the site's time zone, play and pause, a speed of real time or 1, 10 or 60 minutes per second, a scrubber over the day from midnight to midnight with the time shown, and a LIVE control.

#### Scenario: Opening the live page
- **WHEN** a visitor opens the live page with no replay link
- **THEN** the scene is live, the bar shows today with the scrubber at the current time, and the speed is real time

#### Scenario: Day range
- **WHEN** the bar shows today
- **THEN** the next-day control is unavailable, and the date picker offers no day after today or before the first day of service

#### Scenario: Phone, untouched
- **WHEN** a visitor opens the live page on a 390 x 844 phone and leaves it alone for 5 seconds
- **THEN** the bar still shows, and no progress line runs along the scene's bottom edge

#### Scenario: Desktop, untouched
- **WHEN** a visitor opens the live page in a 1440 x 900 window and leaves it alone for 5 seconds
- **THEN** the bar still shows

## ADDED Requirements

### Requirement: Replay bar position
In a window at least 1024 pixels wide the bar SHALL show over the bottom of the scene, on a dark fade that keeps the labels above it readable, and the scene SHALL NOT leave room below itself for the bar. In a narrower window the bar SHALL show below the scene, covering none of it.

#### Scenario: Desktop
- **WHEN** the page is open in a 1440 x 900 window
- **THEN** the bar covers the bottom of the scene, the POWERWALL label stays fully readable, and the card's height does not change

#### Scenario: Phone
- **WHEN** the page is open on a 390 x 844 phone
- **THEN** the bar shows below the scene, and the whole house stays visible

## REMOVED Requirements

### Requirement: Replay bar shown on demand
**Reason**: Below 1024px the bar sits below the scene and covers none of it, so hiding it saved no room, and a phone visitor who didn't tap the scene never learned replay was there.
**Migration**: None; the bar always shows, as the "Replay bar" requirement now says.

### Requirement: Progress line
**Reason**: It stood in for the hidden bar on phones; the bar no longer hides.
**Migration**: None; the bar's scrubber shows the time's place in its day.

### Requirement: Replay bar placement
**Reason**: Its narrow-window slide and reduced-motion scenario go with the hiding; a MODIFIED block can't drop a scenario.
**Migration**: Replaced by "Replay bar position", the same placement without the slide.
