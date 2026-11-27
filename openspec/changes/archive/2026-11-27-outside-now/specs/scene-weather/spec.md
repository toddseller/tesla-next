## ADDED Requirements

### Requirement: The Outside band
Distribution SHALL show a band under its scene, above Today so far, reading "Outside now" live and "Outside at" the replayed time in replay, then the condition's icon and word, the temperature in whole degrees of the viewer's unit, the wind as the vane's readout words it, and the shown day's sunrise and sunset. On a phone it SHALL wrap to two lines without scrolling sideways.

#### Scenario: A cloudy, calm morning
- **WHEN** at 10:19 AM the live data carries 16.7 °C, an overcast code and wind of 2 km/h, for a US viewer
- **THEN** the band reads Outside now, 62°F, Cloudy, Calm, Sunrise 7:03 AM, Sunset 4:54 PM

#### Scenario: Celsius
- **WHEN** the same reading reaches a viewer whose units are °C and km/h
- **THEN** the band reads 17°C and Calm

#### Scenario: A phone
- **WHEN** Distribution opens on a 390-pixel-wide screen
- **THEN** the band shows on two lines under the scene and nothing scrolls sideways

### Requirement: The band's condition word
The band SHALL word the condition as the Solar forecast's Today tile does from the same weather code, for day or night at the shown time, without "now". A fog code SHALL read as fog only when the reading's cover is 1 or its low cloud share is 0.75 or more, as the scene then draws it; otherwise it SHALL read by the reading's cover.

#### Scenario: Night
- **WHEN** the live reading at 9:40 PM is clear
- **THEN** the band reads Clear, with the moon icon

#### Scenario: Fog the airport doesn't see
- **WHEN** the reading's code is fog, its low cloud share is 0.19 and its cover is 0.2
- **THEN** the band does not read Fog

#### Scenario: Fog the airport sees
- **WHEN** the reading's code is fog and its low cloud share is 1
- **THEN** the band reads Fog

#### Scenario: Fog without the airport's report
- **WHEN** the reading's code is fog, it has no airport cloud, and its cover is 1
- **THEN** the band reads Fog

### Requirement: The band in replay
In replay the band SHALL show the reading the scene shows for the replayed time, and the replayed day's sunrise and sunset, changing as the replay moves.

#### Scenario: A storm at noon
- **WHEN** 2024-02-04 is replayed at 12:00 PM, whose reading is 13.4 °C, overcast, wind 42 km/h from 168 degrees with gusts of 86 km/h, for a US viewer
- **THEN** the band reads Outside at 12:00 PM, 56°F, Cloudy, 26 mph, gusts 53 mph, from S, and that day's sunrise and sunset

#### Scenario: Back to live
- **WHEN** the visitor returns to live
- **THEN** the band reads Outside now with the live reading

### Requirement: The band without a reading
Without a recent reading live, or with no reading at the replayed time, the band SHALL show only the sunrise and sunset; with a reading but no temperature, it SHALL leave the temperature out and show the rest.

#### Scenario: No recent reading
- **WHEN** the live data carries no weather
- **THEN** the band shows Outside now and the day's sunrise and sunset, and no temperature, condition or wind

#### Scenario: Before anton sends the temperature
- **WHEN** the live data carries cover and wind but no temperature or code
- **THEN** the band shows the wind, sunrise and sunset, and no temperature or condition
