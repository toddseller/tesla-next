# solar-day-view Specification

## Purpose
Shows one day's energy flows in 5 minute steps, as the Tesla app's Solar, Home, Vehicle, Powerwall and Grid views, and lets a visitor move from day to day without going back to the range.

## Requirements

### Requirement: The open day is in the address
When the Solar page's address has a `day` parameter, a `YYYY-MM-DD` date from 2021-10-10, the site's first day of service, to today in the site's time zone, the page SHALL show that day's day view, rendered on the server with its data. Any other `day` value SHALL be ignored and the range shown.

#### Scenario: A shared day
- **WHEN** a visitor opens `/?start=2026-10-01&end=2026-10-31&day=2026-10-14`
- **THEN** the page shows October 14, 2026's day view, with its chart data in the first response

#### Scenario: A day in the future
- **WHEN** a visitor opens `/?day=2030-01-01`
- **THEN** the page shows the current month's range

### Requirement: Intraday views
The day view SHALL offer Solar, Home, Vehicle, Powerwall and Grid views with a selector, opening on Solar. Each view SHALL show a headline total, a chart over the full local day from midnight to midnight with ticks at 6 AM, 12 PM and 6 PM, and a breakdown listing each flow's share as a percentage and kWh.

#### Scenario: Switching views
- **WHEN** a visitor opens October 16 and selects Home
- **THEN** the Home chart, total and breakdown for October 16 are shown without leaving the day

#### Scenario: Today in progress
- **WHEN** a visitor opens today at 11:47
- **THEN** the chart's time axis still spans the whole day and the data ends at the latest published interval

### Requirement: Solar view
The Solar view SHALL stack solar to home, solar to vehicle, solar to Powerwall and solar to grid as filled areas whose top edge is total solar generation, headed by Total Generated, with a Used By breakdown listing Home, Vehicle, Powerwall and Grid. On days without vehicle data the Vehicle band and line are omitted.

#### Scenario: Matches the Tesla app
- **WHEN** a visitor opens October 16, 2026
- **THEN** Total Generated is 43.3 kWh and Used By lists Home 12.3 kWh with the Powerwall and Grid shares of the rest

#### Scenario: Day with charging from solar
- **WHEN** a day with vehicle data had 3.4 kWh of solar to vehicle
- **THEN** Used By lists Vehicle 3.4 kWh between Home and Powerwall, and Home excludes it

### Requirement: Home view
The Home view SHALL stack solar to home, Powerwall to home and grid to home as filled areas whose top edge is total home usage excluding vehicle charging, headed by Total Usage, with a Powered By breakdown.

#### Scenario: Night on battery
- **WHEN** the home runs from the Powerwall overnight
- **THEN** the night portion of the Home chart is the Powerwall area

#### Scenario: Charging is not home usage
- **WHEN** a day with vehicle data had 9.1 kWh of charging
- **THEN** Total Usage excludes those 9.1 kWh

### Requirement: Vehicle view
The Vehicle view SHALL stack solar to vehicle, Powerwall to vehicle and grid to vehicle as filled areas whose top edge is total charging power, headed by Charged, with a Charged From breakdown (Solar, Powerwall, Grid). It SHALL NOT identify which car charged. A day without vehicle data SHALL show a note instead of a chart.

#### Scenario: Overnight charge from the Powerwall
- **WHEN** a visitor opens a day on which a car charged 4.8 kWh entirely from the Powerwall
- **THEN** Charged is 4.8 kWh and Charged From lists Powerwall 100%

#### Scenario: Day before vehicle data
- **WHEN** a visitor opens a day before charging measurement began
- **THEN** the Vehicle view shows the note instead of a chart

### Requirement: Powerwall view
The Powerwall view SHALL plot the Powerwall's power as filled areas, with discharge above zero stacked by destination (to home, to vehicle, to grid) and charge below zero stacked by source (from solar, from grid). It SHALL be headed by the day's discharged and charged energy side by side, with Charged From and Discharged To breakdowns. On days without vehicle data the vehicle band is omitted.

#### Scenario: Discharging to the house at night
- **WHEN** the Powerwall supplies the house at 1.2 kW at 02:00
- **THEN** the Powerwall chart shows a home-colored area 1.2 kW above zero at 02:00

#### Scenario: Charging from solar at midday
- **WHEN** solar charges the Powerwall at 3.4 kW at 12:00
- **THEN** the Powerwall chart shows a solar-colored area 3.4 kW below zero at 12:00

#### Scenario: Both headlines
- **WHEN** a day's Powerwall discharged 15.1 kWh and charged 6.3 kWh
- **THEN** the view is headed by Discharged 15.1 kWh and Charged 6.3 kWh side by side

#### Scenario: Day before battery history
- **WHEN** a visitor opens a day before battery sampling began
- **THEN** the Powerwall view still shows the power chart, the headlines and the energy breakdowns

#### Scenario: Powerwall charges a car overnight
- **WHEN** a car charged 4.8 kWh from the Powerwall overnight
- **THEN** Discharged To lists Vehicle 4.8 kWh

### Requirement: Powerwall charge level
Below its power chart, the Powerwall view SHALL always show the battery's charge level as a shorter chart from 0 to 100%, over the same day and time ticks. Missing levels SHALL appear as breaks; on a day without any, the charge level chart SHALL be replaced by a note that battery history is not available for it.

#### Scenario: Charge level under the power chart
- **WHEN** a visitor opens the Powerwall view for a day with battery samples
- **THEN** the battery's charge level from 0 to 100% is shown under the power chart, without a control to hide it

#### Scenario: Long outage
- **WHEN** the day has no battery level from 01:00 to 03:30
- **THEN** the charge level line is broken across that period

#### Scenario: No battery history
- **WHEN** a visitor opens a day before battery sampling began
- **THEN** a note that battery history is not available replaces only the charge level chart

### Requirement: Grid view
The Grid view SHALL plot grid imports above zero (to home, to vehicle, to Powerwall) and exports below zero (from solar, from Powerwall), headed by the day's Imported and Exported totals side by side, with Imported To and Exported From breakdowns and a "Net Grid Usage" line under the chart stating the net in kWh followed by Imported or Exported. A net that displays as 0.0 kWh SHALL read Exported.

#### Scenario: Exporting at midday
- **WHEN** solar is exported to the grid at noon
- **THEN** the Grid chart shows an area below zero at noon

#### Scenario: A day that imported more than it exported
- **WHEN** a day imported 84.7 kWh and exported 55.0 kWh
- **THEN** the Grid view is headed Imported 84.7 kWh and Exported 55.0 kWh, and the line under the chart reads "Net Grid Usage: 29.7 kWh Imported"

#### Scenario: A day that exported more than it imported
- **WHEN** a day imported 5.0 kWh and exported 15.7 kWh
- **THEN** the line under the chart reads "Net Grid Usage: 10.7 kWh Exported"

#### Scenario: A day with no grid flow
- **WHEN** a day's grid flows total 0.0 kWh
- **THEN** the Grid view is headed Imported 0.0 kWh and Exported 0.0 kWh, and the line reads "Net Grid Usage: 0.0 kWh Exported"

### Requirement: Metering noise reads as nothing
Power charts SHALL use a minimum axis range of 0 to 1 kW (Solar, Home, Vehicle) or -1 to 1 kW (Grid), widening for larger values. The Powerwall power chart SHALL use a range symmetric around zero, at least -1 to 1 kW, widened on both sides to fit the larger of its charge and discharge. When a breakdown's total rounds to 0.0 kWh, its percentages SHALL be shown as a dash.

#### Scenario: Grid holding at zero
- **WHEN** a day's grid flows are only 1 to 2 Wh per interval, 0.04 kWh in total
- **THEN** the Grid chart reads as flat on a -1 to 1 kW axis and the breakdowns show dashes instead of percentages

#### Scenario: A normal day still scales
- **WHEN** solar peaks at 7.5 kW
- **THEN** the Solar axis extends beyond 1 kW to fit it

#### Scenario: Powerwall axis stays centered
- **WHEN** the Powerwall discharges at up to 5.4 kW and charges at up to 3.1 kW
- **THEN** the Powerwall chart's axis spans the same distance above and below zero, at least 5.4 kW each way

### Requirement: Flows drawn without estimate markings
Each flow SHALL be a filled area with a solid outline, and no outline where the flow sits at zero. Estimated values SHALL be drawn and described exactly like measured ones: no dashed stretches, no estimate labels and no notes about estimates. Missing values SHALL appear as breaks, not drops to zero.

#### Scenario: Charging through an outage
- **WHEN** a car charged through a 20 minute outage that the day's data fills with estimates
- **THEN** the Vehicle chart is continuous and solid through it, and the view says nothing about estimates

#### Scenario: Solar overnight
- **WHEN** solar is zero from 7 PM to 6 AM
- **THEN** no solar outline is drawn along zero overnight

### Requirement: Chart details
Pointing at a chart, or touching it, SHALL show the time of the nearest 5 minute step, like "2:45 PM", and each shown flow's power in kW at that step.

#### Scenario: Midday on the Solar view
- **WHEN** a visitor points at 12:30 PM on October 14, 2026's Solar view
- **THEN** the details show 12:30 PM, Home 1.39 kW and Powerwall 5.62 kW, with Vehicle and Grid at 0 kW

### Requirement: Intraday layout on wide screens
On windows 1280 pixels wide or more, each view SHALL show its headline and chart (and, for the Powerwall view, its charge level) in a left column and its breakdowns in a right column, with the view selector spanning both. The chart's height SHALL follow its width at about 4 to 3, at most about 70% of the window's height. Narrower windows SHALL stack one column.

#### Scenario: Desktop window
- **WHEN** a visitor opens a day's Home view in a 1440 pixel wide window
- **THEN** the breakdown sits to the right of the chart, and the chart is no more than about one and a half times as wide as it is tall

#### Scenario: Short laptop window
- **WHEN** the window is 1440 pixels wide and 700 pixels tall
- **THEN** the chart is no taller than about 490 pixels

#### Scenario: Phone
- **WHEN** a visitor opens a day on a 375 pixel wide screen
- **THEN** the day controls, view selector, headline, chart and breakdowns are stacked in one column

### Requirement: Moving between days
The day view SHALL have previous-day and next-day controls around the day's date, which opens a calendar of the days from 2021-10-10 to today. The left and right arrow keys SHALL step a day too. Stepping SHALL cross the range's edges, with no previous day before 2021-10-10 and no next day after today.

#### Scenario: Next day
- **WHEN** a visitor on October 14, 2026's Grid view selects the next day
- **THEN** October 15's day view is shown in the same view, and the address's `day` is 2026-10-15 with the range unchanged

#### Scenario: Past the range
- **WHEN** a visitor showing October 2026 steps forward from October 31
- **THEN** November 1's day view is shown, and the range in the address is still October 2026

#### Scenario: Today
- **WHEN** the day view shows today
- **THEN** the next-day control is unavailable and the right arrow key does nothing

#### Scenario: Typing in the calendar
- **WHEN** keyboard focus is in the calendar and the visitor presses the right arrow key
- **THEN** the calendar's focus moves and the shown day does not change

### Requirement: Days strip
The day view SHALL show a strip of days, each with a small bar of its solar generated, the shown day marked, and each selectable to open it. The strip SHALL hold the range's days when the range has daily bars and contains the shown day, and the shown day's calendar month otherwise.

#### Scenario: Within the range
- **WHEN** a visitor showing October 2026 opens October 14
- **THEN** the strip shows October 1 to 31 with October 14 marked

#### Scenario: Jumping
- **WHEN** the visitor selects October 3 in the strip
- **THEN** October 3's day view is shown

#### Scenario: Outside the range
- **WHEN** the visitor has stepped from October 31 to November 1
- **THEN** the strip shows November's days to date with November 1 marked

### Requirement: Returning to the range
The day view SHALL have a control that returns to the range view with the same range, labeled with the range: the month and year when the range is one whole calendar month, its dates otherwise. Moving between days SHALL NOT add browser history entries, so the browser's back button also returns to the range.

#### Scenario: Back to the month
- **WHEN** a visitor opened October 14 from October 2026, stepped to October 20, and selects "October 2026"
- **THEN** the range view of October 2026 is shown

#### Scenario: Browser back
- **WHEN** a visitor opened October 14 from October 2026, stepped through three days, and presses the browser's back button
- **THEN** the range view of October 2026 is shown

### Requirement: Last updated time
When the shown day is today, the day view SHALL show the time of the latest live update, like "Last updated at 11:47 AM". Other days SHALL NOT show it.

#### Scenario: Today
- **WHEN** a visitor opens today's day view and the latest live update arrived at 11:47 AM
- **THEN** the view shows "Last updated at 11:47 AM"

### Requirement: The open day stays current
When a `totals` event arrives on the live stream for the shown day, or for a day in the days strip, the page SHALL reload its data without reloading the page. Events for other days SHALL NOT reload it.

#### Scenario: Watching today
- **WHEN** today's day view is open and a `totals` event arrives for today
- **THEN** the chart shows the newly published interval

### Requirement: The day view shows the latest chosen day
The day view SHALL show the day most recently chosen. A day chosen earlier whose data arrives later SHALL NOT replace it, and a failed load SHALL leave the view as it was.

#### Scenario: Stepping quickly
- **WHEN** a visitor steps from October 14 to 15 to 16 before October 15's data arrives, and October 15's data arrives last
- **THEN** the day view shows October 16
