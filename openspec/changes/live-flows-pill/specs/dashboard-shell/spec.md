# Spec Delta

## MODIFIED Requirements

### Requirement: Live status in the top bar
Every page's top bar SHALL end with the live status: a dot, "LIVE" and the time of the latest live status in the site's time zone, like "9:59 AM", and the live pill. The pill SHALL read the solar power, the home power, and "PW" with the Powerwalls' charge and their state as anton reports it, like "SOLAR 6.2 kW · HOME 1.4 kW · PW 92% · CHARGING". Each power SHALL follow a square in its flow color, in the light text color itself. It SHALL update with each live status, about every 10 seconds, without reloading the page.

#### Scenario: Charging at midday
- **WHEN** the latest live status, from 9:59 AM, reports 6.2 kW of solar, 1.4 kW of home use and the Powerwalls at 92% and Charging
- **THEN** the top bar on every page reads LIVE 9:59 AM and SOLAR 6.2 kW · HOME 1.4 kW · PW 92% · CHARGING, with the dot in the Powerwall color, an amber square before SOLAR and a blue one before HOME

#### Scenario: A new status arrives
- **WHEN** a status from 10:00 AM reports 6.5 kW of solar, 1.2 kW of home use, 93% and Charging while a viewer is on the Top Ten page
- **THEN** the top bar reads LIVE 10:00 AM and SOLAR 6.5 kW · HOME 1.2 kW · PW 93% · CHARGING, with no reload

#### Scenario: The figures' form
- **WHEN** a status reports 0.04 kW of solar and 12.34 kW of home use
- **THEN** the pill reads SOLAR 0 kW and HOME 12.3 kW, as the Distribution page writes them

#### Scenario: Home not reported
- **WHEN** the latest status at midday reports solar and the Powerwalls but no home power
- **THEN** the pill reads SOLAR, then PW, with no HOME

#### Scenario: The Distribution page
- **WHEN** a viewer opens the Distribution page
- **THEN** its top bar has the same live pill as every other page

### Requirement: A stale or missing live status
When the latest live status is two minutes old or more, as the Distribution page counts it stale, the top bar SHALL turn the dot gray and read "LAST" in place of "LIVE", keeping the time and the Powerwall part of the last status received, until a status arrives. A stale status's solar and home SHALL be left out of the pill. Before any live status is known, the time, the charge and the state SHALL show dashes, and the pill SHALL hold no solar or home.

#### Scenario: Flask stops polling
- **WHEN** the last status, from 9:59 AM, reported 6.2 kW of solar, 1.4 kW of home use, 92% and Charging, and is more than two minutes old
- **THEN** the top bar reads LAST 9:59 AM with a gray dot and the pill reads PW 92% · CHARGING alone, and turns back to LIVE with solar and home with the next status

#### Scenario: Right after a deploy
- **WHEN** a page is opened before the server has received a live status
- **THEN** the top bar shows dashes for the time, the charge and the state, reading PW — · —, and fills them in, with solar and home, with the first status

### Requirement: Off grid and storm watch in the top bar
The top bar's live status SHALL add a pill before the live pill while the latest live status reports the site off the grid or in storm watch: "OFF GRID TEST" for `off_grid_intentional`; "OFF GRID" for any other island status starting `off_grid`, followed by "SINCE" and the time the current stretch began when the server holds an off-grid stretch; and "STORM WATCH" while storm watch is active and the site is on the grid. Otherwise there SHALL be no added pill.

#### Scenario: An outage with its stretch stored
- **WHEN** the latest status reports `off_grid_unintentional` and the current stretch is `off_grid_unintentional` from 6:25 AM
- **THEN** the top bar reads OFF GRID SINCE 6:25 AM beside the live pill

#### Scenario: An outage in its first minutes
- **WHEN** the latest status reports `off_grid_unintentional` and the current stretch is still `on_grid`, not yet stored by anton
- **THEN** the top bar reads OFF GRID, with no time

#### Scenario: A test
- **WHEN** the latest status reports `off_grid_intentional`
- **THEN** the top bar reads OFF GRID TEST

#### Scenario: Storm watch
- **WHEN** the latest status reports `on_grid` and storm watch active
- **THEN** the top bar reads STORM WATCH beside the live pill

#### Scenario: An outage during storm watch
- **WHEN** the latest status reports `off_grid_unintentional` and storm watch active
- **THEN** the top bar reads OFF GRID and not STORM WATCH

#### Scenario: On the grid
- **WHEN** the latest status reports `on_grid` without storm watch, or has neither field
- **THEN** the top bar shows only the live pill

#### Scenario: A stale status
- **WHEN** the last status, more than two minutes old, reported `off_grid_unintentional`
- **THEN** the top bar reads LAST with a gray dot and keeps the OFF GRID pill, as it keeps the Powerwall part of the live pill

## ADDED Requirements

### Requirement: Solar in the live pill follows the sun
The live pill SHALL hold solar from sunrise to sunset at the site, whatever the panels produce, and leave it out from sunset to sunrise, by the same sunrise and sunset the Distribution scene uses. Solar SHALL come into the pill and leave it only at those two moments, never as its output rises or falls.

#### Scenario: A cloudy dawn
- **WHEN** a status arrives five minutes after sunrise reporting 0.02 kW of solar
- **THEN** the pill reads SOLAR 0 kW

#### Scenario: Dusk
- **WHEN** statuses before sunset report solar falling from 0.12 to 0.03 kW and back to 0.08 kW
- **THEN** SOLAR stays in the pill throughout, reading 0.1, 0 and 0.1 kW

#### Scenario: After sunset
- **WHEN** the bar's clock passes sunset, with home use at 0.8 kW and the Powerwalls at 64% and Discharging
- **THEN** the pill reads HOME 0.8 kW · PW 64% · DISCHARGING, with no SOLAR, until sunrise

### Requirement: The live pill in a narrower window
In a window narrower than 1360 pixels, the live pill SHALL leave out solar and home and read the Powerwall part alone. On a phone the whole pill doesn't fit the row under the brand, and below 1360 pixels it would push the page links onto a second row.

#### Scenario: A phone at midday
- **WHEN** a viewer opens a page on a 390 pixel wide screen while a status reports 6.2 kW of solar, 1.4 kW of home use, 92% and Charging
- **THEN** the top bar reads LIVE with the time and PW 92% · CHARGING, with no SOLAR or HOME, and nothing scrolls sideways

#### Scenario: A 1280 pixel laptop
- **WHEN** the same status shows in a 1280 pixel wide window
- **THEN** the pill reads PW 92% · CHARGING alone, and the six links stay on one row as before

#### Scenario: A wide window
- **WHEN** the same status shows in a 1366 pixel wide window
- **THEN** the pill reads SOLAR 6.2 kW · HOME 1.4 kW · PW 92% · CHARGING, on one line with the name and the six links
