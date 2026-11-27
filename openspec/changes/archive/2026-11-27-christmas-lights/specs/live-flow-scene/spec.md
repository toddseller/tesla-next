## ADDED Requirements

### Requirement: Christmas lights
On a night in the Christmas season the scene SHALL hang 64 bulbs along the roof's edges, alternating red and green, each a small socket and a tapered glass bulb hanging straight down: under the garage front, the garage's east side, the entry recess eave and the sloped edge beside it, the bay window front and the Powerwall side, evenly spaced along each run. Other nights and by day there SHALL be none.

#### Scenario: A night in the season
- **WHEN** the page is open at 9 PM on 2026-11-27
- **THEN** red and green bulbs hang under the six runs of the roof's edges, with the windows lit

#### Scenario: By day in the season
- **WHEN** the page is open at 3 PM on 2026-12-10
- **THEN** no bulb shows

### Requirement: Christmas lights switch with the windows
The bulbs SHALL come on and go off with the house's window lights: on, fully lit, once the sun goes below the horizon at sunset, and off once it comes back above it at sunrise, each switch easing over about 0.15 seconds. They SHALL NOT be dimmed by the house's darkening, cloud or fog.

#### Scenario: Sunset
- **WHEN** the page stays open on 2026-12-10 as the sun goes below the horizon
- **THEN** the bulbs and the windows go from unlit to fully lit together, in about 0.15 seconds

#### Scenario: A foggy night
- **WHEN** the page is open at 9 PM on 2026-12-10 under full cloud
- **THEN** the bulbs are as bright as on a clear night

### Requirement: The Christmas season
A night SHALL count by the site's date of the evening it starts, a time before noon belonging to the evening before. The season SHALL run from the evening of the Friday after Thanksgiving, the fourth Thursday of November, through the evening of January 1, worked out for each year, live and in replay by the shown time.

#### Scenario: The first night
- **WHEN** the page is open at 9 PM on 2026-11-27, the Friday after Thanksgiving
- **THEN** the bulbs are lit

#### Scenario: Thanksgiving night
- **WHEN** the page is open at 5 AM on 2026-11-27, in the night that began on Thanksgiving evening
- **THEN** no bulb shows

#### Scenario: The last night
- **WHEN** the page is open at 5 AM on 2027-01-02
- **THEN** the bulbs are lit, the night having begun on the evening of January 1

#### Scenario: After the season
- **WHEN** the page is open at 7 PM on 2027-01-02
- **THEN** no bulb shows

#### Scenario: Another year in replay
- **WHEN** 2025-11-28, the Friday after Thanksgiving 2025, is replayed at 9 PM, and 2025-11-27 is replayed at 9 PM
- **THEN** the bulbs show on the 28th and not on the 27th

### Requirement: Christmas lights twinkle
Each bulb SHALL fade gently and back, in one of three groups out of step with one another, at its own pace whatever the replay speed. The twinkling SHALL hold still while a replay is paused, and the bulbs SHALL shine steadily for a viewer who prefers reduced motion.

#### Scenario: Twinkling
- **WHEN** the page is open on a night in the season
- **THEN** the bulbs brighten and dim in three staggered groups, never all dark at once

#### Scenario: Reduced motion
- **WHEN** a viewer who prefers reduced motion opens the page on a night in the season
- **THEN** every bulb shines steadily

#### Scenario: A paused replay
- **WHEN** a replay is paused at 9 PM on a night in the season
- **THEN** the bulbs show and hold still

### Requirement: Christmas lights on a phone
On a phone the bulbs SHALL scale with the scene but SHALL still read as bulbs, each at least about 6 pixels tall, with nothing scrolling sideways.

#### Scenario: A phone in the season
- **WHEN** the page is open at 9 PM on 2026-12-10 on a 390-pixel-wide screen
- **THEN** red and green bulbs show along the roof's edges, each about 6 pixels tall or more
