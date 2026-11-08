# Spec Delta

## Purpose

Lets a visitor replay any past day on the live page's house scene from the stored 5 minute history, scrubbing or playing through it, and share a link to a moment.

## ADDED Requirements

### Requirement: Replay bar
The live page SHALL have a replay bar, shown at the bottom of the scene as the bar's showing and placement requirements set, with the day shown, controls for the previous and next day and a date picker from the first day of service to today in the site's time zone, play and pause, a speed of real time or 1, 10 or 60 minutes per second, a scrubber over the day from midnight to midnight with the time shown, and a LIVE control.

#### Scenario: Opening the live page
- **WHEN** a visitor opens the live page with no replay link
- **THEN** the scene is live, the bar shows today with the scrubber at the current time, and the speed is real time

#### Scenario: Day range
- **WHEN** the bar shows today
- **THEN** the next-day control is unavailable, and the date picker offers no day after today or before the first day of service

### Requirement: Replay bar shown on demand
The replay bar SHALL be hidden until wanted. It SHALL show on opening the page, when a mouse moves over the scene, when the scene is tapped, and when keyboard focus enters the bar, and SHALL hide about 3 seconds after its last use, even with the mouse resting on the scene. It SHALL stay shown while a mouse rests on the bar, while replay is paused, while the date picker or speed menu is open, while the scrubber is held, and while keyboard focus is in the bar.

#### Scenario: Live, untouched
- **WHEN** a visitor opens the live page and leaves it alone for 5 seconds
- **THEN** the bar showed at first and is now hidden

#### Scenario: Mouse over the scene
- **WHEN** a visitor on a desktop moves the mouse over the scene and then leaves it resting there
- **THEN** the bar shows, and hides about 3 seconds after the mouse stops moving

#### Scenario: Mouse on the bar
- **WHEN** a visitor rests the mouse on the shown bar
- **THEN** the bar stays shown, and hides about 3 seconds after the mouse leaves it

#### Scenario: Tap
- **WHEN** a visitor on a phone taps the hidden bar's scene
- **THEN** the bar shows, and hides about 3 seconds after the visitor last used it

#### Scenario: Paused replay
- **WHEN** a visitor opens a replay link, paused, and leaves it alone
- **THEN** the bar stays shown

#### Scenario: Playing replay
- **WHEN** a visitor presses play and leaves the page alone
- **THEN** the bar hides about 3 seconds later while playback continues, and shows again on hover or tap

#### Scenario: Picking a day
- **WHEN** a visitor opens the date picker and takes 10 seconds to choose a day
- **THEN** the bar stays shown until about 3 seconds after the picker closes, or stays on while the new replay is paused

#### Scenario: Keyboard
- **WHEN** a visitor tabs into the hidden bar
- **THEN** the bar shows and stays shown while focus is in it

### Requirement: Progress line
While the replay bar is hidden, a thin line SHALL run along the bottom edge of the scene, filled from its left end to the shown time's place in its day from midnight to midnight, as the scrubber would be. The fill SHALL be red while live and white while replaying.

#### Scenario: Live in the evening
- **WHEN** the page is live at 6:00 PM and the bar is hidden
- **THEN** a red line along the scene's bottom edge is filled three quarters of the way across

#### Scenario: Replay playing
- **WHEN** a replay of yesterday plays from 6:00 AM with the bar hidden
- **THEN** the line is white, a quarter filled, and grows as the replay plays

#### Scenario: Bar shown
- **WHEN** the bar is shown
- **THEN** the line is not

### Requirement: Replay bar placement
In a window at least 1024 pixels wide the bar SHALL show over the bottom of the scene, on a dark fade that keeps the labels above it readable, and the scene SHALL NOT leave room below itself for the bar. In a narrower window the bar SHALL show below the scene, covering none of it. The bar SHALL slide into and out of view, except under reduced motion, where it SHALL appear and disappear without moving.

#### Scenario: Desktop
- **WHEN** the bar shows in a 1440 x 900 window
- **THEN** it covers the bottom of the scene, the POWERWALL label stays fully readable, and the card's height does not change

#### Scenario: Phone
- **WHEN** the bar shows on a 390 x 844 phone
- **THEN** it appears below the scene, and the whole house stays visible

#### Scenario: Reduced motion
- **WHEN** a visitor who prefers reduced motion hovers the scene
- **THEN** the bar appears at once, with no slide

### Requirement: Entering and leaving replay
Picking a day, or moving the scrubber, SHALL put the page in replay at that day and time, paused unless it was playing. The LIVE control SHALL return the scene to live status and the scrubber to now. While the page stays live it SHALL NOT load any history for replay.

#### Scenario: Scrubbing back
- **WHEN** a visitor drags the scrubber to 6:35 PM on today
- **THEN** the scene shows today at 6:35 PM from history instead of live status

#### Scenario: Back to live
- **WHEN** the visitor selects LIVE while replaying
- **THEN** the scene shows live status again, as before the replay

### Requirement: Playback
While playing, replay time SHALL advance by the chosen speed, one replay second per real second at real time, and the scene SHALL update about 10 times a second. On a past day playback SHALL pause at the end of its data; on today it SHALL return to live at the end of its data, as the LIVE control does. Changing the speed SHALL keep the current time.

#### Scenario: Real time
- **WHEN** playback runs at real time from 6:00 PM for 60 seconds
- **THEN** the scene shows 6:01 PM

#### Scenario: Ten minutes per second
- **WHEN** playback runs at 10 minutes per second from 6:00 PM for 3 seconds
- **THEN** the scene shows about 6:30 PM

#### Scenario: End of a past day
- **WHEN** playback reaches midnight at the end of a past day
- **THEN** playback pauses there

#### Scenario: Catching up with today
- **WHEN** playback of today reaches the end of its data
- **THEN** the page returns to live: the scene shows live status with its labels, the scrubber shows now, and the address carries no moment

#### Scenario: Paused at the end of today
- **WHEN** the visitor drags the scrubber to the end of today's data and leaves it paused
- **THEN** the page stays in replay

### Requirement: Paused flows stand still
While replay is paused, each flow SHALL stand still partway along its lines, and SHALL move again when playback resumes; live flows never stand still.

#### Scenario: Paused flows stand still
- **WHEN** a visitor opens a replay link, paused, at a moment when solar flows to the house
- **THEN** the solar flow shows partway along its lines without moving, and moves once the visitor presses play

### Requirement: Replay tag
While the scene shows history, it SHALL show a small "Replay" tag in its top left corner, so a playing replay is not taken for live; live, it SHALL show none.

#### Scenario: Playing at real time
- **WHEN** a visitor plays yesterday at real time
- **THEN** the scene shows the Replay tag while the flows move, and it disappears on LIVE

### Requirement: Scene from history
In replay the scene SHALL show the moment's solar, home, Powerwall and grid power in kW, the battery's charge, car charging, day or night from the replayed time at the site, and the replayed hour's weather, as the scene-weather capability sets. It SHALL draw a flow for each source and destination pair whose recorded power is at least 0.1 kW, as recorded, rather than assigning flows from the totals as live.

#### Scenario: Recorded flows
- **WHEN** the moment's history has solar to Powerwall 5.7 kW, solar to home 0.9 kW and grid to home 0.5 kW
- **THEN** solar flows to the Powerwall and the house and the grid flows to the house, with the labels SOLAR 6.6 kW, HOME 1.4 kW, POWERWALL 5.7 kW and GRID 0.5 kW

#### Scenario: Replaying an evening
- **WHEN** the replay shows 10 PM
- **THEN** the scene shows night with the windows lit

#### Scenario: Replaying a cloudy day
- **WHEN** the replay shows noon on a day that was overcast at noon
- **THEN** the scene shows an overcast sky and no sunlight on the house

### Requirement: Blending between steps
Each stored power value is the average over its 5 minutes and SHALL stand for the middle of them; between two neighboring middles the scene SHALL blend linearly. Battery charge is read at each 5 minute boundary and SHALL blend linearly between boundaries. A value SHALL NOT blend toward a step without that value: it holds over its own 5 minutes only.

#### Scenario: Between two middles
- **WHEN** solar averaged 2.0 kW from 12:30 to 12:35 and 5.0 kW from 12:35 to 12:40, and the replay shows 12:35:00
- **THEN** SOLAR reads 3.5 kW

#### Scenario: Next to a hole
- **WHEN** the step from 12:35 to 12:40 has no power data and the replay shows 12:36
- **THEN** the scene shows no flows and dashes for the power labels, and at 12:33 it shows the 12:30 step's values unblended

#### Scenario: Battery between readings
- **WHEN** the battery read 50% at 12:30 and 52% at 12:35, and the replay shows 12:32:30
- **THEN** POWERWALL shows 51%

### Requirement: Days without battery history
For a moment with no battery charge, the replay SHALL show no charge bar and the POWERWALL label SHALL show only its power.

#### Scenario: Before battery history
- **WHEN** a visitor replays 2025-06-01 at noon
- **THEN** the Powerwall has no charge bar and its label shows only kW

### Requirement: Car in replay
While the history names a car plugged in at the replayed moment, the replay SHALL show the garage open with the Wall Connector and that car's image, or the Model 3's for a car without its own, plugged in, with a car label titled with its name and its charging power in kW and no battery level, whether or not it is charging. While the history names no car but the moment's charging is at least 0.1 kW, as with charging estimated from charge sessions, the replay SHALL show it the same way, named "Vehicle". Otherwise the garage SHALL be shown closed with no car label.

#### Scenario: Charging overnight
- **WHEN** the replay shows a moment when R2D2 was plugged in charging at 7.2 kW
- **THEN** the garage is open with R2D2 plugged in, labeled R2D2 7.2 kW, and its flows run along the cable

#### Scenario: Plugged in, not charging
- **WHEN** the replay shows a moment when Tesla T.I.E. Fighter was plugged in at 0 kW
- **THEN** the garage is open with the Model 3 plugged in, labeled Tesla T.I.E. Fighter 0 kW, with no flow to the car

#### Scenario: A car without its own image
- **WHEN** the history names a car with no registered image, such as "Vehicle"
- **THEN** the garage is open with the Model 3 plugged in, labeled with that name

#### Scenario: Charging from a charge session
- **WHEN** the replay shows 2026-08-20 02:00, charging at 7.7 kW estimated from a charge session with no car named
- **THEN** the garage is open with the Model 3 plugged in, labeled Vehicle 7.7 kW, and its flows run along the cable

#### Scenario: No car
- **WHEN** the replay shows a moment with no car named and charging below 0.1 kW, or a day before car history
- **THEN** the garage is closed and no car label is shown

### Requirement: Replaying today
Replaying today SHALL run up to the end of the latest stored step with energy flows; a step with only a battery reading, whose flows Tesla hasn't published yet, SHALL NOT extend it. When the server announces updated totals for today while it is replayed, the day's history SHALL reload, extending how far it runs without moving the replay time.

#### Scenario: New data arrives
- **WHEN** today is replayed with data to 2:15 PM and the server announces updated totals for today
- **THEN** the history reloads and the replay can run to the new latest step

#### Scenario: Flows not yet published
- **WHEN** today's history has flows to 1:35 PM and a battery reading at 1:35 PM without flows
- **THEN** its replay runs to 1:35 PM, and playback returns to live there, without showing dashes

### Requirement: Shareable replay link
The address `/distribution?at=YYYY-MM-DDTHH:MM`, in the site's time zone, SHALL open the replay at that moment, paused. While replaying, the address SHALL show the replay's moment, to the minute, whenever it is paused, scrubbed or moved to another day, without adding browser history entries. LIVE SHALL remove `at`. An `at` that is not a valid moment from the first day of service to now SHALL open the live page.

#### Scenario: Opening a shared moment
- **WHEN** a visitor opens `/distribution?at=2026-10-19T18:35`
- **THEN** the scene shows 6:35 PM on 2026-10-19, paused

#### Scenario: Copying the address
- **WHEN** a visitor pauses the replay at 7:02 PM on 2026-10-19
- **THEN** the address reads `/distribution?at=2026-10-19T19:02`

#### Scenario: A bad link
- **WHEN** a visitor opens `/distribution?at=2031-01-01T12:00`
- **THEN** the live page opens live
