# Spec Delta

## MODIFIED Requirements

### Requirement: Weather history for the day
The response SHALL include the day's weather readings, from an hour before the day starts to an hour after it ends, in time order, each with its start time in the site's time zone and the cloud cover, cloud shares, rain, wind across the scene at 10 m and at each cloud band's height, the 10 m wind's speed, gusts and direction as stored (none when not stored), and roof sunshine, computed as the scene-weather capability sets for the live data.

#### Scenario: Replaying a cloudy morning
- **WHEN** the day's 7:45 AM reading has 90% low cloud and the airport reports broken low cloud
- **THEN** the replay's readings include 7:45 AM with that cover, so the scene shows the morning overcast

#### Scenario: Wind as stored
- **WHEN** the day's noon reading has wind of 29 km/h from 225 degrees with gusts of 56 km/h
- **THEN** the noon reading carries a speed of 29, gusts of 56 and a direction of 225

#### Scenario: Before gusts were stored
- **WHEN** the database has no gusts for a reading, or no gusts column yet
- **THEN** that reading carries its speed and direction, and no gusts, and the response is not an error
