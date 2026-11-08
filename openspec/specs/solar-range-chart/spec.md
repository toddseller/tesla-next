# solar-range-chart Specification

## Purpose
Shows the site's solar, grid and house energy over any date range as a bar chart, keeps the range in the page's address, and opens any day of it in the day view.

## Requirements

### Requirement: The range is in the address
The Solar page (`/`) SHALL show the range given by its `start` and `end` parameters, each a `YYYY-MM-DD` date in the site's time zone, rendered on the server with its data. Each tab SHALL keep its own range, and opening the same address SHALL show the same range.

#### Scenario: A shared link
- **WHEN** a visitor opens `/?start=2026-03-01&end=2026-03-31`
- **THEN** the page shows March 2026, with its bars in the first response

#### Scenario: Two tabs
- **WHEN** a visitor shows March 2026 in one tab and January 2026 in another, and a totals update arrives for today
- **THEN** each tab keeps its own range

### Requirement: Default and invalid ranges
When `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL show the current month in the site's time zone, from its first to its last day.

#### Scenario: No range
- **WHEN** a visitor opens `/` on 2026-11-07
- **THEN** the page shows November 1 to 30, 2026

#### Scenario: A malformed range
- **WHEN** a visitor opens `/?start=nope&end=2026-10-31` on 2026-11-07
- **THEN** the page shows November 2026, with no error

#### Scenario: A range before the site existed
- **WHEN** a visitor opens `/?start=1900-01-01&end=2026-10-31`
- **THEN** the page shows the current month

### Requirement: Range presets
The page SHALL offer three presets, each changing the address to its range: This month (the current month), This year (January 1 to December 31 of the current year) and True-up year (October 1 to September 30 of the true-up year containing today), all in the site's time zone. A preset matching the shown range SHALL be marked as selected.

#### Scenario: True-up year in November
- **WHEN** a visitor picks True-up year on 2026-11-07
- **THEN** the page shows 2026-10-01 to 2027-09-30, and True-up year is marked as selected

#### Scenario: True-up year on its last day
- **WHEN** a visitor picks True-up year on 2026-09-30
- **THEN** the page shows 2025-10-01 to 2026-09-30

#### Scenario: Late in the evening
- **WHEN** a visitor whose computer is in New York picks This month at 1:00 AM on 2026-12-01 there, which is still November 30 at the site
- **THEN** the page shows November 2026

### Requirement: Custom range picker
The page SHALL offer a date-range picker showing the current range, from which a visitor picks a start and an end day. It SHALL offer no day before 2021-10-10, the site's first day of service, and none more than two years after the visitor's today.

#### Scenario: Picking a range
- **WHEN** a visitor picks October 10 and October 20, 2026
- **THEN** the page shows 2026-10-10 to 2026-10-20

#### Scenario: Far future
- **WHEN** a visitor opens the picker on 2026-11-07
- **THEN** days after 2028-11-07 can't be picked

### Requirement: Daily and monthly bars
When the range's end is at most 31 days after its start, the chart SHALL show one bar per day with saved totals, labeled like "Oct 14". Longer ranges SHALL show one bar per period, cut as Flask's `/api/v2/formatted` cuts them, labeled with the period's first month and year, like "Oct 2025".

#### Scenario: A month
- **WHEN** the page shows October 2026, whose 31 days all have totals
- **THEN** the chart has 31 bars, Oct 1 to Oct 31

#### Scenario: A day without totals
- **WHEN** the range is 2021-10-01 to 2021-10-31, and the first saved day is October 10
- **THEN** the first bar is Oct 10

#### Scenario: Calendar months
- **WHEN** the range is 2026-01-15 to 2026-06-30
- **THEN** the chart has six bars, for January 15 to 31 and then February through June

#### Scenario: Month-long periods
- **WHEN** the range is 2026-01-15 to 2026-06-14
- **THEN** the chart has five bars, January 15 to February 14 through May 15 to June 14

### Requirement: Bar values
Each bar SHALL show its period's solar generated, grid (imported minus exported, below zero when more was exported) and house use, in kWh to one decimal place, equal to Flask's `/api/v2/formatted` for the same range. The bar SHALL stack solar, positive grid and house from zero upward, with negative grid below zero.

#### Scenario: A day that exported more than it imported
- **WHEN** October 14, 2026 generated 44.4 kWh, used 34.0 kWh in the house, and exported 8.3 kWh more than it imported
- **THEN** its bar stacks 44.4 kWh of solar and 34.0 kWh of house above zero, and 8.3 kWh of grid below

#### Scenario: Meter-corrected days
- **WHEN** a range includes days whose grid totals Flask takes from PG&E's meter
- **THEN** the bars' grid values equal Flask's for that range

### Requirement: Bar shape and labels
Each bar SHALL round only the outer ends of its stack, its top and its bottom. Flows SHALL take their colors as the dashboard shell sets them, with a legend naming Solar, Grid and House, a note that grid below zero means more was sent to the grid than taken from it, and the value axis labeled in kWh.

#### Scenario: A stacked bar
- **WHEN** a bar has solar, grid and house above zero
- **THEN** only the top of the house section and the bottom of the solar section are rounded

#### Scenario: Grid below zero
- **WHEN** a bar's grid is below zero
- **THEN** the bottom of the grid section is rounded and the solar section's bottom, at zero, is square

### Requirement: Bar details
Pointing at a bar, or tapping it on a touch screen, SHALL show its label and its solar, grid and house values. A daily bar's details SHALL also say that clicking opens the day, and a period bar's that clicking shows its days.

#### Scenario: Pointing at a day
- **WHEN** a visitor points at the bar for October 14, 2026
- **THEN** the details show Solar 44.4 kWh, Grid -8.3 kWh, House 34.0 kWh and that clicking opens the day

#### Scenario: Pointing at a month
- **WHEN** a visitor showing the 2026-2027 true-up year points at the bar for October 2026
- **THEN** the details show its solar, grid and house values and that clicking shows its days

### Requirement: Opening a day
Clicking a daily bar SHALL open that day's day view, adding the day to the address and keeping the range. Clicking a period bar SHALL show that period's daily bars, its first and last day becoming the range in the address as a new entry in the browser's history.

#### Scenario: Open a day
- **WHEN** a visitor showing October 2026 clicks the bar for October 14
- **THEN** the address becomes `/?start=2026-10-01&end=2026-10-31&day=2026-10-14` and the day view for October 14 is shown

#### Scenario: Monthly bars
- **WHEN** a visitor showing the true-up year 2026-10-01 to 2027-09-30 clicks the bar for October 2026
- **THEN** the address becomes `/?start=2026-10-01&end=2026-10-31` and October 2026's daily bars are shown, each opening its day

#### Scenario: Open a month-long period
- **WHEN** a visitor showing 2026-01-15 to 2026-06-14 clicks the second bar
- **THEN** the address becomes `/?start=2026-02-15&end=2026-03-14` and that period's daily bars are shown

#### Scenario: A partial first month
- **WHEN** a visitor showing 2026-01-15 to 2026-06-30 clicks the first bar
- **THEN** the address becomes `/?start=2026-01-15&end=2026-01-31`

#### Scenario: Back to the year
- **WHEN** a visitor opened October 2026 from the true-up year and goes back in the browser
- **THEN** the true-up year's monthly bars are shown again

### Requirement: The range stays current
When a `totals` event arrives on the live stream for a day inside the shown range, the page SHALL reload its data without reloading the page. Events for days outside the range SHALL NOT reload it.

#### Scenario: Viewing the current month
- **WHEN** the page shows the current month and a `totals` event arrives for today
- **THEN** the bars update in place

#### Scenario: Viewing a past range
- **WHEN** the page shows March 2026 and a `totals` event arrives for 2026-10-17
- **THEN** the page does not reload its data

### Requirement: Updates missed while disconnected are recovered
When the page's live stream opens again after it was lost, the page SHALL reload its data if the shown range includes today.

#### Scenario: Laptop wakes from sleep
- **WHEN** a page showing the current month was disconnected for 20 minutes and its stream opens again
- **THEN** the bars update without a page reload

### Requirement: Failed reloads keep the shown data
When reloading the page's data fails, the page SHALL keep showing the data it had, with no error shown.

#### Scenario: Server error on reload
- **WHEN** the page shows October 2026 and a reload after a `totals` event fails
- **THEN** the October 2026 bars stay as they were

### Requirement: Range data matches Flask's
`GET /api/range?start_date=&end_date=` SHALL answer with status 200 and `{"data": [...]}`, whose items have the same `date`, `day`, `solar`, `grid` and `house` as Flask's `/api/v2/formatted` for every range from 2021-10-01 to 732 days after today, until change 7 (cutover) retires it. Other requests SHALL get status 400 and a message.

#### Scenario: Any valid range
- **WHEN** a script requests the same range from `/api/range` and from Flask's `/api/v2/formatted`
- **THEN** every item's `date`, `day`, `solar`, `grid` and `house` are equal

#### Scenario: A malformed date
- **WHEN** a client requests `/api/range?start_date=nope&end_date=2026-01-31`
- **THEN** the response is 400 with a message, and no data is queried

#### Scenario: A range before the site existed
- **WHEN** a client requests `/api/range?start_date=1900-01-01&end_date=2026-10-31`
- **THEN** the response is 400 and its message names 2021-10-01
