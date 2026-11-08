# Spec Delta

## Purpose

The day's 5 minute history the Distribution page's replay reads, and later the Solar page's day view: energy flows, battery level, car charging and its car, and the day's weather, read directly from the database tesla-next shares with anton-tesla-api-ws.

## ADDED Requirements

### Requirement: Day intervals API
`GET /api/intervals?date=YYYY-MM-DD` SHALL return the day's 5 minute records in time order and the day's totals. Each record SHALL contain its start time, the average power in kW of each energy flow over the interval (Wh x 12 / 1000), the battery percentage from battery history or null, whether its battery percentage and its vehicle charging are estimated, and `vehicle`, the plugged-in car's name or null. The response SHALL state whether the day's vehicle totals include estimated intervals.

#### Scenario: Day with data
- **WHEN** the API is called for a fully collected day
- **THEN** it returns one record per interval in ascending time order

#### Scenario: Day not collected
- **WHEN** the API is called for a day with no intervals and no battery samples
- **THEN** it returns status 200 with an empty list and zero totals

#### Scenario: Invalid date
- **WHEN** the API is called with `date=2026-13-40` or no date
- **THEN** it returns status 400

#### Scenario: Estimated values are marked
- **WHEN** the server was down from 02:00 to 02:20 while a car charged
- **THEN** the records for 02:00 through 02:15 mark their battery percentage and vehicle charging as estimated, and the response says vehicle totals include estimates

#### Scenario: The plugged-in car
- **WHEN** the API is called for a day on which R2D2 was plugged in from 9 PM, and for a day before car charging history
- **THEN** the records from 9 PM have `vehicle` "R2D2" and earlier ones null, and every record of the earlier day has `vehicle` null

### Requirement: Energy flows
Each record and the day's totals SHALL report ten non-negative flows: solar to home, solar to vehicle, solar to Powerwall, solar to grid, Powerwall to home, Powerwall to vehicle, Powerwall to grid, grid to home, grid to vehicle, and grid to Powerwall. Records report kW; totals report kWh at watt-hour precision (summed Wh / 1000), so headline totals and percentages are computed before any display rounding.

#### Scenario: Exporting solar at midday
- **WHEN** an interval has 250 Wh of solar exported to the grid
- **THEN** that record's solar to grid flow is 3.0 kW

#### Scenario: Daily totals use exact watt-hours
- **WHEN** a day's solar to home intervals sum to 12,270 Wh
- **THEN** the day's solar to home total is 12.27 kWh

### Requirement: Battery samples without energy
The API SHALL also include a record for each 5 minute time that has a battery sample but no stored energy interval, with null flow values.

#### Scenario: Battery sampled before Tesla publishes energy
- **WHEN** the API is called at 10:07 and the 10:05 battery sample exists but Tesla has not published the 10:05 interval
- **THEN** the 10:05 record has the battery percentage and null flow values

### Requirement: Vehicle charging in interval flows
In measured and estimated intervals, home flows SHALL exclude vehicle charging, which is reported in the vehicle flows instead. In unknown intervals, vehicle flows SHALL be zero and home flows SHALL equal Tesla's home consumption. The response SHALL state whether the day has vehicle data.

#### Scenario: Charging moves energy from home to vehicle
- **WHEN** an interval has 300 Wh of solar to home and a measured 100 Wh of charging while the home draws only solar
- **THEN** that record reports 200 Wh of solar to home and 100 Wh of solar to vehicle, as kW

#### Scenario: Day without vehicle data
- **WHEN** a day has no charging records
- **THEN** the response says the day has no vehicle data, every vehicle flow is zero, and home flows equal Tesla's home consumption

#### Scenario: Estimated charging is attributed like measured charging
- **WHEN** an interval has an estimated 450 Wh of charging and 1,000 Wh of home consumption from the Powerwall
- **THEN** that record reports 450 Wh of Powerwall to vehicle and 550 Wh of Powerwall to home, as kW, and counts toward the day's vehicle totals

### Requirement: Day intervals stay within the site's dates
`GET /api/intervals` SHALL return status 400, naming the window, for a date before 2021-10-01 or more than 732 days after today in the site's time zone, the same window as the range endpoints. It SHALL NOT return a server error for any date.

#### Scenario: A date outside the site's window
- **WHEN** the API is called with `date=9999-12-31`, `date=0001-01-01` or `date=2021-09-30`
- **THEN** it returns status 400 naming the window, not a server error

#### Scenario: The window's first day
- **WHEN** the API is called with `date=2021-10-01`
- **THEN** it returns status 200

### Requirement: Measured and unmeasured intervals are distinguished
An interval SHALL count as measured when it has a charging record, and as estimated when it has none but lies in a run of at most 24 intervals (2 hours) with measured intervals on both sides; its charging energy is then interpolated linearly between those two and marked as estimated. Any other interval inside the charge session coverage SHALL be estimated from charge sessions. All remaining intervals are unknown, and their charging SHALL NOT be treated as zero. A day SHALL count as having vehicle data when it has at least one measured interval or any interval inside the charge session coverage.

#### Scenario: Day before measurement began
- **WHEN** a day has no charging records and lies outside the charge session coverage
- **THEN** the day has no vehicle data and its home consumption is reported as before

#### Scenario: Short outage while charging
- **WHEN** the 03:00 interval measured 600 Wh, 03:05 through 03:15 have no records, and 03:20 measured 600 Wh
- **THEN** 03:05, 03:10 and 03:15 are estimated at 600 Wh each

#### Scenario: Charging ended during an outage
- **WHEN** the 03:00 interval measured 600 Wh, 03:05 through 03:15 have no records, and 03:20 measured 0 Wh
- **THEN** 03:05, 03:10 and 03:15 are estimated at 450, 300 and 150 Wh

#### Scenario: Outage longer than 2 hours
- **WHEN** there are no charging records from 01:00 to 03:30 and the day lies outside the charge session coverage
- **THEN** those intervals are unknown and no charging is attributed to them

#### Scenario: Day covered only by sessions
- **WHEN** a day has no charging records and lies inside the charge session coverage
- **THEN** the day has vehicle data and every interval's charging is estimated from charge sessions

### Requirement: Charging is attributed to energy sources
For each measured interval, charging energy SHALL be split across solar, Powerwall and grid in the same proportions as that interval's total home consumption, and SHALL NOT exceed that total.

#### Scenario: Charging overnight from the Powerwall
- **WHEN** an interval's home consumption is entirely from the Powerwall and 800 Wh of it is charging
- **THEN** 800 Wh is attributed to Powerwall to vehicle and none to solar or grid

#### Scenario: Charging larger than measured home consumption
- **WHEN** an interval records 900 Wh of charging but Tesla reports 850 Wh of home consumption
- **THEN** 850 Wh is attributed to the vehicle and the remaining home consumption is 0

### Requirement: History names the plugged-in car
Charging history served to viewers SHALL name the car plugged in during each 5 minute interval, by its current display name from the account's vehicle list, or "Vehicle" for a VIN not on it, and SHALL NOT include the car's VIN or color. An interval with charging estimated across a gap SHALL name a car only when the same car is plugged in on both sides of the gap.

#### Scenario: A past evening's charge
- **WHEN** a viewer requests a past day on which R2D2 charged from 9 PM
- **THEN** each interval from 9 PM names R2D2, and the response contains no VIN or color

#### Scenario: Renamed car
- **WHEN** R2D2 is renamed in the account to "Artoo" and the vehicle list is refreshed
- **THEN** its past intervals name "Artoo"

#### Scenario: Car no longer on the account
- **WHEN** a past interval's VIN is not in the vehicle list
- **THEN** that interval names "Vehicle"

#### Scenario: Gap between two cars
- **WHEN** an estimated gap has R2D2 plugged in before it and Tesla T.I.E. Fighter after it
- **THEN** the estimated intervals name no car

### Requirement: Charge session coverage
The charge session coverage SHALL run from the start of the earliest stored charge session until 12 hours after the start of the latest one, or the latest one's end if that is later, since a session's energy can be placed up to 12 hours after its start. With no stored sessions there SHALL be no coverage.

#### Scenario: A year of sessions
- **WHEN** the earliest stored session starts 2025-10-20 12:33:01 PDT and the latest starts 2026-10-20 14:44:51 PDT, lasting 1,236 s
- **THEN** the coverage runs from 2025-10-20 12:33:01 PDT to 2026-10-21 02:44:51 PDT

#### Scenario: Morning before the first session
- **WHEN** the earliest stored session starts 2025-10-20 12:33:01 PDT and there are no charging records that day
- **THEN** intervals from 00:00 to 12:30 are unknown and intervals from 12:30 on are estimated from charge sessions

#### Scenario: Day with no sessions inside the coverage
- **WHEN** no session overlaps 2026-08-03 and the coverage runs from 2025-10-20 to 2026-10-20
- **THEN** every interval of 2026-08-03 is estimated at 0 Wh

### Requirement: Charging is estimated from charge sessions
Each session's energy SHALL be placed by walking forward from the interval containing its start, for at most 12 hours. An interval's excess is its home consumption minus that local day's baseline (the 25th percentile of its intervals' home consumption) minus energy already placed there by earlier sessions. An interval whose excess is at least 2 kW (167 Wh) is credited with the excess, up to the session's remaining energy.

#### Scenario: Charge starts at plug-in
- **WHEN** a 1,000 Wh session starts at 09:58, the day's baseline is 1 kW, and home consumption is 9 kW at 10:00 and 10:05
- **THEN** 10:00 is estimated at 667 Wh and 10:05 at 333 Wh

#### Scenario: Scheduled overnight charge
- **WHEN** a 46.3 kWh session starts at 19:22, home consumption stays near the 1 kW baseline until midnight, and is about 8.7 kW from 00:05
- **THEN** no charging is estimated before midnight and the session's energy is estimated from 00:05 on

#### Scenario: Two sessions on the same load
- **WHEN** an earlier session was credited 400 Wh of an interval with 600 Wh of excess
- **THEN** a later session can be credited at most the remaining 200 Wh there

### Requirement: Session placement ends with the charge
Once a session has been credited energy, its walk SHALL end after 6 intervals (30 minutes) in a row that it is not credited. Energy not placed when the walk ends SHALL NOT be shown. An interval inside the coverage that no session is credited SHALL be estimated at 0 Wh. Session estimates SHALL be attributed to energy sources like measured charging.

#### Scenario: Unrelated load later in the day
- **WHEN** a session's charging stops at 15:05 with 300 Wh left, the load stays near the baseline until 17:40, and an oven then adds 3 kW
- **THEN** no charging is estimated at 17:40 and the 300 Wh is not shown

#### Scenario: No matching load
- **WHEN** no interval within 12 hours of a session's start reaches 2 kW above the baseline
- **THEN** none of the session's energy is shown and those intervals are estimated at 0 Wh

### Requirement: Measured charging counts toward a session
An interval with measured or gap-estimated charging SHALL keep that value. When a session's walk reaches it, the walk SHALL subtract that value from the session's remaining energy and treat the interval as charging, without crediting it.

#### Scenario: Measured data wins
- **WHEN** a 900 Wh session starts at 14:50, which has a 396 Wh charging record
- **THEN** 14:50 reports 396 Wh measured and the session places 504 Wh in later intervals

### Requirement: Session estimates are marked in history
Charging history SHALL mark intervals estimated from charge sessions as estimated, SHALL name for each the car of the session whose energy fills most of it, by its current display name and only when that session has a car, and SHALL report for the day whether any such interval has more than 0 Wh.

#### Scenario: A slow session
- **WHEN** a session averaging 5.5 kW fills an interval
- **THEN** that interval names no car

#### Scenario: An interval without session energy
- **WHEN** an interval inside the coverage is estimated at 0 Wh
- **THEN** it names no car

### Requirement: A session's car is inferred from its power
Each charge session's average power SHALL be its energy divided by its duration. At 8 kW or more its car SHALL be the Model Y, from 6.5 kW up to 8 kW the Model 3, and otherwise none. A car's model SHALL be the 4th character of its VIN (`Y` or `3`), among the cars that are streamed. A model SHALL name a car only when exactly one such car has that model.

#### Scenario: A fast overnight charge
- **WHEN** a session added 13,278 Wh in 5,076 s (9.4 kW) and R2D2 is the only streamed car with a `Y` in its VIN
- **THEN** the session's car is R2D2

#### Scenario: A Model 3 charge
- **WHEN** a session added 46,311 Wh in 21,855 s (7.6 kW) and Tesla T.I.E. Fighter is the only streamed car with a `3` in its VIN
- **THEN** the session's car is Tesla T.I.E. Fighter

#### Scenario: A slow charge
- **WHEN** a session averaged 5.5 kW
- **THEN** the session has no car

#### Scenario: Two cars of the same model
- **WHEN** a session averaged 9.4 kW and two streamed cars have a `Y` in their VINs
- **THEN** the session has no car

#### Scenario: Vehicle list unavailable
- **WHEN** no streamed cars are known
- **THEN** no session has a car

### Requirement: A measured car overrides the inferred one
When a session's walk reaches an interval with measured charging that names a car, the session's car SHALL be that car instead of the one inferred from its power. When it reaches more than one, the first SHALL be used.

#### Scenario: Outage during a charge
- **WHEN** a session averaging 7.6 kW walks through 23:00 to 23:10, measured and naming R2D2, and continues during an outage until 02:00
- **THEN** the session's intervals from 23:15 to 02:00 name R2D2

#### Scenario: Walk without measurements
- **WHEN** a session's walk reaches no measured interval
- **THEN** its car is inferred from its power

### Requirement: Short gaps are estimated
Stored samples SHALL remain real readings only. Where battery history is served, a run of at most 24 consecutive 5 minute boundaries without a sample (2 hours) that has a real sample on both sides SHALL be filled by linear interpolation between those two samples, rounded to a whole percent and marked as estimated. Longer runs, and runs without a sample after them, SHALL be reported as null.

#### Scenario: Server down for 20 minutes
- **WHEN** the server is down from 02:00 to 02:20 with samples of 60% at 01:55 and 56% at 02:20
- **THEN** 02:00 through 02:15 report 59%, 58%, 58% and 57%, each marked as estimated

#### Scenario: Outage longer than 2 hours
- **WHEN** no samples exist from 01:00 to 03:30
- **THEN** those boundaries report a null battery percentage

#### Scenario: Gap still open
- **WHEN** the server has been down since 14:00 today and no sample exists after it
- **THEN** boundaries from 14:00 onward report null

#### Scenario: Gap across midnight
- **WHEN** samples are missing from 23:50 to 00:10 and exist at 23:45 and 00:15
- **THEN** the boundaries on both days are estimated from those two samples

### Requirement: Weather history for the day
The response SHALL include the day's weather readings, from an hour before the day starts to an hour after it ends, in time order, each with its start time in the site's time zone and the cloud cover, cloud shares, rain, wind across the scene at 10 m and at each cloud band's height, and roof sunshine, computed as the scene-weather capability sets for the live data.

#### Scenario: Replaying a cloudy morning
- **WHEN** the day's 7:45 AM reading has 90% low cloud and the airport reports broken low cloud
- **THEN** the replay's readings include 7:45 AM with that cover, so the scene shows the morning overcast

### Requirement: Car names come from the stored vehicle list
The car names in the response, and the streamed cars a session's car is inferred among, SHALL come from the vehicle list anton-tesla-api-ws stores in the database, refreshed every 6 hours, so the read never calls Tesla. A VIN not in it SHALL be named "Vehicle".

#### Scenario: A car renamed in the Tesla app
- **WHEN** R2D2 is renamed and the vehicle list has refreshed since
- **THEN** past days name it by its new name

### Requirement: The same answer as Flask's
Until anton-tesla-api-ws's `/api/v2/intervals` is retired, `/api/intervals?date=` SHALL return the same JSON as it, compared as parsed values, for every date in the site's window, with the same 400 responses for dates outside it.

#### Scenario: Every stored day
- **WHEN** both endpoints are asked for every date from 2021-10-01 to today
- **THEN** every pair of responses is equal
