# dashboard-shell Specification

## Purpose

The frame and design system every dashboard page shares: navigation among the five pages, how the frame fits any screen, the colors and type, and the footer.

## Requirements

### Requirement: Navigation among the five pages
Every page SHALL have a top bar with the site's icon and name, "Tesla Solar Report", linking to `/`, and the five pages as links in this order: Solar (`/`), Impact (`/impact`), Distribution (`/distribution`), True-Up (`/true-up`) and Top Ten (`/top`). The current page's link SHALL be marked for sight, with a red underline, and for assistive technology, as the current page.

#### Scenario: Moving between pages
- **WHEN** a viewer on `/` chooses "Impact" in the top bar
- **THEN** `/impact` opens without a full page reload, and "Impact" is marked as the current page while "Solar" is not

#### Scenario: Opening a page directly
- **WHEN** a viewer opens `/true-up` from a bookmark
- **THEN** the page loads with "True-Up" marked as the current page

#### Scenario: A screen reader
- **WHEN** a screen reader lists the page's navigation
- **THEN** it finds a navigation landmark with the five links, and announces the current one as the current page

### Requirement: The frame fits any screen
At any window width from 320 pixels up, every page's frame SHALL fit the window with no sideways scrolling. The top bar's links and its live status SHALL wrap onto more lines rather than overflow, and each link SHALL be at least 44 pixels tall so it can be tapped.

#### Scenario: A phone
- **WHEN** a viewer opens the site on a 390 pixel wide screen
- **THEN** all five links and the live status are visible without scrolling sideways, and each link is at least 44 pixels tall

#### Scenario: A wide window
- **WHEN** a viewer opens the site in a 1512 pixel wide window
- **THEN** the top bar holds the name, all five links and the live status on one line, and the page's content is centered at no more than 1200 pixels wide

### Requirement: The dashboard's design system
Every page SHALL use one dark design system: a near-black background (`#0E1116`), raised panels (`#151A21`) with a fine border (`#232831`), light text (`#E6E8EB`) and muted gray labels (`#9AA3AD`). Text SHALL be set in IBM Plex Sans and figures in IBM Plex Mono, both served by the site itself. Tesla red (`#E82127`) SHALL mark the current page and indicators, and SHALL NOT be used for text smaller than 24 pixels, because it falls short of 4.5:1 contrast on the background.

#### Scenario: Fonts load from the site
- **WHEN** any page loads
- **THEN** its text is IBM Plex Sans, its figures IBM Plex Mono, and the browser makes no request to fonts.googleapis.com or fonts.gstatic.com

#### Scenario: Text is readable
- **WHEN** any text on a page is checked against its background
- **THEN** it has at least 4.5:1 contrast, or at least 3:1 when it is 24 pixels or larger

### Requirement: The site's icon
The site's icon SHALL be the current site's: the Tesla "T" on an orange disc that stands for the sun, always in its own colors, never recolored to the accent or a theme. It SHALL be the browser tab's icon, the home-screen icon on phones, and the icon beside the site's name in the top bar.

#### Scenario: Browser tab
- **WHEN** any page is open in a browser tab
- **THEN** the tab shows the orange disc with the white "T"

#### Scenario: Added to a phone's home screen
- **WHEN** a viewer adds the site to an iPhone's or Android phone's home screen
- **THEN** the shortcut uses the same icon, at the size each phone asks for

### Requirement: One color per energy flow
Wherever a page shows energy by flow, each flow SHALL keep one color, the Tesla app's colors that anton-tesla-api-ws's day views use: solar amber (`#F7B500`), home blue (`#3E6AE1`), Powerwall green (`#31B76B`), grid gray (`#8E8E93`) and vehicle red (`#E8474F`). Filled areas use the same colors, translucent. The Distribution page's house scene keeps its own styling.

#### Scenario: The same flow on two pages
- **WHEN** a viewer sees solar on one page and then on another
- **THEN** it is amber on both

#### Scenario: The house on the Solar page
- **WHEN** a viewer sees house use in the range chart and home use in the day view
- **THEN** both are the same blue, `#3E6AE1`

### Requirement: Footer
Every page SHALL end with a footer reading "© <current year> teslasolar.report".

#### Scenario: The footer's year
- **WHEN** a page is opened in 2027
- **THEN** its footer reads "© 2027 teslasolar.report"

### Requirement: The True-Up Tracker's old address
`/numbers`, the True-Up Tracker's address on teslasolar.report before it was renamed, SHALL redirect permanently to `/true-up`, so old bookmarks open the True-Up Tracker.

#### Scenario: An old bookmark
- **WHEN** a viewer opens `/numbers`
- **THEN** the response is a permanent redirect to `/true-up`, and the True-Up Tracker opens with "True-Up" marked as the current page

### Requirement: Live status in the top bar
Every page's top bar SHALL end with the live status: a dot, "LIVE" and the time of the latest live status in the site's time zone, like "9:59 AM", and a pill reading "PW", the Powerwalls' charge and their state as anton reports it, like "PW 92% · CHARGING". It SHALL update with each live status, about every 10 seconds, without reloading the page.

#### Scenario: Charging at midday
- **WHEN** the latest live status, from 9:59 AM, reports the Powerwalls at 92% and Charging
- **THEN** the top bar on every page reads LIVE 9:59 AM and PW 92% · CHARGING, with the dot in the Powerwall color

#### Scenario: A new status arrives
- **WHEN** a status from 10:00 AM reports 93% and Charging while a viewer is on the Top Ten page
- **THEN** the top bar reads LIVE 10:00 AM and PW 93% · CHARGING, with no reload

### Requirement: A stale or missing live status
When the latest live status is two minutes old or more, as the Distribution page counts it stale, the top bar SHALL turn the dot gray and read "LAST" in place of "LIVE", keeping the time and pill of the last status received, until a status arrives. Before any live status is known, the time, the charge and the state SHALL show dashes.

#### Scenario: Flask stops polling
- **WHEN** the last status, from 9:59 AM, is more than two minutes old
- **THEN** the top bar reads LAST 9:59 AM with a gray dot and the pill as it was, and turns back to LIVE with the next status

#### Scenario: Right after a deploy
- **WHEN** a page is opened before the server has received a live status
- **THEN** the top bar shows dashes for the time, the charge and the state, and fills them in with the first status

### Requirement: Off grid and storm watch in the top bar
The top bar's live status SHALL add a pill before the Powerwall pill while the latest live status reports the site off the grid or in storm watch: "OFF GRID TEST" for `off_grid_intentional`; "OFF GRID" for any other island status starting `off_grid`, followed by "SINCE" and the time the current stretch began when the server holds an off-grid stretch; and "STORM WATCH" while storm watch is active and the site is on the grid. Otherwise there SHALL be no added pill.

#### Scenario: An outage with its stretch stored
- **WHEN** the latest status reports `off_grid_unintentional` and the current stretch is `off_grid_unintentional` from 6:25 AM
- **THEN** the top bar reads OFF GRID SINCE 6:25 AM beside the Powerwall pill

#### Scenario: An outage in its first minutes
- **WHEN** the latest status reports `off_grid_unintentional` and the current stretch is still `on_grid`, not yet stored by anton
- **THEN** the top bar reads OFF GRID, with no time

#### Scenario: A test
- **WHEN** the latest status reports `off_grid_intentional`
- **THEN** the top bar reads OFF GRID TEST

#### Scenario: Storm watch
- **WHEN** the latest status reports `on_grid` and storm watch active
- **THEN** the top bar reads STORM WATCH beside the Powerwall pill

#### Scenario: An outage during storm watch
- **WHEN** the latest status reports `off_grid_unintentional` and storm watch active
- **THEN** the top bar reads OFF GRID and not STORM WATCH

#### Scenario: On the grid
- **WHEN** the latest status reports `on_grid` without storm watch, or has neither field
- **THEN** the top bar shows only the Powerwall pill

#### Scenario: A stale status
- **WHEN** the last status, more than two minutes old, reported `off_grid_unintentional`
- **THEN** the top bar reads LAST with a gray dot and keeps the OFF GRID pill, as it keeps the Powerwall pill
