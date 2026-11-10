# Spec Delta

## MODIFIED Requirements

### Requirement: Day intervals API
`GET /api/intervals?date=YYYY-MM-DD` SHALL return the day's 5 minute records in time order and the day's totals. Each record SHALL contain its start time, the average power in kW of each energy flow over the interval (Wh x 12 / 1000), each flow's energy in Wh, unrounded, the battery percentage from battery history or null, whether its battery percentage and its vehicle charging are estimated, and `vehicle`, the plugged-in car's name or null. The response SHALL state whether the day's vehicle totals include estimated intervals.

#### Scenario: Day with data
- **WHEN** the API is called for a fully collected day
- **THEN** it returns one record per interval in ascending time order

#### Scenario: Each flow's energy
- **WHEN** an interval sent 412 Wh from the grid to the home
- **THEN** its record gives that flow as 4.94 kW and 412 Wh, and the records' Wh for each flow add up to the day's total for it

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
