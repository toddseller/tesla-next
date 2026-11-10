# Spec Delta

## MODIFIED Requirements

### Requirement: Navigation among the pages
Every page SHALL have a top bar with the site's icon and name, "Tesla Solar Report", linking to `/`, and the six pages as links in this order: Solar (`/`), Impact (`/impact`), Distribution (`/distribution`), True-Up (`/true-up`), Top Ten (`/top`) and Patterns (`/patterns`). The current page's link SHALL be marked for sight, with a red underline, and for assistive technology, as the current page.

#### Scenario: Moving between pages
- **WHEN** a viewer on `/` chooses "Impact" in the top bar
- **THEN** `/impact` opens without a full page reload, and "Impact" is marked as the current page while "Solar" is not

#### Scenario: Opening a page directly
- **WHEN** a viewer opens `/true-up` from a bookmark
- **THEN** the page loads with "True-Up" marked as the current page

#### Scenario: A screen reader
- **WHEN** a screen reader lists the page's navigation
- **THEN** it finds a navigation landmark with the six links, and announces the current one as the current page

## ADDED Requirements

### Requirement: The Patterns page's old address
`/health`, the Patterns page's address before it was renamed, SHALL redirect permanently to `/patterns`, so old bookmarks open the Patterns page.

#### Scenario: An old bookmark
- **WHEN** a viewer opens `/health`
- **THEN** the response is a permanent redirect to `/patterns`, and the Patterns page opens with "Patterns" marked as the current page
