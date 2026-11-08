# Spec Delta

## Purpose

Shows the site's weather in the live and replayed house scene, as Tesla's app does: the sky, clouds, sun glow and ground behind the house, and how cloud changes the light on it.

## ADDED Requirements

### Requirement: Current weather at the site
While live, the scene SHALL show the cloud cover of the server's latest reading, sent with the live data, so it is there as soon as the page's first live values arrive. Rain, drizzle, snow and thunderstorms SHALL show as fully overcast, and so SHALL fog when the reading has no airport cloud. The first weather after the page opens SHALL appear at once, with the first labels; later changes SHALL ease in.

#### Scenario: Page opened on an overcast afternoon
- **WHEN** the page opens at 4:45 PM and the latest reading is 85% cloud cover
- **THEN** the overcast sky appears together with the first live labels, without fading in from a clear sky

#### Scenario: Fog
- **WHEN** the latest reading is fog with 40% cloud cover and no airport cloud
- **THEN** the scene shows a fully overcast sky

#### Scenario: Fog the airport doesn't see
- **WHEN** the latest reading is fog with 40% cloud cover and the airport reports clear
- **THEN** the scene shows the sky from the reading's layers, not a fully overcast one

#### Scenario: Weather changes while open
- **WHEN** the page stays open for an hour while the clouds clear
- **THEN** the sky eases toward clear within 15 minutes of the service reporting it, without a reload

### Requirement: Weather unavailable
When the weather service fails, answers malformed data, or doesn't answer within 10 seconds, the server SHALL keep its last reading and try again at the next 15-minute mark. When it has no reading from the last 3 hours, the scene SHALL show a clear sky, as before weather was shown. A failure SHALL NOT show an error on the page or affect the live data.

#### Scenario: Service down for a while
- **WHEN** the sky shows overcast and the service fails for the next hour
- **THEN** the sky stays overcast, and the live flows and labels update as usual

#### Scenario: Service down at startup
- **WHEN** the server starts while the service is down, and its last stored reading is an hour old
- **THEN** the scene shows that reading's weather

#### Scenario: No recent reading
- **WHEN** the server has no reading from the last 3 hours
- **THEN** the scene shows a clear sky

### Requirement: Sky follows the clouds
The sky behind the house SHALL turn from a clear steel blue, when there is no cloud, to gray when fully overcast. The gray SHALL follow the low cloud share plus half the mid cloud share, staying blue up to 0.4 and turning fully gray by 0.9, so a partly cloudy sky keeps its blue gaps; high cloud SHALL NOT gray the sky. At night it SHALL turn from today's night sky to a dark gray in the same way. Changes SHALL follow the weather's pace: while live, over about 5 minutes from one reading to the next.

#### Scenario: Clear day
- **WHEN** the service reports no cloud at noon
- **THEN** the sky is a steel blue, lighter and grayer than a navy, like the Tesla app's daytime sky, with no clouds

#### Scenario: Partly cloudy
- **WHEN** the service reports 30% low cloud and no mid or high cloud at noon
- **THEN** the sky is blue, not grayed, with scattered white clouds

#### Scenario: Half covered
- **WHEN** the low cloud share is 0.5 and there is no mid cloud at noon
- **THEN** the gray over the blue sky is about 20% opaque

#### Scenario: High cloud only
- **WHEN** the service reports 90% high cloud and no low or mid cloud at noon
- **THEN** the sky is not grayed

#### Scenario: Overcast day
- **WHEN** the service reports 100% low cloud at noon
- **THEN** the sky is gray with darker cloud texture, and no blue shows

#### Scenario: Clearing while open
- **WHEN** the page is open at noon and a new reading's low cloud falls from 0.9 to 0.2
- **THEN** the gray fades over about 5 minutes, with the clouds thinning at the same pace

### Requirement: Clouds
The sky SHALL show clouds in proportion to the cloud cover: none when clear, scattered at partial cover, and covering the sky when overcast. The low clouds SHALL cover about as much of their band as the low cloud share says, as distinct clouds at full strength that grow and merge as it rises, not as fainter clouds of a fixed size; as the sky becomes overcast they SHALL merge into a deck, and darker overcast cloud SHALL fade in from half the low cloud share. By day the brightest sunlit part of a cloud SHALL stay below full white, and its shaded parts SHALL be gray. A change in cover SHALL grow or shrink them gradually, at the weather's pace. At night they SHALL show dimly over the night sky. Between the two they SHALL dim with the sun's height, from their day look with the sun 6 degrees above the horizon to their night look by 6 degrees below, and brighten the same way at sunrise, without a step at sunset or sunrise. They SHALL stay above the roofline.

#### Scenario: Cloudy night
- **WHEN** the service reports 90% low cloud at 10 PM
- **THEN** dim gray clouds cover the night sky above the house

#### Scenario: Through dusk
- **WHEN** the page stays open from 15 minutes before sunset to 30 minutes after, with 70% low cloud
- **THEN** the clouds dim gradually, with no jump at sunset

#### Scenario: A few clouds
- **WHEN** the low cloud share is 0.14 at noon, with no mid or high cloud
- **THEN** a few small, distinct light clouds cover roughly a seventh of the bottom band, as bright as on a cloudier day, with clear blue between and above them

#### Scenario: Not pure white
- **WHEN** the low cloud share is 0.5 at noon, with no mid or high cloud
- **THEN** the brightest sunlit part of a cloud is below full white, and the parts away from the sun are gray

#### Scenario: Half covered
- **WHEN** the low cloud share is 0.5 at noon, with no mid or high cloud
- **THEN** the clouds, larger and partly merged, cover about half the bottom band, with fewer and smaller clouds above it

#### Scenario: Clouds building while open
- **WHEN** the page is open and the low cloud rises from 0.3 to 0.6 between readings
- **THEN** the clouds grow over about 5 minutes, without a sudden jump in their size

#### Scenario: Clouds building in replay
- **WHEN** a replay plays at 60 minutes per second through a morning whose low cloud rises from 0.1 to 0.8
- **THEN** the clouds grow and climb steadily, without visible jumps and without the replay stuttering

### Requirement: Sun glow
By day the sky SHALL show a glow for the sun, crossing from the right of the scene at sunrise, the house's east side, to the left at sunset, its west side, at the sun's real height on the scale the stars use (so higher at noon in summer than in winter), and sinking behind the ground near sunrise and sunset. Near the horizon its core SHALL stay as bright as by day and turn a warm orange, while the haze around it dims, growing paler and the haze stronger as the sun climbs to full once it is 25 degrees up. Cloud SHALL dim and soften it, leaving a faint glow when overcast. At night there SHALL be none.

#### Scenario: Clear afternoon
- **WHEN** the page is open at 2 PM with no cloud
- **THEN** a bright sun glow shows in the sky left of center

#### Scenario: Overcast evening
- **WHEN** the page is open at 4:45 PM with full cloud cover
- **THEN** a faint glow shows lower and further left than at 2 PM

#### Scenario: Glow on the lit side
- **WHEN** the page is open at 4 PM with no cloud
- **THEN** the glow is on the same side of the scene as the west roof faces it lights most

#### Scenario: Sunset
- **WHEN** the page is open a few minutes before sunset with no cloud
- **THEN** the glow is low on the left, its core as bright as in the afternoon and a warm orange, with a fainter haze than in the afternoon

#### Scenario: Night
- **WHEN** the page is open at 10 PM
- **THEN** no sun glow shows

#### Scenario: Winter and summer noon
- **WHEN** solar noon on 2026-12-21 (the sun about 29 degrees up) and on 2026-06-21 (about 76 degrees up) are replayed
- **THEN** the December glow sits lower in the sky than the June glow, both above the roofline

### Requirement: Sun's halo
The sun glow SHALL have a bright, cool white center in a faint, close halo, so it reads as the sun rather than a patch of light, inside a wide, faint haze that brightens the sky and the clouds around the sun across about a third of the scene's width.

#### Scenario: Clear afternoon sun
- **WHEN** the page is open at 2 PM with no cloud
- **THEN** the sun shows as a bright center in a faint, close halo, with a faint haze lighting the sky well beyond it

#### Scenario: Clouds near the sun
- **WHEN** the page is open at 2 PM with 40% high cloud and 35% mid cloud
- **THEN** the clouds near the sun are lit by its haze, brighter than the same clouds far from it

### Requirement: Sky above the house
The scene SHALL show sky above the house's roof, about 16% of the scene's width tall, on phones and desktops alike. Below the eaves the sky SHALL fade into a dark ground by the middle of the house, so the sky, clouds and sun glow show only above and behind the roofline and the house stands on the ground.

#### Scenario: Phone
- **WHEN** the live page is viewed on a 375 pixel wide screen
- **THEN** there is sky above the roof, and the ground around the house's walls and in the courtyard is dark, with no cloud on it

### Requirement: Overcast light on the house
The sun's light and shade on the house SHALL weaken in proportion to the cloud cover, to none when fully overcast. By day the house SHALL also look slightly darker and grayer under full cloud, as under an overcast sky.

#### Scenario: Overcast noon
- **WHEN** the page is open at noon with full cloud cover
- **THEN** no face of the house is lit or darkened by the sun, and the house is slightly darker and grayer than on a clear day

#### Scenario: Partly cloudy noon
- **WHEN** the page is open at noon with 30% cloud cover
- **THEN** the south faces are lit at about 70% of a clear noon's light

### Requirement: Weather in replay
In replay the scene SHALL show the stored weather for the replayed time, returned with the day's replay data and changing smoothly between readings as the replay plays. Days before readings were stored SHALL have the service's hourly history, loaded by a backfill from the first day of service; a stored live reading SHALL NOT be replaced by history. A replayed time with no readings that day SHALL show a clear sky.

#### Scenario: Replaying a cloudy afternoon
- **WHEN** a day is replayed at 3 PM, an hour the service recorded as overcast
- **THEN** the scene shows an overcast sky, whatever the weather is now

#### Scenario: Playing through the day
- **WHEN** a replay plays at 60 minutes per second through a morning that cleared
- **THEN** the clouds thin gradually, with no jump at each reading

#### Scenario: The first day of service
- **WHEN** 2021-10-10 is replayed after the backfill
- **THEN** the scene shows that day's weather by the hour

#### Scenario: No readings
- **WHEN** a day with no stored readings is replayed
- **THEN** the scene shows a clear sky

### Requirement: Stars
At night the sky SHALL show the real stars brighter than about magnitude 4.5, each where it is in the sky at the site and the shown time, on one scale with the moon and the planets: compass 60 degrees at the scene's right, due south in the middle and 300 degrees at its left, and height in degrees from the horizon at the ground to overhead at the scene's top. They SHALL turn with the shown time, live and in replay. Brighter stars SHALL show larger and brighter, faintly tinted by their color. There SHALL be no constellation lines. Cloud SHALL hide them as the overcast sky covers the clear one.

#### Scenario: Clear night
- **WHEN** the page is open at 10 PM with no cloud
- **THEN** stars show across the sky above the house

#### Scenario: An October evening
- **WHEN** the page is open at 10 PM on 2026-10-24 with no cloud
- **THEN** Fomalhaut shows low near the middle, Altair left of center, Vega higher near the left edge, and Aldebaran rising low on the right

#### Scenario: The sky turns
- **WHEN** 2026-10-24 is replayed from 10 PM to 4 AM
- **THEN** the stars move steadily from right to left; Vega and Altair set behind the ground on the left, and Orion rises on the right and stands near the middle by 4 AM

#### Scenario: Mirrored like the moon
- **WHEN** the page is open at 4 AM on 2026-10-25 with no cloud
- **THEN** Sirius shows to the right of and below Betelgeuse, mirrored from how they look facing south, as the moon's face is

#### Scenario: Northern sky not shown
- **WHEN** the page is open on any clear night
- **THEN** Polaris does not show

#### Scenario: Same time, same sky
- **WHEN** the same moment is shown twice, live or in replay
- **THEN** every star is in the same place both times

#### Scenario: Day
- **WHEN** the page is open at noon
- **THEN** no stars show

#### Scenario: Overcast night
- **WHEN** the page is open at 10 PM with full cloud cover
- **THEN** no stars show

#### Scenario: Partly cloudy night
- **WHEN** the page is open at 10 PM with 30% cloud cover
- **THEN** stars show dimmer than on a clear night, between the clouds

### Requirement: Stars come out through twilight
Stars SHALL appear as the sky darkens, brightest first, and fade the same way before sunrise: with the sun on the horizon only the brightest points show, the brightest stars by the sun 6 degrees down, and all of them by 18 degrees down, each fading in rather than appearing at once. A bright moon high in the sky SHALL hide the faintest stars, and stars SHALL show dimmer close to the horizon.

#### Scenario: Just after sunset
- **WHEN** the page is open 10 minutes after sunset on a clear night
- **THEN** only a few of the brightest stars and planets show

#### Scenario: Full dark
- **WHEN** the page is open with the sun 18 degrees or more below the horizon, no moon up and no cloud
- **THEN** stars down to about magnitude 4.5 show

#### Scenario: Under a full moon
- **WHEN** the page is open with a full moon high in the sky and no cloud
- **THEN** fewer stars show than on a moonless night at the same hour, the brightest still showing

#### Scenario: Near the horizon
- **WHEN** a bright star is just above the horizon
- **THEN** it shows dimmer than when it is high

### Requirement: Twinkling
Each star SHALL twinkle, its brightness flickering a little several times a second, each star independently of the others: barely high in the sky and clearly near the horizon. Planets SHALL shine steadily. Twinkling SHALL go at its natural pace whatever the replay speed, SHALL hold still while a replay is paused, and SHALL NOT happen for a viewer who prefers reduced motion. It SHALL NOT move any star or change which stars show.

#### Scenario: Low and high stars
- **WHEN** the page is open on a clear night with one bright star 10 degrees up and another 70 degrees up
- **THEN** both flicker, the low one clearly more than the high one

#### Scenario: Planets steady
- **WHEN** Jupiter is up on a clear night
- **THEN** it does not flicker while the stars around it do

#### Scenario: Fast replay
- **WHEN** a night is replayed at 60 minutes a second
- **THEN** the stars twinkle at the same pace as live while they wheel across the sky

#### Scenario: Paused replay
- **WHEN** a replay is paused at night
- **THEN** every star holds a steady brightness

#### Scenario: Reduced motion
- **WHEN** a viewer who prefers reduced motion opens the page on a clear night
- **THEN** the stars show at steady brightness

### Requirement: Planets
The sky SHALL show Venus, Mars, Jupiter and Saturn where they are in the sky at the site and the shown time, on the scale the stars use, live and in replay. Each SHALL show as bright as its real magnitude at that time, Mars faintly orange and Saturn pale gold, and come out through twilight and hide under cloud as the stars do.

#### Scenario: Evening Venus
- **WHEN** Venus is an evening star and the page is open soon after sunset with no cloud
- **THEN** it shows low on the left, the brightest point in the sky

#### Scenario: Mars at opposition
- **WHEN** a night when Mars is near opposition is replayed
- **THEN** Mars shows brighter and larger than on a night months later, when it is far from Earth

#### Scenario: Planet below the horizon
- **WHEN** Jupiter is below the horizon at the site
- **THEN** it does not show

#### Scenario: Overcast
- **WHEN** a planet is up at night under full cloud cover
- **THEN** it does not show

### Requirement: Moon in the sky
The sky SHALL show the moon while it is above the horizon at the site, day or night, placed on the scale the stars use: rising on the scene's right (the house's east side), setting on the left, at its real height, so it shows among the stars and planets it is near in the sky, and sinking behind the ground near the horizon. While it is below the horizon there SHALL be no moon. It SHALL move with the shown time, live and in replay.

#### Scenario: Moon up in the evening
- **WHEN** the page is open at 9 PM on 2026-10-24, with the moon 42 degrees up in the east-southeast
- **THEN** the moon shows in the sky, right of center

#### Scenario: Moon not yet risen
- **WHEN** the page is open at a time the moon is below the horizon
- **THEN** no moon shows, though the stars do on a clear night

#### Scenario: New moon
- **WHEN** a night near new moon is replayed
- **THEN** no moon shows at night

#### Scenario: Among the stars
- **WHEN** the moon passes close to a bright star or planet in the sky
- **THEN** the scene shows it beside that star or planet, on the same side as in the sky's mirrored view

#### Scenario: Winter and summer full moons
- **WHEN** a full moon in late December and one in late June are replayed at their highest
- **THEN** the December moon shows high, near the top of the scene, and the June moon low, close to the roofline

### Requirement: Moon phase
The moon SHALL show its phase on the shown date, from a thin crescent to full, lit on the side the sunlight comes from in the real sky at the site: its lit side SHALL point at the real angle from straight up that it has in the sky at the shown time, mirrored as the scene's sky is, rather than only left or right.

#### Scenario: Waxing crescent
- **WHEN** the page shows 5:30 PM on 2026-11-12, a few days past new, the moon low in the southwest
- **THEN** a thin crescent shows, lit on its lower left, toward where the sun set on the scene's left

#### Scenario: Full moon
- **WHEN** the moon is full
- **THEN** the whole disc is lit

#### Scenario: Waning gibbous
- **WHEN** the moon is a few days past full
- **THEN** most of the disc is lit, its dark part on the side away from the sun's place in the sky

#### Scenario: Half moon rising after midnight
- **WHEN** the page shows 1 AM PDT on 2026-11-01, a waning half moon rising in the east
- **THEN** about half the disc is lit, the lit half underneath, its edge tipped a little toward the right, not lit on its right side as an upright half moon would be

### Requirement: Moon's face
The moon's lit part SHALL show its real face from a map of the whole moon, its seas and craters in their real places, mirrored as the scene's sky is. It SHALL show the side facing Earth at the shown time, as the moon rocks a few degrees each month, and SHALL be turned as it is in the sky at the site at that time. The edge between its lit and unlit parts SHALL fade softly. At night its unlit part SHALL show the surface faintly, as earthshine does; by day it SHALL not show.

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
- **WHEN** the full moons at 1 AM on 2027-05-20 and at 5 AM on 2027-10-15 are replayed
- **THEN** Mare Crisium sits farther in from the edge in May than in October, and the moon's north polar region shows more in May, its south polar region more in October

#### Scenario: Turning across the sky
- **WHEN** the full moon is replayed rising at 6 PM on 2026-11-24 and setting at 7 AM on 2026-11-25
- **THEN** its north pole is tipped about 44 degrees from straight up toward the scene's right as it rises, and about 62 degrees toward the scene's left as it sets

### Requirement: Moon by day and under cloud
At night the moon SHALL be bright, with a faint glow around it, much weaker than the sun's, and its dark side faintly showing. By day it SHALL show without the glow or the dark side, outshone by the sun: as bright as at night with the sun on the horizon, and fainter as the sun climbs, to a pale disc once the sun is 25 degrees up. The glow and the dark side SHALL fade in and out through twilight as the rest of the scene turns between day and night, with no jump at sunset or sunrise. Cloud SHALL dim it in proportion to the cover, leaving a faint glow when overcast, as it does the sun.

#### Scenario: Afternoon moon
- **WHEN** the page is open at 4 PM on 2026-10-17 with the sun about 21 degrees up, the moon up and no cloud
- **THEN** a pale moon shows in the blue sky, much fainter than the sun glow

#### Scenario: Moon at dusk
- **WHEN** the same moon is shown at 6 PM, with the sun about 5 degrees up
- **THEN** it is brighter than at 4 PM, nearly as bright as at night

#### Scenario: Moon through sunset
- **WHEN** the page stays open through sunset with the moon up and no cloud
- **THEN** the moon's glow and dark side grow from nothing to their night strength, with no jump at sunset

#### Scenario: Overcast night
- **WHEN** the page is open at night with the moon up and full cloud cover
- **THEN** only a faint glow shows where the moon is

### Requirement: Twilight
Around sunset and sunrise the sky SHALL show a warm glow low over the roofline across the whole scene, orange near the horizon and fading to pink above, strongest on the side where the sun is and fainter toward the far side, about a third as strong there. It SHALL grow from nothing with the sun 6 degrees above the horizon to its strongest at sunset or sunrise, and fade to nothing by 6 degrees below. Cloud SHALL hide it as the overcast sky covers it. The glow SHALL NOT itself light or darken the house, which turns between day and night as the live-flow-scene capability sets.

#### Scenario: Sunset
- **WHEN** the page is open at sunset with no cloud
- **THEN** a warm glow shows low across the sky, strongest on the left and still visible on the right

#### Scenario: Dusk
- **WHEN** the page is open 15 minutes after sunset with no cloud
- **THEN** the warm glow still shows, fainter, and the house is mostly darkened with its windows mostly lit

#### Scenario: Sunrise
- **WHEN** the page is open at sunrise with no cloud
- **THEN** the warm glow is strongest on the right

#### Scenario: Overcast sunset
- **WHEN** the page is open at sunset with full cloud cover
- **THEN** no warm glow shows

#### Scenario: Midday and midnight
- **WHEN** the page is open at noon or at midnight
- **THEN** no warm glow shows

### Requirement: Rain reading
The server SHALL send how hard it is raining at the site, from 0 (dry) to 1 (heaviest), with the cloud cover: in the live data from its latest reading, and with each of a day's replay readings. It SHALL come from the reading's weather code: drizzle light, rain and showers from light to heavy, freezing rain and snow as rain of the same strength, thunderstorms heaviest, anything else dry. Without a recent reading it SHALL send none, as for the cover.

#### Scenario: Moderate rain
- **WHEN** the latest reading is moderate rain (weather code 63)
- **THEN** the live data carries a rain strength of about 0.7 and full cloud cover

#### Scenario: Dry overcast
- **WHEN** the latest reading is overcast without rain (code 3)
- **THEN** the live data carries a rain strength of 0

#### Scenario: Rain in history
- **WHEN** a day that had heavy showers in its hourly history is replayed
- **THEN** the replay readings for those hours carry a rain strength of 1

### Requirement: Rain
While it rains the scene SHALL show rain falling over the house and the ground, denser and more visible the harder it rains, even drizzle clearly visible though light, and behind the labels so they stay readable. It SHALL fade in and out at the weather's pace as the rain starts and stops, over about 5 minutes while live, show dimmer at night, and follow the replayed time in replay, changing smoothly between readings. When it is dry there SHALL be none.

#### Scenario: Light drizzle
- **WHEN** the rain strength is 0.2
- **THEN** sparse, light rain falls over the scene, clearly visible

#### Scenario: Heavy rain at night
- **WHEN** the rain strength is 1 at 10 PM
- **THEN** dense rain falls over the scene, dimmer than by day, and every label stays readable

#### Scenario: Rain stops
- **WHEN** the rain strength falls to 0 while the page is open
- **THEN** the rain fades out over about 5 minutes and the clouds remain

### Requirement: Rain leans with the wind
The rain SHALL lean with the wind across the scene: straight down when calm, slanting the way the wind blows, more the stronger it is, up to 30 degrees, easing to each new slant at the weather's pace, over about 5 minutes while live.

#### Scenario: Rain in the wind
- **WHEN** it rains with 10 km/h of wind blowing toward the scene's left
- **THEN** the rain slants down and to the left

#### Scenario: Calm rain
- **WHEN** it rains with no wind across the scene
- **THEN** the rain falls straight down

### Requirement: Wind reading
The server SHALL store each reading's wind speed and the direction it blows from at 10 m, and at the heights of the low, mid and high cloud (the 850, 700 and 300 hPa levels), and send with the cover and rain the part of each blowing across the scene, in km/h, positive toward the scene's right (the house's east side) and negative toward its left: in the live data and with each of a day's replay readings, none without a recent reading. A level the service did not report SHALL be sent as none. Readings stored before wind was kept SHALL get their wind from the service's history, without any other part of a reading being replaced.

#### Scenario: Wind from the northeast
- **WHEN** the latest reading has wind of 12.5 km/h from 56 degrees
- **THEN** the live data carries about 10 km/h blowing toward the scene's left

#### Scenario: Wind from the west
- **WHEN** the latest reading has wind of 20 km/h from 270 degrees
- **THEN** the live data carries 20 km/h blowing toward the scene's right

#### Scenario: Wind from the north
- **WHEN** the latest reading has wind from 0 degrees
- **THEN** the live data carries about 0 km/h across the scene

#### Scenario: Winds aloft
- **WHEN** the latest reading has 21.5 km/h from 291 degrees at the low cloud's height, 40.1 km/h from 276 at the mid's and 73.9 km/h from 268 at the high's
- **THEN** the live data carries about 20, 40 and 74 km/h toward the scene's right for the low, mid and high cloud

#### Scenario: Old readings
- **WHEN** the history backfill runs over days stored before wind was kept
- **THEN** those readings gain their wind, and their weather code, cloud cover and any live reading's values stay as they were

### Requirement: Clouds drift with the wind
Each band of cloud SHALL drift across the sky the way the wind at its height blows across the scene: the low cloud and the darker overcast cloud by the low cloud's wind, the mid cloud by the mid's, and the high cloud by the high's, each the faster the stronger its wind and the slower the higher it is (the wind divided by a height of about 1.5 km for low, 3 km for mid and 9.4 km for high cloud), so the bands can drift at different speeds and in different directions. Low cloud SHALL cross the scene in about 18 minutes with 20 km/h of wind across it at its height, mid cloud in about 18 minutes with 40 km/h, and high cloud in about 30 minutes with 74 km/h; these paces SHALL be revised together once tuned by eye. In calm air low and mid cloud SHALL keep creeping the way their wind blows, crossing in no more than about an hour, toward the scene's right without a wind; high cloud MAY stand still. A change in a wind SHALL change its band's drift without the clouds jumping. Their drift SHALL NOT slow the scene's other motion on a desktop: with clouds drifting, the scene SHALL keep up with the display's frame rate. In replay they SHALL follow the replayed time's winds. They SHALL show no seam.

#### Scenario: A northeast wind
- **WHEN** the low cloud's wind blows 10 km/h toward the scene's left
- **THEN** the low clouds move right to left, crossing the scene in about 36 minutes

#### Scenario: A light breeze
- **WHEN** the low cloud's wind blows 7 km/h toward the scene's right
- **THEN** the low clouds cross the scene in about 51 minutes

#### Scenario: A westerly day
- **WHEN** the low, mid and high winds blow 20, 40 and 74 km/h toward the scene's right
- **THEN** all three bands move left to right, the low and mid clouds at about the same pace and the high cloud at about 60% of it

#### Scenario: Shear
- **WHEN** the low cloud's wind blows 7 km/h toward the scene's left and the high cloud's 9 km/h toward its right
- **THEN** the low clouds creep right to left under high cloud that barely moves to the right

#### Scenario: The wind turns
- **WHEN** the low cloud's wind turns from blowing left to blowing right while the page is open
- **THEN** the low clouds slow, stop and move the other way, without a jump, while the other bands keep their drift

#### Scenario: Calm
- **WHEN** there is no wind across the scene at any height
- **THEN** the low and mid clouds still creep slowly to the right, and the high cloud stands still

#### Scenario: No upper winds
- **WHEN** the replayed time's readings carry no winds at the clouds' heights
- **THEN** the low and mid clouds creep slowly to the right and the high cloud stands still, as in calm air

#### Scenario: No seam as they drift
- **WHEN** the bands have drifted different distances, each part of a pixel past a whole position, on a scene of any width, on a 2x or 3x screen
- **THEN** no column of the sky stands out from its neighbors more than the clouds' own shading does

#### Scenario: Smooth on a desktop
- **WHEN** the page is open in Brave on the user's desktop with 40% low, 45% mid and 50% high cloud and the bands drifting at different speeds
- **THEN** the scene draws at the display's frame rate, about 16.7 ms a frame on a 60 Hz display

### Requirement: A new cloud pattern each day
The clouds SHALL take a different shape each day at the site, the same for every viewer on that day; a replay SHALL show the replayed day's shapes. The amount of cloud SHALL still follow the cloud cover.

#### Scenario: Two days
- **WHEN** the page is opened on two different days with the same cloud cover
- **THEN** the clouds have different shapes

#### Scenario: Replay
- **WHEN** a day is replayed twice
- **THEN** its clouds have the same shapes both times

### Requirement: Weather under reduced motion
For a viewer who prefers reduced motion, the clouds SHALL stand still and the rain SHALL show as still streaks, as dense and slanted as moving rain would be.

#### Scenario: Rain with reduced motion
- **WHEN** a viewer who prefers reduced motion opens the page while it rains
- **THEN** still rain streaks show over the scene and nothing in the sky moves

### Requirement: Labels readable over any sky
The scene's labels SHALL stay readable wherever the day's clouds fall, including over the brightest part of a cloud, with a dark halo strong enough that the labels' gray titles show over it.

#### Scenario: A bright cloud behind SOLAR
- **WHEN** a day's clouds put a bright cloud behind the SOLAR label on a phone
- **THEN** both the label's title and its value are readable

#### Scenario: Half covered on a desktop
- **WHEN** the page is open at noon on a desktop with a cover of 0.5 and a cloud behind SOLAR
- **THEN** the SOLAR title and its value are both readable

### Requirement: Weather override for development
The development server SHALL accept a cloud cover, low, mid and high cloud shares, the roof's sunshine, rain strength, and the wind across the scene at 10 m and at each cloud band's height in the page's address, which replace the live weather, so the weather's looks can be checked on any device on any day. It SHALL also accept a pace factor that multiplies every band's drift, so the pace can be tuned by eye. A production build SHALL ignore them.

#### Scenario: Checking rain on a phone
- **WHEN** the development server's live page is opened on a phone with a cover of 1 and a rain strength of 0.7 in its address
- **THEN** the scene shows an overcast sky with rain, whatever the weather at the site

#### Scenario: Checking cirrus
- **WHEN** the development server's live page is opened with a cover of 0.2, a high cloud share of 0.8 and low and mid cloud shares of 0 in its address
- **THEN** the scene shows thin streaks across the top of the sky and no puffs

#### Scenario: Checking the bands
- **WHEN** the development server's live page is opened with low, mid and high cloud shares of 0.4 in its address
- **THEN** each band of the sky is densest in its own layer

#### Scenario: Checking the roof's correction
- **WHEN** the development server's live page is opened at noon with a cover and low cloud share of 0.62 and a sunshine of 1 in its address
- **THEN** the scene shows scattered clouds over a blue sky

#### Scenario: Checking shear
- **WHEN** the development server's live page is opened with low, mid and high cloud shares of 0.4, a low cloud wind of -10 and a high cloud wind of 60 in its address
- **THEN** the low clouds drift left while the high cloud drifts slowly right

#### Scenario: Tuning the pace
- **WHEN** the development server's live page is opened with a pace factor of 2 in its address
- **THEN** every band drifts twice as fast as it would for the same winds without it

#### Scenario: Production
- **WHEN** the deployed site is opened with the same address parameters
- **THEN** the scene shows the site's real weather and drifts at the fixed pace

### Requirement: Clouds lit by the low sun
Around sunset and sunrise the clouds SHALL be lit by the low sun from below, from the sun 6 degrees above the horizon to 6 below: gold while it is a few degrees up, orange as it reaches the horizon, then pink and magenta below it, strongest on the sun's side of the scene and fading away from it, keeping their shapes and drift. After sunset each layer SHALL lose the light by its height, the low clouds first, then the mid clouds, the high cloud last, leaving dark gray clouds under lit cirrus. Under an overcast deck or a storm the color SHALL stay near the horizon on the sun's side, and the deck SHALL stay gray. Away from twilight the clouds SHALL show no warm color.

#### Scenario: Partly cloudy sunset
- **WHEN** the page is open at sunset with 30% low, 30% mid and 40% high cloud
- **THEN** the undersides of the clouds on the left are lit orange, the clouds on the right much less, and the warm glow shows between them

#### Scenario: Before sunset
- **WHEN** the page is open with the sun 3 degrees up and 30% low cloud
- **THEN** the clouds' sides toward the sun are lit gold

#### Scenario: Dusk
- **WHEN** the page is open with the sun 4 degrees below the horizon, with 30% low and 40% high cloud
- **THEN** the low clouds are dark gray and the high streaks on the sun's side are lit pink

#### Scenario: Overcast sunset
- **WHEN** the page is open at sunset with 90% low and 75% mid cloud
- **THEN** the deck is gray, at most faintly warm near the horizon on the left, and no part of the sky turns brown

#### Scenario: Sunrise
- **WHEN** the page is open at sunrise with 50% low cloud
- **THEN** the clouds on the right are lit warm from below

#### Scenario: Midday
- **WHEN** the page is open at noon with 50% low cloud
- **THEN** the clouds show no warm color

#### Scenario: Replay
- **WHEN** a cloudy evening is replayed through sunset
- **THEN** the clouds warm and dim as the replayed sun sets

### Requirement: Setting and rising behind the ground
The sun glow and the moon SHALL sink fully behind the ground as they set and rise out from behind it, fading out over their last 2 degrees above the horizon and in over their first, so neither appears or vanishes in a jump, live or in replay. Their real rise and set times, positions and phases SHALL be unchanged.

#### Scenario: Moonset in replay
- **WHEN** 2026-10-17 is replayed through 11:34 PM, when the moon sets
- **THEN** the moon sinks behind the ground and fades away, with no jump

#### Scenario: Sunset
- **WHEN** a clear day is replayed through sunset
- **THEN** the sun glow sinks behind the ground and fades away, with no jump

#### Scenario: Fast replay
- **WHEN** a replay plays at 60 minutes a second through moonset
- **THEN** the moon fades out over about 1.5 seconds rather than vanishing, a moment behind the replayed time

#### Scenario: Moonrise
- **WHEN** the page is open as the moon rises
- **THEN** it fades in from behind the ground on the right

#### Scenario: High in the sky
- **WHEN** the moon or the sun is more than 2 degrees up
- **THEN** it shows at its usual strength

### Requirement: Low moon
Near the horizon the moon SHALL be dimmer and warmer, yellow-orange, as its light crosses more air, growing to its usual color and brightness by 10 degrees up.

#### Scenario: Rising moon
- **WHEN** the moon has just risen on a clear night
- **THEN** it shows dim and yellow-orange low on the right

#### Scenario: High moon
- **WHEN** the moon is 40 degrees up
- **THEN** it shows its usual gray color and brightness

### Requirement: Cloud cover by height
The server SHALL store each reading's low, mid and high cloud cover, as the service reports them. The cover it sends, live and with each replay reading, SHALL weigh them by how much light each blocks: low cloud in full, mid cloud at 0.6 and high cloud at a quarter, summed and capped at fully overcast. A reading without the split SHALL send its total cover. Rain, drizzle, snow and thunderstorms SHALL still send fully overcast, and so SHALL fog without airport cloud.

#### Scenario: Thin high cloud
- **WHEN** the latest reading is partly cloudy with 55% cover, all of it high
- **THEN** the live data carries a cover of about 0.14

#### Scenario: Low marine layer
- **WHEN** the latest reading has 90% low cloud and no mid or high cloud
- **THEN** the live data carries a cover of 0.9

#### Scenario: Every layer
- **WHEN** the latest reading has 60% low, 50% mid and 80% high cloud
- **THEN** the live data carries a cover of 1

#### Scenario: Fog under a clear sky above
- **WHEN** the latest reading is fog with 40% low cloud, nothing above it and no airport cloud
- **THEN** the live data carries a cover of 1

#### Scenario: Reading stored without the split
- **WHEN** a replayed reading has 70% total cover and no low, mid or high cover
- **THEN** its replay cover is 0.7

### Requirement: The scene follows the weighted cover
Everything in the scene that follows the cloud cover, other than the clouds and the gray sky (the sun glow and its halo, the moon, stars and planets, and the sun's light and shade on the house), SHALL follow the weighted cover, live and in replay. The clouds, including their light, and the gray sky SHALL follow the low, mid and high cloud shares.

#### Scenario: Cirrus at noon
- **WHEN** the page is open at noon and the latest reading is 55% cover, all of it high
- **THEN** the sky is blue with faint clouds, the sun glow is nearly as bright as on a clear noon, and the south faces are lit at about 86% of a clear noon's light

#### Scenario: Marine layer at noon
- **WHEN** the page is open at noon and the latest reading is 100% low cloud
- **THEN** the sky is gray and no face of the house is lit or darkened by the sun, as for any fully overcast noon

### Requirement: High cloud share
With the cover, the server SHALL send the share of the sky under high cloud, 0 to 1, in the live data and with each replay reading: none for a reading without the split, and none when the weather code makes the sky fully overcast.

#### Scenario: Thin high cloud
- **WHEN** the latest reading is partly cloudy with 55% cover, all of it high
- **THEN** the live data carries a high cloud share of 0.55

#### Scenario: Fog under cirrus
- **WHEN** the latest reading is fog with 40% low cloud and 30% high cloud
- **THEN** the live data carries no high cloud

#### Scenario: Reading stored without the split
- **WHEN** a replayed reading has 70% total cover and no low, mid or high cover
- **THEN** it carries no high cloud

### Requirement: High cloud
High cloud SHALL show as its own layer of thin, translucent, wind-stretched wisps in broken patches, densest in the top band of the sky, covering about as much of it as the high cloud share, with the sky's blue showing through them; it SHALL NOT show as scattered puffs. The wisps SHALL drift with the other clouds, take on the low sun's color at twilight and dim at night as they do, and grow or shrink gradually as the share changes, live and in replay.

#### Scenario: Cirrus at noon
- **WHEN** the page is open at noon with 80% high cloud and no low or mid cloud
- **THEN** pale streaks cross the top of the sky, fewer toward the roofline, with blue between and through them, and no scattered puffs show

#### Scenario: Cirrus over cumulus
- **WHEN** the page is open at noon with 30% low cloud and 60% high cloud
- **THEN** scattered clouds cover about a third of the bottom band, under thin streaks across more than half of the top band

#### Scenario: Cirrus at sunset
- **WHEN** the page is open at sunset with 60% high cloud
- **THEN** the streaks on the sun's side are lit orange and pink

#### Scenario: No split
- **WHEN** a replayed reading has 70% total cover and no low, mid or high cover
- **THEN** its clouds show as low cloud for a share of 0.7, with no streaks

#### Scenario: Drifting
- **WHEN** the wind blows 10 km/h toward the scene's left
- **THEN** the streaks move right to left with the scattered clouds, without a seam

### Requirement: Clouds by height in the sky
The sky above the eaves SHALL be drawn as three bands, top to bottom: high cloud in the top 30% of its height, mid cloud in the next 30% and low cloud in the bottom 40%. Below its amount for spreading, a layer SHALL cover about as much of its band as its share of the sky, and thin with distance from its band to fewer and smaller clouds, never ending in a visible edge.

#### Scenario: Thin high cloud
- **WHEN** the page is open at noon with 55% high cloud and no low or mid cloud
- **THEN** thin streaks cross the top of the sky, fewer and smaller lower down, and the sky above the roofline is mostly clear blue

#### Scenario: Low cloud along the roofline
- **WHEN** the page is open at noon with 40% low cloud and no mid or high cloud
- **THEN** clouds cover about 40% of the bottom band, with fewer and smaller clouds higher up and blue between them

#### Scenario: Every layer, partly
- **WHEN** the page is open at noon with 30% low, 30% mid and 30% high cloud
- **THEN** each band shows its own layer, covering about a third of it, with blue between the clouds

#### Scenario: No stripes
- **WHEN** the page is open on a desktop with 40% mid cloud and no low or high cloud
- **THEN** no horizontal edge shows above or below the mid clouds, and no band of the sky is an empty stripe between clouds

### Requirement: Clouds spread as they near full
A layer SHALL keep to its band up to 60% of its share and grow over the rest of the sky from there, covering all of it by 90%, so a nearly overcast layer covers the whole sky at any height. The change SHALL be gradual, with no step at either amount.

#### Scenario: Marine layer
- **WHEN** the page is open at noon with 95% low cloud and no mid or high cloud
- **THEN** cloud covers the whole sky above the roofline, top band included

#### Scenario: Low cloud building
- **WHEN** the low cloud rises from 50% to 90% while the page is open
- **THEN** the low clouds fill their band, then climb gradually until they cover the whole sky

#### Scenario: Thick high cloud
- **WHEN** the page is open at noon with 95% high cloud and no low or mid cloud
- **THEN** thin streaks cover the whole sky, with the blue showing through them

### Requirement: Mid cloud
Mid cloud SHALL show as its own layer of puffs smaller and lighter than the low cloud's, so the two layers read as clouds at different heights. Mid clouds SHALL drift with the other clouds, take on the low sun's color at twilight, dim at night and grow or shrink gradually as their share changes, live and in replay.

#### Scenario: Mid cloud alone
- **WHEN** the page is open at noon with 40% mid cloud and no low or high cloud
- **THEN** small, light clouds cover about 40% of the middle band, thinning to fewer and smaller clouds above and below it

#### Scenario: Mid over low
- **WHEN** the page is open at noon with 30% low and 30% mid cloud
- **THEN** the middle band's clouds are smaller and lighter than the bottom band's

#### Scenario: Mid cloud at sunset
- **WHEN** the page is open at sunset with 40% mid cloud
- **THEN** the mid clouds on the sun's side are lit orange

### Requirement: Low and mid cloud shares
With the cover, the server SHALL send the share of the sky under low cloud and under mid cloud, each 0 to 1, in the live data and with each replay reading: none for a reading without the split, and none when the weather code makes the sky fully overcast.

#### Scenario: Marine layer under cirrus
- **WHEN** the latest reading has 90% low, no mid and 30% high cloud
- **THEN** the live data carries a low cloud share of 0.9, a mid cloud share of 0 and a high cloud share of 0.3

#### Scenario: Rain
- **WHEN** the latest reading is rain with 60% low and 40% mid cloud
- **THEN** the live data carries no low or mid cloud and a cover of 1

#### Scenario: Reading stored without the split
- **WHEN** a replayed reading has 70% total cover and no low, mid or high cover
- **THEN** it carries no low or mid cloud

### Requirement: A reading without the split
When the scene has the cover but no low or mid cloud share, as for a reading without the split or one fully overcast by its weather code, it SHALL draw the cover as low cloud, with no mid or high cloud, live and in replay; in replay such a reading SHALL blend with the readings around it as that low cloud, so the sky changes smoothly between them.

#### Scenario: Old reading
- **WHEN** a replayed reading has 70% total cover and no low, mid or high cover
- **THEN** the scene draws 70% low cloud: the bottom band nearly covered and the clouds starting to climb, with no streaks

#### Scenario: Fog
- **WHEN** the latest reading is fog
- **THEN** low cloud covers the whole sky and the sky is fully gray

#### Scenario: A rainy morning in replay
- **WHEN** a replay plays through a morning whose readings every 15 minutes are rain with full cover and no split
- **THEN** low cloud covers the whole sky as a deck, the sky is gray, and the rain falls from it, between readings as well as at them

#### Scenario: Into the rain in replay
- **WHEN** a replay plays from a reading of 60% low cloud with the split into a rainy reading with full cover and no split
- **THEN** the low cloud grows steadily to cover the whole sky, without the sky clearing between them

### Requirement: Sunshine on the roof
With the cover, the server SHALL send how sunny it is at the house, 0 to 1: the roof's solar output over 15 minutes over its best 15-minute output at the same time of day in the 14 days before, capped at 1. Time of day SHALL follow the sun, not the clock, so daylight saving doesn't shift it. Live, it SHALL use the last 15 minutes of live output; in replay, the reading's own 15 minutes. It SHALL be none when that best output is under 1 kW or the output isn't known.

#### Scenario: Clear noon
- **WHEN** the roof makes 6.4 kW at noon and its best noon output in the last 14 days is 6.5 kW
- **THEN** the live data carries a sunshine of about 0.98

#### Scenario: Under the marine layer
- **WHEN** the roof makes 0.5 kW at 9 AM and its best 9 AM output in the last 14 days is 3.6 kW
- **THEN** the live data carries a sunshine of about 0.14

#### Scenario: Brighter than the last two weeks
- **WHEN** the roof makes more than its best output at that time in the last 14 days
- **THEN** the sunshine is 1

#### Scenario: Night and twilight
- **WHEN** the best output at that time of day in the last 14 days is under 1 kW, as at night, dawn and dusk
- **THEN** the live data carries no sunshine

#### Scenario: Across the change from daylight saving
- **WHEN** the clocks go back an hour and the roof's output is compared with the days before
- **THEN** each time is compared with the same height of the sun on those days, not the same clock time

#### Scenario: Replay
- **WHEN** a replayed reading's 15 minutes of output are stored
- **THEN** it carries the sunshine of those 15 minutes, compared with the 14 days before its own day

#### Scenario: Output not yet published
- **WHEN** a replayed reading is so recent that its output isn't stored yet
- **THEN** it carries no sunshine

### Requirement: The roof corrects the clouds by day
When there is sunshine, the scene SHALL cap the cover and the low and mid cloud shares it draws from: at 0.3 with sunshine of 0.8 or more, rising evenly to no cap at 0.4 or less. Everything that follows them SHALL follow the capped values, live and in replay. The roof SHALL never add cloud, and the high cloud share SHALL be left as the service sends it. Without sunshine the scene SHALL draw the service's cloud as before.

#### Scenario: Marine layer burned off
- **WHEN** the page is open at noon, the service reports 62% low cloud, and the sunshine is 1
- **THEN** the sky is blue, not grayed, with scattered clouds over about 30% of the bottom band, and the house is lit as for 30% cover

#### Scenario: The roof agrees it's overcast
- **WHEN** the service reports 100% low cloud and the sunshine is 0.2
- **THEN** the scene shows the overcast sky, as without the roof

#### Scenario: Hazy sun
- **WHEN** the service reports 90% low cloud and the sunshine is 0.6
- **THEN** the scene draws 65% low cloud

#### Scenario: Never more cloud
- **WHEN** the service reports 10% low cloud and the sunshine is 0.2
- **THEN** the scene draws 10% low cloud

#### Scenario: Cirrus in full sun
- **WHEN** the service reports 70% high cloud and no low or mid cloud, and the sunshine is 1
- **THEN** the high cloud streaks show as for 70% high cloud

#### Scenario: Night
- **WHEN** the service reports 90% low cloud at 10 PM
- **THEN** the scene draws 90% low cloud, with no sunshine to correct it

#### Scenario: A reading without the split
- **WHEN** a replayed reading has 70% total cover, no low, mid or high cover, and a sunshine of 1
- **THEN** the scene draws 30% low cloud

### Requirement: Low cloud from the airport
For a reading with airport cloud and the service's split, the server SHALL send the airport's low cloud as the low cloud share, the greater of the airport's and the service's mid cloud as the mid cloud share, and the service's high cloud share, live and with each replay reading; the weighted cover SHALL weigh these layers. A reading without airport cloud SHALL send the service's layers as before.

#### Scenario: Marine layer burned off
- **WHEN** the service reports 100% low and no mid or high cloud, and the airport reports clear
- **THEN** the live data carries a low cloud share of 0 and a cover of 0

#### Scenario: Fog bank at night
- **WHEN** the service reports 10% low cloud at 10 PM and the airport reports overcast at 800 ft
- **THEN** the live data carries a low cloud share of 1 and a cover of 1

#### Scenario: Mid cloud the airport can't see
- **WHEN** the service reports 98% mid and 98% high cloud and the airport reports clear
- **THEN** the live data carries a low cloud share of 0, a mid share of 0.98 and a high share of 0.98

#### Scenario: Mid cloud the service misses
- **WHEN** the service reports no mid cloud and the airport reports broken at 7,500 ft
- **THEN** the live data carries a mid cloud share of 0.75

#### Scenario: Replay of a burn-off
- **WHEN** 2026-10-26 is replayed at 10:45 AM after the backfill
- **THEN** its low cloud share follows the airport's clear report, not the service's 100%

### Requirement: The airport decides fog
For a reading with airport cloud, a fog code from the service SHALL NOT make the sky fully overcast; the airport's report SHALL show the fog through its layers. Rain, drizzle, snow and thunderstorms SHALL still make it fully overcast.

#### Scenario: Fog the airport doesn't see
- **WHEN** the service reports fog and the airport reports few clouds at 3,000 ft
- **THEN** the live data carries a low cloud share of 0.19, not a fully overcast sky

#### Scenario: Fog the airport sees
- **WHEN** the service reports fog and the airport reports the sky obscured
- **THEN** the live data carries a low cloud share of 1 and a cover of 1

#### Scenario: Rain
- **WHEN** the service reports rain and the airport reports scattered cloud at 2,000 ft
- **THEN** the live data carries a cover of 1 and no low or mid cloud share

### Requirement: Clouds shaded by the sun
By day each cloud SHALL show its form lit by the sun: brighter on its side toward the sun's place in the scene, darker where more cloud lies between it and the sun, and its thick parts darker than its thin edges. The edges of clouds near the sun SHALL glow. The shading SHALL follow the sun as it crosses the sky.

#### Scenario: Afternoon
- **WHEN** the page is open at 2 PM with 30% low cloud and the sun on the left
- **THEN** each cloud is brighter on its left and upper side and grayer on its far side and underneath

#### Scenario: Morning
- **WHEN** the page is open at 9 AM with 30% low cloud
- **THEN** the clouds are lit from the right

#### Scenario: Near the sun
- **WHEN** a cloud passes close to the sun glow at 2 PM
- **THEN** its thin edges glow brighter than the edges of clouds far from the sun

### Requirement: Cloud looks follow the kind of weather
The clouds' look SHALL follow the kind of weather: fair-weather puffs, partly cloudy, a marine layer, overcast and a storm each have their own look, and weather between them SHALL blend the looks of the nearest kinds, by the low, mid and high cloud shares and the rain. A clear sky stands for no cloud and lends no look. A change of weather SHALL change the look gradually, live and in replay.

#### Scenario: Fair-weather puffs
- **WHEN** the page is open at noon with 13% low, 6% mid and 11% high cloud and no rain
- **THEN** separate puffs show with bright sunlit sides and gray bases

#### Scenario: Marine layer
- **WHEN** the page is open at noon with 100% low cloud, little mid cloud and no rain
- **THEN** the clouds form one smooth, soft, flat gray deck with little shading

#### Scenario: Storm
- **WHEN** the page is open at noon with 76% low, 26% mid and 78% high cloud and rain of 0.7
- **THEN** the clouds are dark and heavy, with dark thick parts, and the rain falls in front of them

#### Scenario: A marine layer burning off
- **WHEN** a replay plays through a morning whose low cloud falls from 100% to 30% with little mid cloud
- **THEN** the smooth deck breaks gradually into puffs, without a jump in the clouds' look

#### Scenario: A nearly clear day
- **WHEN** the page is open at noon with 5% low cloud and nothing else
- **THEN** the few clouds have the fair-weather puffs' look

### Requirement: Clouds by moonlight
At night, while the moon is up, the clouds SHALL be lit faintly by it, brighter on their side toward the moon, in a cool gray. With the moon down they SHALL show only dimly over the night sky.

#### Scenario: Moonlit night
- **WHEN** the page is open at 9 PM with the moon up on the right and 40% low cloud
- **THEN** the clouds show faint cool light on their right sides

#### Scenario: Moon down
- **WHEN** the page is open at night with the moon below the horizon and 40% low cloud
- **THEN** the clouds show dimly, with no side lit

### Requirement: Clouds need WebGL
The clouds SHALL be drawn only where the browser offers WebGL2; without it the scene SHALL show no clouds and everything else as usual, the gray sky still showing overcast. If the browser drops the clouds' graphics context, the clouds SHALL return when the browser restores it, without reloading the page.

#### Scenario: No WebGL2
- **WHEN** the page is open in a browser without WebGL2 at noon with 100% low cloud
- **THEN** the sky is gray with no clouds drawn, and the rest of the scene shows as usual

#### Scenario: Graphics context restored
- **WHEN** the browser drops and then restores the clouds' graphics context while the page is open
- **THEN** the clouds show again with the day's shapes, without a reload

### Requirement: Live weather changes gradually
While live, the scene SHALL move from one weather reading to the next over about 5 minutes, everything that follows the weather together: the clouds and their look, the gray sky, the sun glow, the moon and stars under cloud, the light on the house, and the rain and its lean. A reading arriving partway SHALL start from where the sky is. The first weather after the page opens SHALL show at once. Reduced motion SHALL NOT change this.

#### Scenario: Clearing
- **WHEN** the page is open at noon with 90% low cloud and a new reading brings 20%
- **THEN** over about 5 minutes the clouds thin, the gray fades and the sunlight on the house strengthens together, halfway through about halfway between the two

#### Scenario: Rain starting
- **WHEN** the page is open and a new reading brings rain of 0.4 with full cover
- **THEN** the clouds thicken to a deck and the rain fades in together over about 5 minutes

#### Scenario: A reading during a change
- **WHEN** a new reading arrives 2 minutes into a change toward the previous one
- **THEN** the sky moves from where it is toward the new reading over about 5 minutes, without a jump

#### Scenario: Opening the page
- **WHEN** the page opens and the first live weather arrives
- **THEN** the scene shows that weather at once

#### Scenario: Reduced motion
- **WHEN** a viewer who prefers reduced motion has the page open and a new reading arrives
- **THEN** the sky changes over about 5 minutes, as for any viewer

#### Scenario: Development override
- **WHEN** the development server's live page is opened with weather in its address
- **THEN** the scene shows that weather at once
