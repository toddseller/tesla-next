# live-flow-scene Specification

## Purpose

Shows the site's live energy flows on an isometric render of the house, in the manner of the Tesla app: solar on the roof, the Powerwall, the grid and the plugged-in car, each labeled with its live values, with energy drawn moving along lines through the electrical panel.

## Requirements

### Requirement: Scene elements
The live page SHALL show an isometric render of the house, its background transparent, standing on dark ground under the site's sky, as the scene-weather capability sets.

#### Scenario: Page opened
- **WHEN** a viewer opens the live page
- **THEN** the render of the house and the SOLAR, HOME, POWERWALL and GRID labels are visible

### Requirement: Energy lines
The scene SHALL draw dark gray lines along the isometric axes of the walls and ground connecting the solar panels, the Powerwall and the house to the electrical panel, and a line leaving the panel downward toward the grid. These lines SHALL be visible whether or not energy is flowing.

#### Scenario: Nothing flowing
- **WHEN** solar, the Powerwall and the grid are all at 0 kW
- **THEN** the solar, home, Powerwall and grid lines are shown in gray with no moving gradient

### Requirement: Lines beneath the elements
The energy lines and their flows SHALL be drawn above the house but beneath the elements they connect: the solar panels, the window, the electrical panel, the Powerwall, and with the garage open the Wall Connector. A line SHALL start or end beneath its element rather than at its edge, so no line or flow is drawn over an element. The charging cable is the one exception: it runs over the car to plug into its charge port.

#### Scenario: Solar feeding the house
- **WHEN** solar flows to the house
- **THEN** the solar gradient emerges from beneath the solar panels, disappears into the electrical panel, and the house's gradient runs out of the panel and under the window frame

#### Scenario: Powerwall line
- **WHEN** the Powerwall discharges to the house
- **THEN** its gradient emerges from beneath the Powerwall, not from on top of it

### Requirement: Live labels
Each element SHALL have a label next to it, without a leader line: SOLAR with solar power, HOME with home power excluding car charging, POWERWALL with battery power and charge percentage, and GRID with grid power, all in kW to one decimal. Labels SHALL update with each live status update, and show a dash until the first one arrives.

#### Scenario: Midday values
- **WHEN** live status reports 6.1 kW solar, 4.1 kW home, 0 kW Powerwall at 100% and 2.0 kW grid
- **THEN** the labels read SOLAR 6.1 kW, HOME 4.1 kW, POWERWALL 0 kW · 100% and GRID 2.0 kW

#### Scenario: Before the first update
- **WHEN** the page opens before any live status has been received
- **THEN** each label shows a dash instead of a value

### Requirement: Stale live data warning
The live page SHALL show no update time while live updates arrive, as the moving flows show the data is live. When the timestamp on the latest live status is 2 minutes old or more, measured every second against the viewer's clock, the page SHALL show an amber warning "No update for N min", in whole minutes, whose hover shows that timestamp to the second, and SHALL remove it when a fresh live status arrives. Before the first live status it SHALL show nothing. While the scene is replaying history it SHALL show no warning.

#### Scenario: Data arriving
- **WHEN** the latest live status is stamped 38 seconds before now
- **THEN** the page shows no update time and no warning

#### Scenario: Updates stopped
- **WHEN** the latest live status is stamped 12:33:37 and the viewer's clock reaches 12:36:47 with no newer one
- **THEN** an amber warning reads "No update for 3 min", and hovering it shows 12:33:37 PM

#### Scenario: Updates resume
- **WHEN** a fresh live status arrives while the warning is shown
- **THEN** the warning disappears

#### Scenario: Before the first update
- **WHEN** the page opens before any live status has been received
- **THEN** the page shows no update time and no warning

#### Scenario: Replaying while updates are stopped
- **WHEN** live updates stopped 5 minutes ago and the visitor is replaying yesterday
- **THEN** no warning is shown, and it returns on LIVE

### Requirement: Plugged-in car
When live status reports a plugged-in car, the scene SHALL show a label at the garage titled with the car's name, with its charging power in kW and, when known, its battery percentage, and SHALL show the garage open with the Wall Connector and that car's image when one is registered for it, or the garage closed when none is. When no car is plugged in, the car label SHALL be hidden and the garage shown closed. The Wall Connector SHALL be shown only while the garage is open. In replay the car is shown as the replay specifies instead.

#### Scenario: Car plugged in, not charging
- **WHEN** live status reports R2D2 plugged in at 0 kW with a battery level of 80%
- **THEN** the garage is labeled R2D2 with 0 kW · 80%

#### Scenario: Battery level unknown
- **WHEN** the plugged-in car has no battery level yet
- **THEN** its label shows only the name and charging power

#### Scenario: No car
- **WHEN** live status reports no plugged-in car
- **THEN** no car label is shown and the garage is shown closed, with no Wall Connector

#### Scenario: Car with its own render
- **WHEN** R2D2, which has its own image, is plugged in
- **THEN** the garage is shown open with the Wall Connector and R2D2 plugged in

#### Scenario: Car without its own render
- **WHEN** a car with no registered image is plugged in
- **THEN** the garage is shown closed, with no Wall Connector

### Requirement: Charging cable flow
While the garage is open with a car, the scene SHALL draw that car's charging cable as a gray line from beneath the Wall Connector to a plug in the car's charge port, drawn over the car, and flows into the car SHALL run along it, starting when the source's flow reaches the electrical panel.

#### Scenario: Solar charging R2D2
- **WHEN** solar charges R2D2 at 3.2 kW
- **THEN** a solar gradient runs down R2D2's cable from the Wall Connector to the plug in its charge port, as the solar flow reaches the panel

#### Scenario: Each car has its own cable
- **WHEN** Tesla T.I.E. Fighter is charging instead of R2D2
- **THEN** the gradient follows Tesla T.I.E. Fighter's cable, not R2D2's

#### Scenario: Plugged in, not charging
- **WHEN** R2D2 is plugged in at 0 kW
- **THEN** its cable is shown in gray with no moving gradient

### Requirement: Stale car battery level
When the car's battery level was reported 6 or more hours before now, its label SHALL include how long ago it was reported.

#### Scenario: Car asleep since the morning
- **WHEN** the battery level of 76% was reported 8 hours ago
- **THEN** the label shows 76% and "8 h ago"

### Requirement: Active flows
While energy flows from a source to a destination at 0.1 kW or more, a gradient in the source's color SHALL travel repeatedly along the lines from the source, through the electrical panel, to the destination. Lines with no flow SHALL have no gradient.

#### Scenario: Exporting solar while charging the car
- **WHEN** solar is 6.1 kW, home is 0.9 kW, grid is -2.0 kW and the car charges at 3.2 kW
- **THEN** solar flows to the house, the car and the grid, and nothing flows from the Powerwall or the grid

#### Scenario: Night on battery
- **WHEN** solar is 0 kW, the Powerwall discharges 1.2 kW and the grid is 0 kW
- **THEN** the only flow is from the Powerwall to the house

#### Scenario: Solar charging the Powerwall
- **WHEN** solar is 6.1 kW, home is 1.8 kW, the Powerwall charges at 4.3 kW and the grid is 0 kW
- **THEN** solar flows to the house and to the Powerwall

### Requirement: Flow assignment
Sources are solar while it produces, the Powerwall while it discharges and the grid while importing; destinations are the house, the car while it charges, the Powerwall while it charges and the grid while exporting. Taking sources in the order solar, Powerwall, grid, solar SHALL be assigned to destinations in the order Powerwall, home, car, grid, and the Powerwall and the grid in the order home, car, Powerwall, grid, as Tesla attributes Powerwall charging to solar before the grid. Every active source SHALL show at least one flow.

#### Scenario: Totals that don't balance
- **WHEN** solar is 6.1 kW and the grid imports 2.0 kW while home uses 4.1 kW
- **THEN** solar flows to the house and the grid flows to the house as well

#### Scenario: Powerwall charging while the grid covers the house
- **WHEN** solar is 1.0 kW, the Powerwall charges at 0.9 kW, the grid imports 1.2 kW and home uses 1.2 kW
- **THEN** solar flows to the Powerwall, the grid flows to the house, and nothing flows from the grid to the Powerwall

### Requirement: Multiple sources into one destination
When two or more sources flow into the house or the Powerwall, each source after the first SHALL flow along its own line, parallel to the destination's line: with two sources, below it; with three, solar above it and the grid below it. A source whose line runs straight on through the panel into the destination SHALL keep the destination's line. Each extra line SHALL be the destination's line moved straight up or down, with no bends, so that its ends lie directly above or below the destination line's ends, and SHALL run close beside it. Sources charging the car share its cable. These extra lines SHALL be shown only while their flow is active.

#### Scenario: Solar and grid feeding the house
- **WHEN** solar is 2.0 kW, home is 3.5 kW and the grid imports 1.5 kW
- **THEN** solar flows along the house's line and the grid along a second, parallel line into the house

#### Scenario: Solar and the Powerwall feeding the house
- **WHEN** solar is 1.0 kW, the Powerwall discharges 2.0 kW and home is 3.0 kW
- **THEN** the Powerwall flows straight across the panel along the house's line, and solar along a second line below it

#### Scenario: Solar, the Powerwall and the grid feeding the house
- **WHEN** solar is 0.7 kW, the Powerwall discharges 0.6 kW, the grid imports 0.2 kW and home is 1.5 kW
- **THEN** the Powerwall flows along the house's line, solar along a line just above it and the grid along a line just below it, and all three lines end under the window

#### Scenario: Single source
- **WHEN** only solar feeds the house
- **THEN** the house has a single line

#### Scenario: Second line lines up with the main line
- **WHEN** the grid flows into the house along a second line
- **THEN** that line is straight, its ends are directly below the main line's ends, and the space between the two lines is less than the width of a line

### Requirement: Exporting from two sources
When two sources export at once, the grid line SHALL show only the flow from the source exporting more, in that source's color, with no second line.

#### Scenario: Solar and the Powerwall exporting
- **WHEN** solar is 6.0 kW, home is 1.0 kW, the Powerwall discharges 3.0 kW and the grid exports 8.0 kW
- **THEN** the grid line carries a single solar gradient, and the Powerwall's flow stops at the panel

### Requirement: Day and night
The scene SHALL show day and night by the sun's height at the site (Half Moon Bay, California), from the viewer's clock, whatever the solar output and whether or not live data has arrived, with the house darker at night. It SHALL change gradually through twilight: full day with the sun 6 degrees or more above the horizon, full night with it 6 degrees or more below, and in between partway, in proportion to the sun's height. This applies to the sky behind the house, the overcast gray, the ground, the house's darkening and the rain's dimming, and none of these SHALL jump at sunset or sunrise. While the page is open the scene SHALL follow the sun within about a minute, easing each step over 1.5 seconds. At night the house's windows SHALL be lit in a warm color, every window about equally bright and not darkened with the house; by day they SHALL show unlit. The windows SHALL switch like house lights, not fade: on, fully lit, once the sun goes below the horizon at sunset, and off once it comes back above it at sunrise, each switch easing over about 0.15 seconds.

#### Scenario: Evening
- **WHEN** the page stays open from 45 minutes before sunset to 45 minutes after, at the site on 2026-10-19 (sunset 6:28 PM)
- **THEN** the scene shows day at the start and night at the end, darkening a little at a time between, without waiting for a live update and with no jump at sunset

#### Scenario: At sunset
- **WHEN** the page is open at sunset with no cloud
- **THEN** the house is darker than by day and lighter than at night, and the windows are lit as brightly as at night

#### Scenario: Lights switch on at sunset
- **WHEN** the page stays open as the sun goes below the horizon
- **THEN** the windows go from unlit to fully lit in about 0.15 seconds, and are never partly lit before or after

#### Scenario: Lights switch off at sunrise
- **WHEN** the page stays open as the sun comes above the horizon
- **THEN** the windows go from fully lit to unlit in about 0.15 seconds, and are never partly lit before or after

#### Scenario: Morning
- **WHEN** the page stays open through sunrise
- **THEN** the scene turns from night to day as gradually as it did at sunset, apart from the window lights, which switch off

#### Scenario: Lights on at night
- **WHEN** the page is open at 10 PM
- **THEN** the house's windows are lit, including the window on the right wall the house line runs into, while the house is darkened

#### Scenario: Lights off by day
- **WHEN** the page is open at 3 PM
- **THEN** no window is lit

#### Scenario: Lights off in twilight before sunset
- **WHEN** the page is open 15 minutes before sunset
- **THEN** the house is partway darkened and no window is lit

#### Scenario: Opening the page by day
- **WHEN** the page is opened at 3 PM, before its first live update
- **THEN** it shows day from the start, with no lights fading out

#### Scenario: Opening the page at dusk
- **WHEN** the page is opened 15 minutes after sunset
- **THEN** it shows that moment's partway look from the start, with the windows fully lit and nothing fading in from day

#### Scenario: Overcast afternoon
- **WHEN** solar production is under 0.1 kW at 3 PM
- **THEN** the scene still shows day

### Requirement: Fits a phone
The scene SHALL scale to the width of its container, and at a 375 pixel wide screen all labels SHALL be visible, not overlapping, and at least 11 pixels tall.

#### Scenario: Phone portrait
- **WHEN** the page is viewed on a 375 pixel wide screen with a car plugged in
- **THEN** all five labels are readable without scrolling sideways

### Requirement: Side padding
The scene's dark backdrop SHALL extend beyond the house and its labels on the left and right, by about 48 pixels on a desktop window narrowing to about 12 pixels on a phone, so neither the render nor any label touches the backdrop's sides. The labels' fit on a phone SHALL hold inside that padding.

#### Scenario: Desktop window
- **WHEN** the live page is viewed in a 1440 pixel wide window
- **THEN** there are about 48 pixels of backdrop between each side of the backdrop and the house or nearest label

#### Scenario: Phone with padding
- **WHEN** the live page is viewed on a 375 pixel wide screen with a car plugged in
- **THEN** there are about 12 pixels of backdrop on each side, and all five labels are still readable, not overlapping and at least 11 pixels tall

### Requirement: Size on a desktop
In a window at least 1024 pixels wide, the scene SHALL be as wide as the window allows and as wide as the window height would allow the scene without its sky above the roof to show without scrolling, up to 1280 pixels, so the house is the same size as before the sky was added. The scene MAY be wider than the page frame around the other content. The sky above the roof MAY push the scene's bottom below the window. In a narrower window, such as a phone in either orientation, the scene SHALL fill its container up to 896 pixels, whatever the window height.

#### Scenario: 1080p monitor
- **WHEN** the Distribution page is viewed in a 1920 x 940 window
- **THEN** the scene is 1280 pixels wide, wider than the 1200 pixel frame of the top bar, with its bottom edge about 70 pixels below the window

#### Scenario: Tall monitor
- **WHEN** the Distribution page is viewed in a 2560 x 1300 window
- **THEN** the scene is 1280 pixels wide, wider than the 1200 pixel frame of the top bar

#### Scenario: Laptop
- **WHEN** the Distribution page is viewed in a 1512 x 870 window
- **THEN** the scene is 1280 pixels wide, with no sidebar taking any of the window's width

#### Scenario: Short window
- **WHEN** the Distribution page is viewed in a 1920 x 760 window
- **THEN** the scene is about 1110 pixels wide, as wide as the window's height allows with the house up to its roof in view

#### Scenario: Phone in landscape
- **WHEN** the Distribution page is viewed on an 844 x 390 phone screen turned sideways
- **THEN** the scene fills the width of its container, larger than in portrait, and no label overlaps another

### Requirement: Sharp on high-density screens
The scene's images SHALL have at least two image pixels per CSS pixel of the house render at the scene's largest size, so they show no upscaling blur on a 2x screen.

#### Scenario: Retina at full size
- **WHEN** the scene is 1280 pixels wide on a 2x screen
- **THEN** every image layer is drawn from at least as many pixels as it covers on the screen

### Requirement: Labels scale with the scene
The labels' text SHALL grow in proportion to the scene's width up to its largest size, so the labels keep the same size relative to the house at every desktop width, and SHALL stay at least 11 pixels tall on a phone.

#### Scenario: Full-size scene
- **WHEN** the scene is 1280 pixels wide
- **THEN** each label's text is in the same proportion to the house as at 900 pixels wide

### Requirement: Powerwall charge bar
The Powerwall SHALL show its charge as a thin green bar, in the Powerwall's flow color, on the lower piece of its dark side face, filling from the bottom in proportion to the battery's charge from 0 to 100% and leaning with the face. While live, until the first battery reading arrives the bar SHALL show 20%; in replay a moment with no battery charge SHALL show no bar. The bar SHALL NOT be darkened with the house at night.

#### Scenario: Half charged
- **WHEN** live status reports the Powerwall at 50%
- **THEN** the bar fills the lower half of its full height, and the label reads the same 50%

#### Scenario: Full
- **WHEN** live status reports the Powerwall at 100%
- **THEN** the bar reaches the top of the lower piece, leaving the same gap above it as below, and the top piece stays dark

#### Scenario: Below the reserve
- **WHEN** live status reports the Powerwall at 8%
- **THEN** the bar shows 8%, not 20%

#### Scenario: Before the first reading
- **WHEN** the live page opens, before any battery reading
- **THEN** the bar shows 20% while the POWERWALL label shows a dash

#### Scenario: Replay without a reading
- **WHEN** the replay shows a moment with no battery charge
- **THEN** no bar is shown

#### Scenario: At night
- **WHEN** the scene shows night
- **THEN** the bar is as bright as by day while the house and the Powerwall are darkened

### Requirement: Solar panels glow with output
Every solar panel on the roof SHALL take on a faint gold tint while solar produces, keeping the panels' own shading and roughly their darkness. Its strength SHALL grow in proportion to solar power, from none at 0 kW to its full strength at 10 kW and no stronger above that, and SHALL be absent while solar is under 0.1 kW. It SHALL ease to each new level over about 1.5 seconds, live and in replay.

#### Scenario: No solar
- **WHEN** solar is under 0.1 kW
- **THEN** the panels show as they do without the glow

#### Scenario: Strength follows output
- **WHEN** solar is 5 kW
- **THEN** the glow is half its full strength, and at 2 kW a fifth of it

#### Scenario: Capped at 10 kW
- **WHEN** solar is 11.3 kW
- **THEN** the glow is at full strength, the same as at 10 kW

#### Scenario: Every panel
- **WHEN** solar is producing
- **THEN** the panels on the garage, the front and the right roof face all glow, and the roof shingles and panel trim do not

#### Scenario: New reading
- **WHEN** a live update moves solar from 3 kW to 6 kW
- **THEN** the glow eases from its old strength to its new one rather than jumping

#### Scenario: Replay
- **WHEN** a replayed day is played through midday
- **THEN** the glow follows each moment's recorded solar power

### Requirement: Sunlight on the house
By day, each visible face of the house SHALL be lit by the sun's position at the site at the shown time: the faces turned most toward the sun brighter and warmer than the art, those turned away darker, with the house's south, east and west faces each taking its own light. The light SHALL ease to each new level over about 1.5 seconds, SHALL be absent at night, and SHALL follow the replayed time in replay.

#### Scenario: Summer morning
- **WHEN** the page is open at 9 AM on June 21, with the sun in the east
- **THEN** the east faces (the garage's right wall and roof face, the courtyard's window wall, the right wing's side wall and roof face) are the brightest and warmest, and the west roof faces the darkest

#### Scenario: Winter noon
- **WHEN** the page is open at noon on December 21, with the sun low in the south
- **THEN** the south faces (the garage door wall, the front door wall, the bay window wall and their roof faces) are the brightest, and the east faces darker than they are on a summer morning

#### Scenario: Each face on its own
- **WHEN** the page is open at 1 PM on June 21, with the sun in the south
- **THEN** the south faces are fully lit while the east faces, fully lit at 9 AM, have faded nearly to shade

#### Scenario: Afternoon
- **WHEN** the page is open at 4 PM, with the sun in the west
- **THEN** the west roof faces are the brightest, and the south and east faces are darker than the art

#### Scenario: Night
- **WHEN** the page is open at 10 PM
- **THEN** no face is lit or darkened by the sun, and the house shows as at night today

#### Scenario: The sun moves
- **WHEN** the page stays open from 11 AM to 1 PM
- **THEN** the light shifts from the east faces toward the west faces gradually, with no jump

#### Scenario: Replay
- **WHEN** a replayed day plays from morning to evening
- **THEN** the light follows the replayed time, as it would have on that date

#### Scenario: Solar panels
- **WHEN** solar produces at 10 AM
- **THEN** the panels take their roof face's light, and their gold glow still shows over it

### Requirement: Sunlight strength follows the sun's height
The sunlight's light and shade SHALL grow with the sun's height above the horizon: from none at sunrise to full strength when the sun is 25 degrees up, and back to none at sunset, so the house eases from and back to the plain art. Above 25 degrees the strength SHALL stay full; the season's peak then limits the light, not the shade. Cloud cover SHALL lower both, as the scene-weather capability sets; the levels here are for a clear sky.

#### Scenario: Early morning
- **WHEN** the page is open at 7 AM on June 21 under a clear sky, with the sun 12 degrees up
- **THEN** the light and shade on the house are under half their full strength

#### Scenario: Mid-morning
- **WHEN** the page is open at 9 AM on June 21 under a clear sky, with the sun 35 degrees up
- **THEN** the light and shade are at full strength

#### Scenario: Winter noon
- **WHEN** the page is open at noon on December 21 under a clear sky, with the sun 29 degrees up
- **THEN** the shade is at full strength, as in summer, and the light at the season's peak

### Requirement: Sunlight peak follows the season
The warm light on the faces turned toward the sun SHALL peak by the sun's noon height on the shown date: full on the June solstice, and in proportion to the strength of the noon sun on other dates, about half on the December solstice. It SHALL change smoothly from day to day and follow the replayed date in replay. The shade on the faces turned away SHALL NOT be limited by it.

#### Scenario: Summer
- **WHEN** the page is open at 1 PM on June 21
- **THEN** the south faces are as bright and warm as before this change

#### Scenario: Autumn
- **WHEN** the page is open at 1 PM on October 21, with the noon sun about 41 degrees up
- **THEN** the south faces' light is about two thirds of June's, and the faces turned away are as dark as in June

#### Scenario: Winter
- **WHEN** the page is open at noon on December 21
- **THEN** the south faces' light is about half of June's

#### Scenario: Equinox
- **WHEN** the page is open at 1 PM on March 20 or September 22
- **THEN** the south faces' light is about four fifths of June's

#### Scenario: No step between seasons
- **WHEN** the page is open at 1 PM on September 21 and again on September 23
- **THEN** the light's peak differs by under a hundredth

#### Scenario: Replay
- **WHEN** a day in December is replayed
- **THEN** the light peaks as on that December date, whatever today's date is
