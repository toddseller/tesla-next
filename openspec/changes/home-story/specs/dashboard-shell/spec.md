# Spec Delta

## MODIFIED Requirements

### Requirement: Navigation among the pages
Every page SHALL have a top bar with the site's icon and name, "Tesla Solar Report", linking to `/`, and the seven pages as links in this order: Home (`/`), Solar (`/solar`), Impact (`/impact`), Distribution (`/distribution`), True-Up (`/true-up`), Top Ten (`/top`) and Patterns (`/patterns`). In a window narrower than 640 pixels the links SHALL be in the page menu instead of on the bar. The current page's link SHALL be marked for sight, with a red underline, and for assistive technology, as the current page.

#### Scenario: Moving between pages
- **WHEN** a viewer on `/` chooses "Impact" in the top bar
- **THEN** `/impact` opens without a full page reload, and "Impact" is marked as the current page while "Home" is not

#### Scenario: The Solar page
- **WHEN** a viewer opens `/solar?start=2026-10-01&end=2026-10-31`
- **THEN** the page loads with "Solar" marked as the current page and "Home" not

#### Scenario: Opening a page directly
- **WHEN** a viewer opens `/true-up` from a bookmark
- **THEN** the page loads with "True-Up" marked as the current page

#### Scenario: A screen reader
- **WHEN** a screen reader lists the page's navigation
- **THEN** it finds a navigation landmark with the seven links, and announces the current one as the current page

#### Scenario: A screen reader on a phone
- **WHEN** a screen reader lists the navigation of a page in a 390-pixel-wide window
- **THEN** it finds a navigation landmark holding the Pages button, and once opened, the seven links with the current one announced as the current page

### Requirement: The frame fits any screen
At any window width from 320 pixels up, every page's frame SHALL fit the window with no sideways scrolling. From 640 pixels up, the top bar's links and its live status SHALL wrap onto more lines rather than overflow; below 640 pixels the brand and the page menu's button SHALL share one row, with the live status under them. Each link and the page menu's button SHALL be at least 44 pixels tall so it can be tapped.

#### Scenario: A phone
- **WHEN** a viewer opens the site on a 390 pixel wide screen
- **THEN** the top bar shows the name and the Pages button on one row and the live status under them, with no page links, and nothing scrolls sideways

#### Scenario: The narrowest window
- **WHEN** a viewer opens the site in a 320 pixel wide window
- **THEN** the name and the Pages button still share one row

#### Scenario: A wide window
- **WHEN** a viewer opens the site in a 1512 pixel wide window
- **THEN** the top bar holds the name, all seven links and the live status on one line, and the page's content is centered at no more than 1200 pixels wide

### Requirement: The page menu on a phone
In a window narrower than 640 pixels, the top bar SHALL end its brand row with a 44-pixel square button of three bars, named "Pages" for assistive technology and reporting whether its menu is open. It SHALL open a menu of the seven page links in their order, the current one marked. Choosing a page, tapping outside the menu or pressing Escape SHALL close it.

#### Scenario: Opening the menu
- **WHEN** a viewer on Impact, on a 390 pixel wide screen, taps the Pages button
- **THEN** a menu lists Home, Solar, Impact, Distribution, True-Up, Top Ten and Patterns, each at least 44 pixels tall, with Impact underlined in red and marked as the current page

#### Scenario: Closing without choosing
- **WHEN** the menu is open and the viewer taps outside it or presses Escape
- **THEN** the menu closes and the page stays as it was

#### Scenario: A wide window
- **WHEN** a viewer opens the site in a 640 pixel wide window
- **THEN** the top bar shows the seven links and no Pages button

### Requirement: The live pill in a narrower window
In a window narrower than 1440 pixels, the live pill SHALL leave out solar and home and read the Powerwall part alone. On a phone the whole pill doesn't fit the row under the brand, and below 1440 pixels it would push the seven page links onto a second row.

#### Scenario: A phone at midday
- **WHEN** a viewer opens a page on a 390 pixel wide screen while a status reports 6.2 kW of solar, 1.4 kW of home use, 92% and Charging
- **THEN** the top bar reads LIVE with the time and PW 92% · CHARGING, with no SOLAR or HOME, and nothing scrolls sideways

#### Scenario: A 1280 pixel laptop
- **WHEN** the same status shows in a 1280 pixel wide window
- **THEN** the pill reads PW 92% · CHARGING alone, and the seven links stay on one row as before

#### Scenario: A wide window
- **WHEN** the same status shows in a 1366 pixel wide window
- **THEN** the pill reads PW 92% · CHARGING alone, and the seven links stay on one row

#### Scenario: A 1440 pixel window
- **WHEN** the same status shows in a 1440 pixel wide window
- **THEN** the pill reads SOLAR 6.2 kW · HOME 1.4 kW · PW 92% · CHARGING, on one line with the name and the seven links
