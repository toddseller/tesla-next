# Spec Delta

## MODIFIED Requirements

### Requirement: Wind reading
The server SHALL store each reading's wind speed and the direction it blows from at 10 m, and at the heights of the low, mid and high cloud (the 850, 700 and 300 hPa levels), and send with the cover and rain the part of each blowing across the scene, in km/h, positive toward the scene's right (the house's east side) and negative toward its left: in the live data and with each of a day's replay readings, none without a recent reading. A level the service did not report SHALL be sent as none. Readings stored before wind was kept SHALL get their wind from the service's history, without any other part of a reading being replaced. The server SHALL also store each reading's strongest gust at 10 m, and send the 10 m wind's speed, gusts and direction as they are, in km/h and degrees, live and with each replay reading; a value not stored SHALL be sent as none. Readings stored before gusts were kept SHALL get their gusts from the service's history in the same way.

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

#### Scenario: The wind as it is
- **WHEN** the latest reading has wind of 29 km/h from 225 degrees with gusts of 56 km/h
- **THEN** the live data carries a speed of 29, gusts of 56 and a direction of 225, next to the across-scene wind

#### Scenario: A reading stored before gusts
- **WHEN** a replayed reading was stored before gusts were kept and the backfill has not reached it
- **THEN** its replay reading carries its speed and direction, and no gusts

#### Scenario: Gusts backfilled
- **WHEN** the history backfill runs over days stored before gusts were kept
- **THEN** those readings gain their gusts, and every other value stays as it was

## ADDED Requirements

### Requirement: Weather vane
The scene SHALL show a weather vane standing on the house's roof, live and in replay, whatever the weather. It SHALL stay clear of the labels and energy lines, and darken at night and lighten at dawn as the house does.

#### Scenario: Calm noon
- **WHEN** the page is open at noon with no wind
- **THEN** a weather vane stands on the roof, still

#### Scenario: Night
- **WHEN** the page is open at 10 PM
- **THEN** the vane shows on the roof, dimmed as the house is

### Requirement: Vane points into the wind
The vane SHALL point toward the compass direction the 10 m wind blows from, in the house's frame: east toward the scene's right, west its left, north away from the viewer and south toward the viewer, in between as the direction lies. On a new direction it SHALL swing the shorter way round and settle within about 3 seconds, overshooting once. Below 2 mph it SHALL keep its last direction. Without a recent wind reading it SHALL stand still where it was.

#### Scenario: West wind
- **WHEN** the latest reading has wind from 270 degrees
- **THEN** the vane points toward the scene's left, side-on

#### Scenario: North wind
- **WHEN** the latest reading has wind from 0 degrees
- **THEN** the vane points away from the viewer, foreshortened, not side-on

#### Scenario: The wind backs across north
- **WHEN** the direction changes from 350 to 10 degrees while the page is open
- **THEN** the vane swings 20 degrees through north, not 340 degrees the other way

#### Scenario: Calm after a south wind
- **WHEN** the wind drops from 15 mph from the south to 1 mph from the east
- **THEN** the vane keeps pointing south

### Requirement: Vane shows the wind's strength
Around its direction the vane SHALL shake, more the stronger the gusts are above the mean wind and somewhat more the stronger the wind, up to about 25 degrees either way, and faster the stronger the wind. Below 5 km/h it SHALL hold still. Without gusts it SHALL shake as for gusts half again the mean. These amounts SHALL be revised together once tuned by eye. Under reduced motion it SHALL turn to each direction at once and not shake.

#### Scenario: Steady breeze
- **WHEN** the wind is 30 km/h with gusts of 32 km/h
- **THEN** the vane wavers only a few degrees around its direction

#### Scenario: Gusty storm
- **WHEN** the wind is 30 km/h with gusts of 60 km/h
- **THEN** the vane swings well to either side of its direction, clearly more than in a steady 30 km/h

#### Scenario: Reduced motion
- **WHEN** a viewer with reduced motion on watches the wind turn from west to south
- **THEN** the vane points south at once, without swinging, and doesn't shake

### Requirement: Wind readout
Tapping or clicking the vane SHALL show the wind beside it: speed and gusts in whole mph and the direction it blows from as one of eight compass points, as "18 mph, gusts 35 mph, from SW"; without gusts "18 mph from SW"; below 2 mph "Calm"; without a recent reading "No wind reading". The vane SHALL be reachable and opened by keyboard. Tapping elsewhere, the vane again, or Escape SHALL close it. It SHALL follow new readings while open.

#### Scenario: Tap in a storm
- **WHEN** the latest reading is 29 km/h from 225 degrees with gusts of 56 km/h and the vane is tapped
- **THEN** the readout shows "18 mph, gusts 35 mph, from SW"

#### Scenario: Closing
- **WHEN** the readout is open and the viewer taps the sky
- **THEN** the readout closes

#### Scenario: Keyboard
- **WHEN** a keyboard user tabs to the vane and presses Enter
- **THEN** the readout opens, and Escape closes it

#### Scenario: Before anton sends the wind
- **WHEN** the live data carries no wind speed or direction and the vane is tapped
- **THEN** the readout shows "No wind reading" and the vane stands still

### Requirement: Vane in replay
In replay the vane SHALL follow the replayed time's 10 m wind, its direction and strength changing smoothly between readings and the direction the shorter way round, and its readout SHALL show the replayed reading. A replayed time with no readings SHALL show the vane still and the readout "No wind reading".

#### Scenario: Replaying a storm
- **WHEN** a February storm day is replayed through its strongest hour
- **THEN** the vane shakes hard and the readout shows that hour's speed, gusts and direction

#### Scenario: Wind turns in replay
- **WHEN** a replay plays through readings from 340 and then 20 degrees
- **THEN** the vane turns through north between them, without a jump
