## MODIFIED Requirements

### Requirement: The frame fits any screen
At any window width from 320 pixels up, every page's frame SHALL fit the window with no sideways scrolling. From 640 pixels up, the top bar's seven links SHALL stay on one row, the live status taking a row of its own when it doesn't fit beside them; below 640 pixels the brand and the page menu's button SHALL share one row, with the live status under them. Each link and the page menu's button SHALL be at least 44 pixels tall so it can be tapped.

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

### Requirement: Footer
Every page SHALL end with a footer linking the seven pages by their top bar names, the current one marked, and reading "© <current year> teslasolar.report".

#### Scenario: The footer's year
- **WHEN** a page is opened in 2027
- **THEN** its footer reads "© 2027 teslasolar.report"

#### Scenario: The footer's links
- **WHEN** a visitor reaches the end of any page
- **THEN** the footer links Home, Solar, Impact, Distribution, True-Up, Top Ten and Patterns

## ADDED Requirements

### Requirement: Keyboard use
Every page SHALL begin with a "Skip to content" link, shown when it has keyboard focus, that moves focus to the page's main content. Every link, button and focusable chart SHALL show a 2 pixel focus ring in the ring color at full strength when focused from the keyboard.

#### Scenario: Skipping the top bar
- **WHEN** a keyboard user opens a page and presses Tab, then Enter
- **THEN** "Skip to content" shows on the first Tab, and Enter moves focus past the top bar to the main content

#### Scenario: A visible focus
- **WHEN** a keyboard user tabs to a top bar link
- **THEN** a solid 2 pixel ring in the ring color surrounds it
