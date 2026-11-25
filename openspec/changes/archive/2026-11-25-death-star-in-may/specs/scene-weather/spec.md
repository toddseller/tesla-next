# Spec Delta

## MODIFIED Requirements

### Requirement: Moon's face
Outside May, the moon's lit part SHALL show its real face from a map of the whole moon, its seas and craters in their real places, mirrored as the scene's sky is. It SHALL show the side facing Earth at the shown time, as the moon rocks a few degrees each month, and SHALL be turned as it is in the sky at the site at that time. The edge between its lit and unlit parts SHALL fade softly. At night its unlit part SHALL show the surface faintly, as earthshine does; by day it SHALL not show.

#### Scenario: Full moon's face
- **WHEN** the moon is full
- **THEN** it shows the moon's real seas and craters

#### Scenario: Earthshine
- **WHEN** a crescent moon is up at night
- **THEN** the rest of its disc shows faintly, its seas just visible, and the light fades softly into it

#### Scenario: Matches NASA's view
- **WHEN** the moon is drawn for 2026-10-26 05:00 UTC, unmirrored and turned with its north up
- **THEN** it matches NASA's Dial-A-Moon image for that hour, its seas and craters within about a degree of the same places

#### Scenario: Rocking over the months
- **WHEN** the full moons at 2 AM on 2027-04-20 and at 5 AM on 2027-10-15 are replayed
- **THEN** Mare Crisium sits farther in from the edge in April than in October, and the moon's north polar region shows more in April, its south polar region more in October

#### Scenario: Turning across the sky
- **WHEN** the full moon is replayed rising at 6 PM on 2026-11-24 and setting at 7 AM on 2026-11-25
- **THEN** its north pole is tipped about 44 degrees from straight up toward the scene's right as it rises, and about 62 degrees toward the scene's left as it sets

## ADDED Requirements

### Requirement: The Death Star in May
Throughout May at the site, by the shown date, live and in replay, the moon's face SHALL be the Death Star's: gray steel, its shadowed superlaser dish in its northern half on the side facing Earth, its equatorial trench across it. Everything else about the moon SHALL hold as the rest of the year: its place, phase, soft terminator, earthshine, monthly rocking, turn in the sky, dimming by day, by cloud and near the horizon.

#### Scenario: Full Death Star
- **WHEN** the full moon at 1 AM on 2027-05-20 is replayed
- **THEN** the whole disc shows the Death Star, its dish and trench visible, and none of the moon's seas

#### Scenario: Death Star crescent
- **WHEN** a crescent moon in May is up at night
- **THEN** a crescent of the Death Star shows, lit on the side the sunlight comes from

#### Scenario: May begins and ends at the site's midnight
- **WHEN** the moon is shown at 11:59 PM and at midnight Pacific time on April 30 into May 1, and again on May 31 into June 1
- **THEN** it is the moon at 11:59 PM on April 30, the Death Star from midnight on May 1, the Death Star at 11:59 PM on May 31 and the moon from midnight on June 1

#### Scenario: Replaying May from another month
- **WHEN** a May night is replayed in October
- **THEN** the Death Star shows; replaying an October night in May shows the moon

### Requirement: The Death Star is a sphere
In May the Death Star's lit part SHALL be shaded as a matte sphere: brightest where the sun is overhead on it, darkening toward its edge and into the terminator, so even when full it reads as a ball rather than a flat disc. The rest of the year the moon SHALL stay unshaded, as the real moon looks.

#### Scenario: Full Death Star reads round
- **WHEN** the full moon at 1 AM on 2027-05-20 is replayed
- **THEN** the Death Star's center is brighter than its edge

#### Scenario: Half Death Star
- **WHEN** a half moon in May is shown
- **THEN** the lit half is brightest near its outer edge's middle and darkens gradually toward the terminator, rather than ending in an even, sharp half

#### Scenario: Crescent Death Star
- **WHEN** a crescent moon in May is up at night
- **THEN** it is shaded only lightly, staying nearly as bright as unshaded, the shading growing to full strength as the phase nears half

#### Scenario: The moon stays flat
- **WHEN** the full moon at 2 AM on 2027-04-20 is replayed
- **THEN** its brightness shows its seas and craters only, with no darkening toward its edge

### Requirement: The Death Star's lights
In May, at night, the Death Star's unlit part SHALL show its window lights as small points, with a line of them along the trench, over its faint earthshine. By day they SHALL not show, and they SHALL fade in and out through twilight with the earthshine.

#### Scenario: Crescent at night
- **WHEN** a crescent moon in May is up at night with no cloud
- **THEN** the dark part of the disc shows scattered points of light and a line of lights along the trench

#### Scenario: Not by day
- **WHEN** the moon in May is up by day
- **THEN** no lights show on it

### Requirement: A Star Destroyer crosses the May night sky
On May nights at the site, with the sun 6 or more degrees below the horizon, a Star Destroyer SHALL cross the upper sky, about 90 seconds a pass, the first within a few seconds of the night showing and then another 3 to 5 minutes after each pass ends while the page is open, in a random direction. It SHALL fly over the clouds, whatever the weather, and behind the moon.

#### Scenario: A pass on a May night
- **WHEN** the page is open on a clear May night with the sun 10 degrees below the horizon
- **THEN** within a few seconds a Star Destroyer crosses the upper sky, taking about 90 seconds, and another follows 3 to 5 minutes later

#### Scenario: No ship outside May or by day
- **WHEN** the page is open on a June night, or on a May evening with the sun 3 degrees below the horizon
- **THEN** no ship crosses the sky

#### Scenario: Seen at a glance
- **WHEN** a pass crosses a clear night sky
- **THEN** the ship is about a tenth of the scene's width, its moonlit hull and engine glow clearly visible

#### Scenario: Over the clouds
- **WHEN** a pass happens with full cloud cover
- **THEN** the ship shows over the clouds

#### Scenario: Passing behind the Death Star
- **WHEN** a pass crosses the place where the Death Star is
- **THEN** the ship passes behind it

#### Scenario: Reduced motion
- **WHEN** a viewer who prefers reduced motion opens the page on a clear May night
- **THEN** no ship crosses the sky

### Requirement: A Star Destroyer finishes its crossing
A pass under way SHALL finish its crossing even if the replay pauses or the night ends, while no new pass starts until the May night shows and plays again; the next night's first pass SHALL then come within a few seconds.

#### Scenario: Paused replay
- **WHEN** a May night replay is paused
- **THEN** no new pass starts, and a ship already crossing finishes its crossing

#### Scenario: Fast replay through a May evening
- **WHEN** a May evening is replayed at 10 minutes a second from dusk until the replay stops at midnight
- **THEN** a Star Destroyer starts crossing within a few seconds of the night showing and finishes its crossing after the replay stops
