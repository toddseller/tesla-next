## MODIFIED Requirements

### Requirement: History names the plugged-in car
Charging history served to viewers SHALL name the car plugged in during each 5 minute interval, by its display name in the stored vehicle list, which keeps a car's last name after it leaves the account, or "Vehicle" for a VIN never stored, and SHALL NOT include the car's VIN or color. An interval with charging estimated across a gap SHALL name a car only when the same car is plugged in on both sides of the gap.

#### Scenario: A past evening's charge
- **WHEN** a viewer requests a past day on which R2D2 charged from 9 PM
- **THEN** each interval from 9 PM names R2D2, and the response contains no VIN or color

#### Scenario: Renamed car
- **WHEN** R2D2 is renamed in the account to "Artoo" and the vehicle list is refreshed
- **THEN** its past intervals name "Artoo"

#### Scenario: Car no longer on the account
- **WHEN** Tesla T.I.E. Fighter leaves the account and the vehicle list is refreshed
- **THEN** its past intervals still name "Tesla T.I.E. Fighter"

#### Scenario: A VIN never stored
- **WHEN** a past interval's VIN was never in the vehicle list
- **THEN** that interval names "Vehicle"

#### Scenario: Gap between two cars
- **WHEN** an estimated gap has R2D2 plugged in before it and Tesla T.I.E. Fighter after it
- **THEN** the estimated intervals name no car

### Requirement: Charge session coverage
The charge session coverage SHALL run from the start of the earliest stored charge session until 24 hours after the start of the latest one, or the latest one's end if that is later, since a session's energy can be placed up to 24 hours after its start. With no stored sessions there SHALL be no coverage.

#### Scenario: A year of sessions
- **WHEN** the earliest stored session starts 2025-10-20 12:33:01 PDT and the latest starts 2026-10-20 14:44:51 PDT, lasting 1,236 s
- **THEN** the coverage runs from 2025-10-20 12:33:01 PDT to 2026-10-21 14:44:51 PDT

#### Scenario: Morning before the first session
- **WHEN** the earliest stored session starts 2025-10-20 12:33:01 PDT and there are no charging records that day
- **THEN** intervals from 00:00 to 12:30 are unknown and intervals from 12:30 on are estimated from charge sessions

#### Scenario: Day with no sessions inside the coverage
- **WHEN** no session overlaps 2026-08-03 and the coverage runs from 2025-10-20 to 2026-10-20
- **THEN** every interval of 2026-08-03 is estimated at 0 Wh

### Requirement: Charging is estimated from charge sessions
A session's start is often when the car was plugged in, not when it charged, so each session's energy SHALL be placed in one stretch of consecutive intervals as long as its recorded duration plus one interval, starting no earlier than the interval containing its start and ending within 24 hours of it and before the next session starts, since one Wall Connector charges one session at a time: the stretch whose creditable energy, up to the session's, is largest, the earliest of equals. An interval's excess is its home consumption minus that local day's baseline (the 25th percentile of its intervals' home consumption) minus energy already placed there by earlier sessions. In the stretch, in order, an interval whose excess is at least 2 kW (167 Wh) is credited with the excess, up to the session's remaining energy.

#### Scenario: Charge starts at plug-in
- **WHEN** a 1,000 Wh session of 420 s starts at 09:58, the day's baseline is 1 kW, and home consumption is 9 kW at 10:00 and 10:05
- **THEN** 10:00 is estimated at 667 Wh and 10:05 at 333 Wh

#### Scenario: Scheduled overnight charge
- **WHEN** a 46.3 kWh session starts at 19:22, home consumption stays near the 1 kW baseline until midnight, and is about 8.7 kW from 00:05
- **THEN** no charging is estimated before midnight and the session's energy is estimated from 00:05 on

#### Scenario: Charged the next day
- **WHEN** a 30.1 kWh session of 5.76 hours starts at 16:50, the load stays near the baseline that evening and night, and is about 5 kW above it from 10:00 to 16:00 the next day
- **THEN** the session's energy is estimated from 10:00 the next day

#### Scenario: The next session's charge
- **WHEN** a 9.6 kWh session starts at 14:02 with about 4 kWh of load above the baseline that afternoon, and the next session starts at 11:14 the next day on a 9 kW load
- **THEN** the first session is credited the afternoon's 4 kWh only, and the next day's load goes to the next session

#### Scenario: Two sessions on the same load
- **WHEN** an earlier session was credited 400 Wh of an interval with 600 Wh of excess
- **THEN** a later session can be credited at most the remaining 200 Wh there

### Requirement: Session placement ends with the charge
A session's energy SHALL be placed only in its stretch. Energy its stretch cannot hold SHALL NOT be shown. An interval inside the coverage that no session is credited SHALL be estimated at 0 Wh. Session estimates SHALL be attributed to energy sources like measured charging.

#### Scenario: Unrelated load later in the day
- **WHEN** a 2-hour session's energy fits from 13:00 to 15:05 and an oven adds 3 kW at 17:40
- **THEN** no charging is estimated at 17:40

#### Scenario: No matching load
- **WHEN** no interval within 24 hours of a session's start reaches 2 kW above the baseline
- **THEN** none of the session's energy is shown and those intervals are estimated at 0 Wh

### Requirement: Measured charging counts toward a session
An interval with measured or gap-estimated charging SHALL keep that value. When it falls in a session's stretch, it SHALL count that value toward the stretch's creditable energy and the session's placed energy, without crediting it.

#### Scenario: Measured data wins
- **WHEN** a 900 Wh session of 900 s starts at 14:50, which has a 396 Wh charging record
- **THEN** 14:50 reports 396 Wh measured and the session places 504 Wh in later intervals
