# Spec Delta

## MODIFIED Requirements

### Requirement: The range is in the address
The Solar page (`/solar`) SHALL show the range given by its `start` and `end` parameters, each a `YYYY-MM-DD` date in the site's time zone, rendered on the server with its data. Each tab SHALL keep its own range, and opening the same address SHALL show the same range.

#### Scenario: A shared link
- **WHEN** a visitor opens `/solar?start=2026-03-01&end=2026-03-31`
- **THEN** the page shows March 2026, with its bars in the first response

#### Scenario: Two tabs
- **WHEN** a visitor shows March 2026 in one tab and January 2026 in another, and a totals update arrives for today
- **THEN** each tab keeps its own range

### Requirement: Default and invalid ranges
When `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL show the current month in the site's time zone, from its first to its last day.

#### Scenario: No range
- **WHEN** a visitor opens `/solar` on 2026-11-07
- **THEN** the page shows November 1 to 30, 2026

#### Scenario: A malformed range
- **WHEN** a visitor opens `/solar?start=nope&end=2026-10-31` on 2026-11-07
- **THEN** the page shows November 2026, with no error

#### Scenario: A range before the site existed
- **WHEN** a visitor opens `/solar?start=1900-01-01&end=2026-10-31`
- **THEN** the page shows the current month

### Requirement: Opening a day
Clicking a daily bar SHALL open that day's day view, adding the day to the address and keeping the range. Clicking a period bar SHALL show that period's daily bars, its first and last day becoming the range in the address as a new entry in the browser's history.

#### Scenario: Open a day
- **WHEN** a visitor showing October 2026 clicks the bar for October 14
- **THEN** the address becomes `/solar?start=2026-10-01&end=2026-10-31&day=2026-10-14` and the day view for October 14 is shown

#### Scenario: Monthly bars
- **WHEN** a visitor showing the true-up year 2026-10-01 to 2027-09-30 clicks the bar for October 2026
- **THEN** the address becomes `/solar?start=2026-10-01&end=2026-10-31` and October 2026's daily bars are shown, each opening its day

#### Scenario: Open a month-long period
- **WHEN** a visitor showing 2026-01-15 to 2026-06-14 clicks the second bar
- **THEN** the address becomes `/solar?start=2026-02-15&end=2026-03-14` and that period's daily bars are shown

#### Scenario: A partial first month
- **WHEN** a visitor showing 2026-01-15 to 2026-06-30 clicks the first bar
- **THEN** the address becomes `/solar?start=2026-01-15&end=2026-01-31`

#### Scenario: Back to the year
- **WHEN** a visitor opened October 2026 from the true-up year and goes back in the browser
- **THEN** the true-up year's monthly bars are shown again

## ADDED Requirements

### Requirement: Old Solar addresses keep working
A request for `/` with any of `start`, `end`, `day` or `readings` in its query SHALL be redirected permanently to `/solar` with the same query, so links and bookmarks made before the Solar page moved show the same view. `/` with none of them SHALL show the home page.

#### Scenario: An old shared day
- **WHEN** a visitor opens `/?start=2026-10-01&end=2026-10-31&day=2026-10-14`
- **THEN** they are redirected permanently to `/solar?start=2026-10-01&end=2026-10-31&day=2026-10-14`, which shows October 14

#### Scenario: An old readings link
- **WHEN** a visitor opens `/?readings=tesla`
- **THEN** they are redirected permanently to `/solar?readings=tesla`

#### Scenario: The home page
- **WHEN** a visitor opens `/` with no query
- **THEN** the home page opens, with no redirect
