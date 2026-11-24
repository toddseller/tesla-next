## MODIFIED Requirements

### Requirement: Replay bar shown on demand
In a window at least 1024 pixels wide the replay bar SHALL always show. In a narrower window it SHALL be hidden until wanted: it SHALL show on opening the page, when a mouse moves over the scene, when the scene is tapped, and when keyboard focus enters the bar, and SHALL hide about 3 seconds after its last use, even with the mouse resting on the scene. It SHALL stay shown while a mouse rests on the bar, while replay is paused, while the date picker or speed menu is open, while the scrubber is held, and while keyboard focus is in the bar.

#### Scenario: Desktop, untouched
- **WHEN** a visitor opens the live page in a 1440 x 900 window and leaves it alone for 5 seconds
- **THEN** the bar still shows

#### Scenario: Live, untouched
- **WHEN** a visitor opens the live page on a 390 x 844 phone and leaves it alone for 5 seconds
- **THEN** the bar showed at first and is now hidden

#### Scenario: Mouse over the scene
- **WHEN** a visitor in a window under 1024 pixels wide moves the mouse over the scene and then leaves it resting there
- **THEN** the bar shows, and hides about 3 seconds after the mouse stops moving

#### Scenario: Mouse on the bar
- **WHEN** a visitor in a window under 1024 pixels wide rests the mouse on the shown bar
- **THEN** the bar stays shown, and hides about 3 seconds after the mouse leaves it

#### Scenario: Tap
- **WHEN** a visitor on a phone taps the hidden bar's scene
- **THEN** the bar shows, and hides about 3 seconds after the visitor last used it

#### Scenario: Paused replay
- **WHEN** a visitor on a phone opens a replay link, paused, and leaves it alone
- **THEN** the bar stays shown

#### Scenario: Playing replay
- **WHEN** a visitor on a phone presses play and leaves the page alone
- **THEN** the bar hides about 3 seconds later while playback continues, and shows again on a tap

#### Scenario: Picking a day
- **WHEN** a visitor on a phone opens the date picker and takes 10 seconds to choose a day
- **THEN** the bar stays shown until about 3 seconds after the picker closes, or stays on while the new replay is paused

#### Scenario: Keyboard
- **WHEN** a visitor tabs into the hidden bar in a window under 1024 pixels wide
- **THEN** the bar shows and stays shown while focus is in it

### Requirement: Progress line
In a window under 1024 pixels wide, while the replay bar is hidden, a thin line SHALL run along the bottom edge of the scene, filled from its left end to the shown time's place in its day from midnight to midnight, as the scrubber would be. The fill SHALL be red while live and white while replaying. A wider window, where the bar always shows, SHALL show no line.

#### Scenario: Live in the evening
- **WHEN** the page is live at 6:00 PM on a phone and the bar is hidden
- **THEN** a red line along the scene's bottom edge is filled three quarters of the way across

#### Scenario: Replay playing
- **WHEN** a replay of yesterday plays from 6:00 AM on a phone with the bar hidden
- **THEN** the line is white, a quarter filled, and grows as the replay plays

#### Scenario: Bar shown
- **WHEN** the bar is shown
- **THEN** the line is not

### Requirement: Replay bar placement
In a window at least 1024 pixels wide the bar SHALL show over the bottom of the scene, on a dark fade that keeps the labels above it readable, and the scene SHALL NOT leave room below itself for the bar. In a narrower window the bar SHALL show below the scene, covering none of it, and SHALL slide into and out of view, except under reduced motion, where it SHALL appear and disappear without moving.

#### Scenario: Desktop
- **WHEN** the page is open in a 1440 x 900 window
- **THEN** the bar covers the bottom of the scene, the POWERWALL label stays fully readable, and the card's height does not change

#### Scenario: Phone
- **WHEN** the bar shows on a 390 x 844 phone
- **THEN** it appears below the scene, and the whole house stays visible

#### Scenario: Reduced motion
- **WHEN** a visitor on a phone who prefers reduced motion taps the scene
- **THEN** the bar appears at once, with no slide
