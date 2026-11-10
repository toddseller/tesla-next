# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Navigation among the five pages`
- TO: `### Requirement: Navigation among the pages`

## MODIFIED Requirements

### Requirement: Navigation among the pages
Every page SHALL have a top bar with the site's icon and name, "Tesla Solar Report", linking to `/`, and the six pages as links in this order: Solar (`/`), Impact (`/impact`), Distribution (`/distribution`), True-Up (`/true-up`), Top Ten (`/top`) and Health (`/health`). The current page's link SHALL be marked for sight, with a red underline, and for assistive technology, as the current page.

#### Scenario: Moving between pages
- **WHEN** a viewer on `/` chooses "Impact" in the top bar
- **THEN** `/impact` opens without a full page reload, and "Impact" is marked as the current page while "Solar" is not

#### Scenario: Opening a page directly
- **WHEN** a viewer opens `/true-up` from a bookmark
- **THEN** the page loads with "True-Up" marked as the current page

#### Scenario: A screen reader
- **WHEN** a screen reader lists the page's navigation
- **THEN** it finds a navigation landmark with the six links, and announces the current one as the current page

### Requirement: The frame fits any screen
At any window width from 320 pixels up, every page's frame SHALL fit the window with no sideways scrolling. The top bar's links and its live status SHALL wrap onto more lines rather than overflow, and each link SHALL be at least 44 pixels tall so it can be tapped.

#### Scenario: A phone
- **WHEN** a viewer opens the site on a 390 pixel wide screen
- **THEN** all six links and the live status are visible without scrolling sideways, and each link is at least 44 pixels tall

#### Scenario: A wide window
- **WHEN** a viewer opens the site in a 1512 pixel wide window
- **THEN** the top bar holds the name, all six links and the live status on one line, and the page's content is centered at no more than 1200 pixels wide
