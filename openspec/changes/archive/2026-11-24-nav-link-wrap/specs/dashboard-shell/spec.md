## MODIFIED Requirements

### Requirement: The frame fits any screen
At any window width from 320 pixels up, every page's frame SHALL fit the window with no sideways scrolling. From 640 pixels up, the top bar's seven links SHALL stay on one row with each link's name on one line, the live status taking a row of its own when it doesn't fit beside them; below 640 pixels the brand and the page menu's button SHALL share one row, with the live status under them. Each link and the page menu's button SHALL be at least 44 pixels tall so it can be tapped.

#### Scenario: A phone
- **WHEN** a viewer opens the site on a 390 pixel wide screen
- **THEN** the top bar shows the name and the Pages button on one row and the live status under them, with no page links, and nothing scrolls sideways

#### Scenario: The narrowest window
- **WHEN** a viewer opens the site in a 320 pixel wide window
- **THEN** the name and the Pages button still share one row

#### Scenario: A wide window
- **WHEN** a viewer opens the site in a 1512 pixel wide window
- **THEN** the top bar holds the name, all seven links and the live status on one line, and the page's content is centered at no more than 1200 pixels wide

#### Scenario: A laptop window
- **WHEN** a viewer opens the site in a 1024 pixel wide window
- **THEN** the name and all seven links share one row, and the live status is on the row under them

#### Scenario: A 1440 window during a storm watch
- **WHEN** a viewer opens the site in a 1440 pixel wide window while the top bar shows STORM WATCH and the SOLAR and HOME readings
- **THEN** every link's name, "True-Up" and "Top Ten" included, is on one line, the name and all seven links share one row, and the live status is on the row under them

#### Scenario: A tablet window
- **WHEN** a viewer opens the site in a 768 pixel wide window
- **THEN** all seven links share one row with each name on one line, and nothing scrolls sideways
