## ADDED Requirements

### Requirement: Santa's sleigh crosses the Christmas Eve sky
On Christmas Eve night at the site, with the sun 6 or more degrees below the horizon, Santa's sleigh SHALL cross the sky: Santa seated in the sleigh, eight reindeer in four pairs and Rudolph alone in the lead, rendered in 3D. The first pass SHALL come within a few seconds of the night showing, then another 3 to 5 minutes after each pass ends while the page is open, in a random direction, the team facing the way it flies.

#### Scenario: A pass on Christmas Eve
- **WHEN** the page is open at 9 PM on 2026-12-24
- **THEN** within a few seconds Santa's sleigh crosses the sky, and another follows 3 to 5 minutes after it has gone

#### Scenario: Reduced motion
- **WHEN** a viewer who prefers reduced motion opens the page at 9 PM on 2026-12-24
- **THEN** no sleigh crosses the sky

### Requirement: Christmas Eve night
Christmas Eve night SHALL be the night that starts on the evening of December 24, a night counting by the site's date of the evening it starts, as the Christmas lights count it; live and in replay, by the shown time.

#### Scenario: The small hours of Christmas morning
- **WHEN** the page is open at 3 AM on 2026-12-25
- **THEN** passes keep coming, the night having begun on the evening of December 24

#### Scenario: Other nights
- **WHEN** the page is open at 9 PM on 2026-12-23 or at 9 PM on 2026-12-25
- **THEN** no sleigh crosses the sky

#### Scenario: Not by day or at dusk
- **WHEN** the page is open on December 24 with the sun 3 degrees below the horizon, or at noon on December 24
- **THEN** no sleigh crosses the sky

#### Scenario: Another year in replay
- **WHEN** 9 PM on 2025-12-24 is replayed
- **THEN** within a few seconds Santa's sleigh crosses the sky

### Requirement: The reindeer gallop
While the sleigh crosses, every reindeer SHALL gallop through the air: shoulders and haunches swinging, front knees folding as the legs come forward and hind legs folding as they swing under, then stretching back on the push-off, with the whole team rising and falling slightly with the stride. Each reindeer SHALL be a little out of step with the one ahead of it, and the stride SHALL keep its own pace whatever the replay speed.

#### Scenario: Legs in motion
- **WHEN** a pass is crossing
- **THEN** each reindeer's legs move through a full gallop about one and a half times a second, the hind legs stretched back behind the body at the push-off

#### Scenario: Not in lockstep
- **WHEN** a pass is crossing
- **THEN** neighboring reindeer are at different points in their stride at the same moment

### Requirement: Each pass takes its own path
Each pass SHALL fly at its own distance, chosen at random from near to far: a near pass large, lower in the sky, quicker and seen three-quarter on; a far pass small, high, slower and dimmed and grayed by the distance; passes between at sizes, heights and speeds between. Every pass SHALL stay in the sky above the roof, clear of the house and its labels, and SHALL fly in front of the moon and behind the roof's weather vane.

#### Scenario: A near pass
- **WHEN** a pass flies at its nearest
- **THEN** the team spans about a third of the scene's width, seen three-quarter on, crossing in about 35 seconds

#### Scenario: A far pass
- **WHEN** a pass flies at its farthest
- **THEN** the team spans about a tenth of the scene's width, seen side-on, high in the sky, dimmer and grayer than a near pass, crossing in about 80 seconds

#### Scenario: Clear of the house
- **WHEN** any pass crosses, on a desktop or a 390-pixel-wide phone
- **THEN** no part of the team covers the roof, the house or a label

#### Scenario: Across the moon
- **WHEN** a pass crosses the place where the moon is
- **THEN** the team passes in front of the moon

### Requirement: Rudolph's nose shows through any weather
The more cloud, the fainter the sleigh and team SHALL show, down to about half under full cover, so some of them always shows; rain SHALL not hide them further. Rudolph's nose SHALL glow red at full strength over the clouds and rain whatever the weather.

#### Scenario: A clear night
- **WHEN** a pass crosses with no cloud
- **THEN** the sleigh and team show at full strength, Rudolph's nose glowing red

#### Scenario: Overcast and raining
- **WHEN** a pass crosses under full cloud in rain
- **THEN** the sleigh and team show at about half strength, and Rudolph's nose glows as brightly as on a clear night

### Requirement: Santa's sleigh finishes its crossing
A pass under way SHALL finish its crossing even if the replay pauses or the night ends, while no new pass starts until Christmas Eve night shows and plays again; the first pass after that SHALL then come within a few seconds.

#### Scenario: Paused replay
- **WHEN** a Christmas Eve replay is paused
- **THEN** no new pass starts, and a sleigh already crossing finishes its crossing

#### Scenario: Fast replay through Christmas Eve
- **WHEN** Christmas Eve is replayed at 10 minutes a second from dusk until the replay stops at midnight
- **THEN** a sleigh starts crossing within a few seconds of the night showing and finishes its crossing after the replay stops
