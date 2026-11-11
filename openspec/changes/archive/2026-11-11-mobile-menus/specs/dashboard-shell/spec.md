# Spec Delta

## MODIFIED Requirements

### Requirement: Navigation among the pages
Every page SHALL have a top bar with the site's icon and name, "Tesla Solar Report", linking to `/`, and the six pages as links in this order: Solar (`/`), Impact (`/impact`), Distribution (`/distribution`), True-Up (`/true-up`), Top Ten (`/top`) and Patterns (`/patterns`). In a window narrower than 640 pixels the links SHALL be in the page menu instead of on the bar. The current page's link SHALL be marked for sight, with a red underline, and for assistive technology, as the current page.

#### Scenario: Moving between pages
- **WHEN** a viewer on `/` chooses "Impact" in the top bar
- **THEN** `/impact` opens without a full page reload, and "Impact" is marked as the current page while "Solar" is not

#### Scenario: Opening a page directly
- **WHEN** a viewer opens `/true-up` from a bookmark
- **THEN** the page loads with "True-Up" marked as the current page

#### Scenario: A screen reader
- **WHEN** a screen reader lists the page's navigation
- **THEN** it finds a navigation landmark with the six links, and announces the current one as the current page

#### Scenario: A screen reader on a phone
- **WHEN** a screen reader lists the navigation of a page in a 390-pixel-wide window
- **THEN** it finds a navigation landmark holding the Pages button, and once opened, the six links with the current one announced as the current page

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
- **THEN** the top bar holds the name, all six links and the live status on one line, and the page's content is centered at no more than 1200 pixels wide

### Requirement: The clicked tab shows at once
When a viewer chooses another page in the top bar, its link SHALL brighten at once, while the page loads. The current page's red underline and its marking for assistive technology SHALL stay on the old page's link until the new page arrives. A choice made in the page menu SHALL close the menu at once.

#### Scenario: A slow page
- **WHEN** a viewer on `/` chooses "True-Up" and the page takes 0.4 s to arrive
- **THEN** "True-Up" brightens on the click, and "Solar" keeps the underline and stays marked as the current page until True-Up arrives

#### Scenario: From the page menu
- **WHEN** a viewer on a phone opens the page menu and chooses "True-Up"
- **THEN** the menu closes on the choice, and True-Up's page replaces Solar's when it arrives

### Requirement: The highlight and the page move together
When the new page arrives, the current page's highlight SHALL glide from the old link to the new one in 250 ms. In the same pass, the old content SHALL leave 24 px against the direction of travel in 150 ms, and the new content SHALL come in from the far side in 250 ms. The direction SHALL follow the tabs' order. The top bar, with its live status, SHALL not move. A page chosen from the page menu SHALL slide the content the same way, with no highlight to glide.

#### Scenario: Going right
- **WHEN** a viewer on Impact chooses "Patterns" and Patterns arrives
- **THEN** the highlight glides right to "Patterns", Impact's content leaves to the left and Patterns' comes in from the right, starting together

#### Scenario: Going left
- **WHEN** a viewer on Top Ten chooses "Solar"
- **THEN** the highlight glides left and the new content comes in from the left

#### Scenario: Going right from the page menu
- **WHEN** a viewer on a phone on Impact chooses "Patterns" from the page menu
- **THEN** Impact's content leaves to the left and Patterns' comes in from the right

#### Scenario: The live status during the pass
- **WHEN** a live status arrives while a page change is moving
- **THEN** the top bar's live status updates as usual and doesn't slide

#### Scenario: Other navigation
- **WHEN** a viewer picks another range on the Solar page, or follows a link inside a page
- **THEN** neither the highlight nor the page slides as for a tab change

## ADDED Requirements

### Requirement: The page menu on a phone
In a window narrower than 640 pixels, the top bar SHALL end its brand row with a 44-pixel square button of three bars, named "Pages" for assistive technology and reporting whether its menu is open. It SHALL open a menu of the six page links in their order, the current one marked. Choosing a page, tapping outside the menu or pressing Escape SHALL close it.

#### Scenario: Opening the menu
- **WHEN** a viewer on Impact, on a 390 pixel wide screen, taps the Pages button
- **THEN** a menu lists Solar, Impact, Distribution, True-Up, Top Ten and Patterns, each at least 44 pixels tall, with Impact underlined in red and marked as the current page

#### Scenario: Closing without choosing
- **WHEN** the menu is open and the viewer taps outside it or presses Escape
- **THEN** the menu closes and the page stays as it was

#### Scenario: A wide window
- **WHEN** a viewer opens the site in a 640 pixel wide window
- **THEN** the top bar shows the six links and no Pages button

### Requirement: Range presets on a phone
In a window narrower than 640 pixels, each group of range presets SHALL be one button naming the selected preset, or "Custom" when none matches, that opens a menu of the group's presets in order, any Earlier years in Earlier's place, newest first. The selected one SHALL be marked. Choosing one SHALL close the menu and do what its button does. The dates button SHALL sit beside the menu's button, or below it when they don't fit together.

#### Scenario: Impact on a phone
- **WHEN** a viewer opens the Impact page on This month in a 390 pixel wide window
- **THEN** a "This month" menu button and the dates button share one row, and the menu lists Today, This week, This month, This year, True-up year and All time with This month marked

#### Scenario: Choosing from the menu
- **WHEN** that viewer chooses This year from the menu
- **THEN** the menu closes and the page shows This year, as the This year button does on a wide screen

#### Scenario: A range no preset gives
- **WHEN** a viewer on a phone shows October 1 to 31, 2026 on the Solar page
- **THEN** the menu button reads "Custom" and no preset in the menu is marked

#### Scenario: True-Up on a phone
- **WHEN** a viewer opens `/true-up` on 2026-11-08 in a 390 pixel wide window
- **THEN** the menu lists This year, '25 - '26, '24 - '25, '23 - '24, '22 - '23, '21 - '22 and All time, and the dates button sits below the menu's button

#### Scenario: A wide window
- **WHEN** a viewer opens the Impact page in a 640 pixel wide window
- **THEN** the presets are a row of buttons, as before

#### Scenario: The readings switch
- **WHEN** a viewer opens the Impact page on a phone
- **THEN** Corrected and As Tesla reported are still two buttons, not a menu

### Requirement: The menus' motion
Opening the page menu SHALL turn the button's three bars into an X in 200 ms, easing out: the top and bottom bars turn to cross and the middle bar shrinks and fades. The page menu and each presets menu SHALL fade and grow in from their button in 150 ms. Closing SHALL play the same motion in reverse. When the viewer's system asks for reduced motion, the bars and the menus SHALL change at once.

#### Scenario: Opening and closing
- **WHEN** a viewer taps the Pages button, then taps it again
- **THEN** the bars turn into an X as the menu grows in, then turn back into bars as the menu fades out

#### Scenario: Reduced motion
- **WHEN** a viewer with reduced motion on taps the Pages button
- **THEN** the X and the menu appear at once, and on closing the menu goes and the bars come back at once
