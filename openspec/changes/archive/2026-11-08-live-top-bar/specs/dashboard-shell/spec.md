# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: The frame fits any screen
At any window width from 320 pixels up, every page's frame SHALL fit the window with no sideways scrolling. The top bar's links and its live status SHALL wrap onto more lines rather than overflow, and each link SHALL be at least 44 pixels tall so it can be tapped.

#### Scenario: A phone
- **WHEN** a viewer opens the site on a 390 pixel wide screen
- **THEN** all five links and the live status are visible without scrolling sideways, and each link is at least 44 pixels tall

#### Scenario: A wide window
- **WHEN** a viewer opens the site in a 1512 pixel wide window
- **THEN** the top bar holds the name, all five links and the live status on one line, and the page's content is centered at no more than 1200 pixels wide
