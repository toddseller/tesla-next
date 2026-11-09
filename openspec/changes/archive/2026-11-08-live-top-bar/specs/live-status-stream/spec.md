# Spec Delta

## ADDED Requirements

### Requirement: One stream per tab
A page's top bar and the page itself SHALL share one stream: a browser tab SHALL hold at most one open stream however many parts of the page listen to it, each receiving every live status and `totals` event, and the stream SHALL close when nothing on the page listens any more.

#### Scenario: The True-Up Tracker open
- **WHEN** a viewer has the True-Up Tracker open, whose top bar shows the live status and whose page reloads on `totals` events
- **THEN** the tab has one stream open, and both the top bar and the page receive its events

#### Scenario: Moving to another page
- **WHEN** the viewer moves from the True-Up Tracker to the Top Ten page in the same tab
- **THEN** the tab still has one stream open

## MODIFIED Requirements

### Requirement: Updates reach open pages within a second
Each live status Flask notifies SHALL reach every open page as a server-sent event within one second, with the same fields as anton's `live` socket event: `load_power`, `home_power`, `solar_power`, `grid_power`, `battery_power`, `battery_percentage`, `battery_status`, `vehicle`, `modified` and `weather`. All open pages SHALL receive identical content.

#### Scenario: Two pages open
- **WHEN** two browsers have the Distribution page open for one minute while Flask polls every 10 seconds
- **THEN** each receives about six updates, each within a second of Flask's notification, with identical content

#### Scenario: Another page open
- **WHEN** a browser has the Solar page open for one minute
- **THEN** it receives about six updates, which its top bar shows

### Requirement: A page gets the current status at once
The Next.js server SHALL keep the latest live status it has received. Every page SHALL be rendered with it, the Distribution page's labels and every page's top bar, and a stream opening SHALL send it first, without waiting for the next update.

#### Scenario: Opening the page between updates
- **WHEN** a viewer opens the Distribution page 7 seconds after the last update
- **THEN** the labels show that update's values in the page as served, before any script runs

#### Scenario: Opening another page between updates
- **WHEN** a viewer opens the Impact page 7 seconds after the last update
- **THEN** the top bar shows that update's time, charge and state in the page as served, before any script runs

### Requirement: Before the first update
Until the Next.js server has received its first live status since it started, pages SHALL be rendered without one, so the Distribution page's labels and every top bar's time, charge and state show dashes, and streams SHALL send no status until it arrives.

#### Scenario: Right after a deploy
- **WHEN** the page is opened 3 seconds after the server started
- **THEN** the labels show dashes, and fill in with the first update
