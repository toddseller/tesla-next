# dashboard-shell Specification

## Purpose

The frame and design system every dashboard page shares: navigation among the pages, how the frame fits any screen, the colors and type, and the footer.

## Requirements

### Requirement: Navigation among the pages
Every page SHALL have a top bar with the site's icon and name, "Tesla Solar Report", linking to `/`, and the seven pages as links in this order: Home, Solar, Impact, Distribution, True-Up, Top Ten and Patterns. In a window narrower than 640 pixels the links SHALL be in the page menu instead of on the bar. The current page's link SHALL be marked for sight, with a red underline, and for assistive technology, as the current page.

#### Scenario: The links
- **WHEN** a viewer reads the top bar
- **THEN** its links open `/`, `/solar`, `/impact`, `/distribution`, `/true-up`, `/top` and `/patterns`, in that order

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

### Requirement: The dashboard's design system
Every page SHALL use one dark design system: a near-black background (`#0E1116`), raised panels (`#151A21`) with a fine border (`#232831`), light text (`#E6E8EB`) and muted gray labels (`#9AA3AD`). Text SHALL be set in IBM Plex Sans and figures in IBM Plex Mono, both served by the site itself; a figure is any measured or computed number, kWh, kW, percentages and dollars alike. Every card's heading SHALL be a section label: Plex Sans at 14 pixels, weight 500, uppercase with 0.06em tracking, in the muted gray. Tesla red (`#E82127`) SHALL mark the current page and indicators, and SHALL NOT be used for text smaller than 24 pixels, because it falls short of 4.5:1 contrast on the background. The Distribution house scene and the Solar day view's sections keep their own styling.

#### Scenario: Fonts load from the site
- **WHEN** any page loads
- **THEN** its text is IBM Plex Sans, its figures IBM Plex Mono, and the browser makes no request to fonts.googleapis.com or fonts.gstatic.com

#### Scenario: Text is readable
- **WHEN** any text on a page is checked against its background
- **THEN** it has at least 4.5:1 contrast, or at least 3:1 when it is 24 pixels or larger

#### Scenario: One heading style across cards
- **WHEN** True-Up shows its tiles, cycle chart, billing cycles, savings and Payback cards, and Impact its Backup card
- **THEN** each card's heading is a section label like Impact's Self Powered and Solar's Solar forecast, and Backup's year still follows its middle dot

#### Scenario: Dollars in mono
- **WHEN** True-Up's savings card shows the Powerwalls' dollars, their breakdown and the what-if figure
- **THEN** each dollar figure is in IBM Plex Mono and its label in IBM Plex Sans

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
Every page SHALL end with a footer linking the seven pages by their top bar names, the current one marked, and reading "© <current year> teslasolar.report".

#### Scenario: The footer's year
- **WHEN** a page is opened in 2027
- **THEN** its footer reads "© 2027 teslasolar.report"

#### Scenario: The footer's links
- **WHEN** a visitor reaches the end of any page
- **THEN** the footer links Home, Solar, Impact, Distribution, True-Up, Top Ten and Patterns

### Requirement: The True-Up Tracker's old address
`/numbers`, the True-Up Tracker's address on teslasolar.report before it was renamed, SHALL redirect permanently to `/true-up`, so old bookmarks open the True-Up Tracker.

#### Scenario: An old bookmark
- **WHEN** a viewer opens `/numbers`
- **THEN** the response is a permanent redirect to `/true-up`, and the True-Up Tracker opens with "True-Up" marked as the current page

### Requirement: The Patterns page's old address
`/health`, the Patterns page's address before it was renamed, SHALL redirect permanently to `/patterns`, so old bookmarks open the Patterns page.

#### Scenario: An old bookmark
- **WHEN** a viewer opens `/health`
- **THEN** the response is a permanent redirect to `/patterns`, and the Patterns page opens with "Patterns" marked as the current page

### Requirement: Live status in the top bar
Every page's top bar SHALL end with the live status: a dot, "LIVE" and the time of the latest live status in the site's time zone, like "9:59 AM", and the live pill. The pill SHALL read the solar power, the home power, and "PW" with the Powerwalls' charge and their state as anton reports it, like "SOLAR 6.2 kW · HOME 1.4 kW · PW 92% · CHARGING". It SHALL update with each live status, about every 10 seconds, without reloading the page.

#### Scenario: Charging at midday
- **WHEN** the latest live status, from 9:59 AM, reports 6.2 kW of solar, 1.4 kW of home use and the Powerwalls at 92% and Charging
- **THEN** the top bar on every page reads LIVE 9:59 AM and SOLAR 6.2 kW · HOME 1.4 kW · PW 92% · CHARGING, with the dot in the Powerwall color, an amber square before SOLAR and a blue one before HOME, and the figures in the light text color

#### Scenario: A new status arrives
- **WHEN** a status from 10:00 AM reports 6.5 kW of solar, 1.2 kW of home use, 93% and Charging while a viewer is on the Top Ten page
- **THEN** the top bar reads LIVE 10:00 AM and SOLAR 6.5 kW · HOME 1.2 kW · PW 93% · CHARGING, with no reload

#### Scenario: The figures' form
- **WHEN** a status reports 0.04 kW of solar and 12.34 kW of home use
- **THEN** the pill reads SOLAR 0 kW and HOME 12.3 kW, as the Distribution page writes them

#### Scenario: Home not reported
- **WHEN** the latest status at midday reports solar and the Powerwalls but no home power
- **THEN** the pill reads SOLAR, then PW, with no HOME

#### Scenario: The Distribution page
- **WHEN** a viewer opens the Distribution page
- **THEN** its top bar has the same live pill as every other page

### Requirement: A stale or missing live status
When the latest live status is two minutes old or more, as the Distribution page counts it stale, the top bar SHALL turn the dot gray and read "LAST" in place of "LIVE", keeping the time and the Powerwall part of the last status received, until a status arrives. A stale status's solar and home SHALL be left out of the pill. Before any live status is known, the time, the charge and the state SHALL show dashes, and the pill SHALL hold no solar or home.

#### Scenario: Flask stops polling
- **WHEN** the last status, from 9:59 AM, reported 6.2 kW of solar, 1.4 kW of home use, 92% and Charging, and is more than two minutes old
- **THEN** the top bar reads LAST 9:59 AM with a gray dot and the pill reads PW 92% · CHARGING alone, and turns back to LIVE with solar and home with the next status

#### Scenario: Right after a deploy
- **WHEN** a page is opened before the server has received a live status
- **THEN** the top bar shows dashes for the time, the charge and the state, reading PW — · —, and fills them in, with solar and home, with the first status

### Requirement: Off grid and storm watch in the top bar
The top bar's live status SHALL add a pill before the live pill while the latest live status reports the site off the grid or in storm watch: "OFF GRID TEST" for `off_grid_intentional`; "OFF GRID" for any other island status starting `off_grid`, followed by "SINCE" and the time the current stretch began when the server holds an off-grid stretch; and "STORM WATCH" while storm watch is active and the site is on the grid. Otherwise there SHALL be no added pill.

#### Scenario: An outage with its stretch stored
- **WHEN** the latest status reports `off_grid_unintentional` and the current stretch is `off_grid_unintentional` from 6:25 AM
- **THEN** the top bar reads OFF GRID SINCE 6:25 AM beside the live pill

#### Scenario: An outage in its first minutes
- **WHEN** the latest status reports `off_grid_unintentional` and the current stretch is still `on_grid`, not yet stored by anton
- **THEN** the top bar reads OFF GRID, with no time

#### Scenario: A test
- **WHEN** the latest status reports `off_grid_intentional`
- **THEN** the top bar reads OFF GRID TEST

#### Scenario: Storm watch
- **WHEN** the latest status reports `on_grid` and storm watch active
- **THEN** the top bar reads STORM WATCH beside the live pill

#### Scenario: An outage during storm watch
- **WHEN** the latest status reports `off_grid_unintentional` and storm watch active
- **THEN** the top bar reads OFF GRID and not STORM WATCH

#### Scenario: On the grid
- **WHEN** the latest status reports `on_grid` without storm watch, or has neither field
- **THEN** the top bar shows only the live pill

#### Scenario: A stale status
- **WHEN** the last status, more than two minutes old, reported `off_grid_unintentional`
- **THEN** the top bar reads LAST with a gray dot and keeps the OFF GRID pill, as it keeps the Powerwall part of the live pill

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

### Requirement: Page changes without motion
When the viewer's system asks for reduced motion, or the browser can't animate page changes, choosing a page SHALL change the highlight and the content at once, as a plain navigation.

#### Scenario: Reduced motion
- **WHEN** a viewer with reduced motion on chooses "Impact"
- **THEN** the clicked tab brightens on the click, and when Impact arrives the underline and the content change at once

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

### Requirement: Range presets on a phone
In a window narrower than 640 pixels, each group of range presets SHALL be one button naming the selected preset as its button reads, or "Custom" when none is selected, that opens a menu of the group's presets in order. The selected one SHALL be marked. Choosing one SHALL close the menu and do what its button does. The selected preset's step buttons SHALL sit either side of the menu's button, and the dates button beside them.

#### Scenario: Impact on a phone
- **WHEN** a viewer opens the Impact page on This month in a 390 pixel wide window
- **THEN** the step buttons either side of a "This month" menu button, and the dates button, share one row, and the menu lists Today, This week, This month, This year, True-up year and All time with This month marked

#### Scenario: Choosing from the menu
- **WHEN** that viewer chooses This year from the menu
- **THEN** the menu closes and the page shows This year, as the This year button does on a wide screen

#### Scenario: A range no preset gives
- **WHEN** a viewer on a phone shows October 10 to 20, 2026 on the Solar page
- **THEN** the menu button reads "Custom" and no preset in the menu is marked

#### Scenario: True-Up on a phone
- **WHEN** a viewer opens `/true-up` on 2026-11-08 in a 390 pixel wide window
- **THEN** the menu lists True-up year and All time, the step buttons sit either side of the menu's button and the dates button beside them

#### Scenario: A wide window
- **WHEN** a viewer opens the Impact page in a 640 pixel wide window
- **THEN** the presets are a row of buttons, as before

#### Scenario: The readings switch
- **WHEN** a viewer opens the Impact page on a phone
- **THEN** Corrected and As Tesla reported are still two buttons, not a menu

### Requirement: The dates button
Beside each page's range presets, the dates button that opens the custom range picker SHALL be a calendar icon in a 44-pixel square, with no dates written on it. Its name for assistive technology and its tooltip SHALL give the shown range's dates, like "Choose dates, Oct 1 – 31, 2026". It SHALL show as selected, as a preset button does, when no preset is selected.

#### Scenario: A preset range
- **WHEN** a viewer opens the Impact page on This month, November 2026
- **THEN** the dates button is a calendar icon named "Choose dates, Nov 1 – 30, 2026", and it is not shown as selected

#### Scenario: A custom range
- **WHEN** a viewer shows October 10 to 20, 2026 on the Solar page
- **THEN** the dates button shows as selected, and no preset does

#### Scenario: An earlier true-up year
- **WHEN** a viewer on `/true-up` on 2026-11-23 presses Previous true-up year
- **THEN** the True-up year preset shows as selected, reading "'25 - '26", and the dates button does not

### Requirement: Picking a range keeps the reader's place
On every page with range presets, choosing a preset, a step button, or dates from the custom range picker SHALL change the shown range without scrolling the page. The page SHALL stay scrolled where it was, and the range change SHALL still be a new entry in the browser's history.

#### Scenario: A short window on Solar
- **WHEN** a viewer on the Solar page, in a window short enough that the forecast card pushes "Solar by date range" below the fold, scrolls down to the chart and picks This year
- **THEN** the chart shows This year and the page stays scrolled to the chart

#### Scenario: Dates from the picker
- **WHEN** a viewer scrolled down on the Impact page picks October 1 to 31, 2026 in the custom range picker
- **THEN** the page shows October 2026 and stays scrolled where it was

#### Scenario: An earlier true-up year
- **WHEN** a viewer scrolled down on `/true-up` presses Previous true-up year
- **THEN** the page shows that year and stays scrolled where it was

#### Scenario: Back after a range change
- **WHEN** a viewer on This month picks This year and then goes back in the browser
- **THEN** the page shows This month again

### Requirement: The menus' motion
Opening the page menu SHALL turn the button's three bars into an X in 200 ms, easing out: the top and bottom bars turn to cross and the middle bar shrinks and fades. The page menu and each presets menu SHALL fade and grow in from their button in 150 ms. Closing SHALL play the same motion in reverse. When the viewer's system asks for reduced motion, the bars and the menus SHALL change at once.

#### Scenario: Opening and closing
- **WHEN** a viewer taps the Pages button, then taps it again
- **THEN** the bars turn into an X as the menu grows in, then turn back into bars as the menu fades out

#### Scenario: Reduced motion
- **WHEN** a viewer with reduced motion on taps the Pages button
- **THEN** the X and the menu appear at once, and on closing the menu goes and the bars come back at once

### Requirement: Solar in the live pill follows the sun
The live pill SHALL hold solar from sunrise to sunset at the site, whatever the panels produce, and leave it out from sunset to sunrise, by the same sunrise and sunset the Distribution scene uses. Solar SHALL come into the pill and leave it only at those two moments, never as its output rises or falls.

#### Scenario: A cloudy dawn
- **WHEN** a status arrives five minutes after sunrise reporting 0.02 kW of solar
- **THEN** the pill reads SOLAR 0 kW

#### Scenario: Dusk
- **WHEN** statuses before sunset report solar falling from 0.12 to 0.03 kW and back to 0.08 kW
- **THEN** SOLAR stays in the pill throughout, reading 0.1, 0 and 0.1 kW

#### Scenario: After sunset
- **WHEN** the bar's clock passes sunset, with home use at 0.8 kW and the Powerwalls at 64% and Discharging
- **THEN** the pill reads HOME 0.8 kW · PW 64% · DISCHARGING, with no SOLAR, until sunrise

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

### Requirement: Keyboard use
Every page SHALL begin with a "Skip to content" link, shown when it has keyboard focus, that moves focus to the page's main content. Every link, button and focusable chart SHALL show a 2 pixel focus ring in the ring color at full strength when focused from the keyboard.

#### Scenario: Skipping the top bar
- **WHEN** a keyboard user opens a page and presses Tab, then Enter
- **THEN** "Skip to content" shows on the first Tab, and Enter moves focus past the top bar to the main content

#### Scenario: A visible focus
- **WHEN** a keyboard user tabs to a top bar link
- **THEN** a solid 2 pixel ring in the ring color surrounds it

### Requirement: Each page's title
Each page's document title SHALL name the page, then the range it shows when it has one, then "Tesla Solar Report", joined by " · "; the home page's SHALL be "Tesla Solar Report". A whole month SHALL read like "November 2026", a calendar year "2026", a true-up year "'26 - '27", and a day or any other range in short dates, like "Nov 14, 2026" or "Oct 1 – 15, 2026". The title SHALL name the range the page shows, not the one asked for, and follow it when it changes.

#### Scenario: Solar's current month
- **WHEN** a viewer opens `/solar` on 2026-11-23
- **THEN** the title is "Solar · November 2026 · Tesla Solar Report"

#### Scenario: A day on Solar
- **WHEN** a viewer opens Solar's day view for November 14, 2026
- **THEN** the title is "Solar · Nov 14, 2026 · Tesla Solar Report"

#### Scenario: Impact before any solar
- **WHEN** a viewer opens `/impact` on 2026-11-23 while today's solar reads 0.0 kWh, so the page shows yesterday
- **THEN** the title is "Impact · Nov 22, 2026 · Tesla Solar Report"

#### Scenario: True-Up's current year
- **WHEN** a viewer opens `/true-up` in the '26 - '27 true-up year
- **THEN** the title is "True-Up · '26 - '27 · Tesla Solar Report"

#### Scenario: A calendar year
- **WHEN** Solar shows January 1 to December 31, 2025
- **THEN** the title is "Solar · 2025 · Tesla Solar Report"

#### Scenario: Pages without a range
- **WHEN** a viewer opens Distribution, Patterns, Top Ten or Admin
- **THEN** the titles are "Distribution · Tesla Solar Report", "Patterns · Tesla Solar Report", "Top Ten · Tesla Solar Report" and "Admin · Tesla Solar Report"

### Requirement: Each page's top heading
Each page SHALL have exactly one h1. Distribution's SHALL be "Distribution", and Solar's day view's SHALL name its day, like "Solar on Sat, Nov 14, 2026"; both visually hidden, so neither page looks different.

#### Scenario: Distribution
- **WHEN** a screen reader lists Distribution's headings
- **THEN** the first is the h1 "Distribution", and nothing on screen changes

#### Scenario: Solar's day view
- **WHEN** a viewer opens Solar's day view for November 14, 2026
- **THEN** the page has one h1, "Solar on Sat, Nov 14, 2026", and the day button still shows the date

### Requirement: The start date
A sentence giving when the site's figures begin SHALL say "October 10, 2021", the first day of data, and every figure counted from the start SHALL count from it. A sentence about outages or payback SHALL instead say "October 22, 2021", named as the day the system was approved to run. A heading, subtitle or axis MAY shorten either to "October 2021" or "2021". No page SHALL give another start.

#### Scenario: Top Ten's note
- **WHEN** a viewer reads Top Ten's note
- **THEN** it says outages count after October 22, 2021, the day the system was approved to run, and doesn't name October 23

#### Scenario: Home's running totals
- **WHEN** a screen reader reads the Since chapter's chart
- **THEN** it hears "Running totals since October 10, 2021"

### Requirement: An address that isn't a page
An address that isn't one of the site's pages SHALL answer 404 with a page inside the site's top bar and footer, on the dark field, never the framework's default. It SHALL have the h1 "You've gone off-grid", as large as the Pick a day heading below it, then a sentence naming the address asked for, like "/nope isn't a page on the site, so nothing is flowing here.", then the home page's Pick a day control, then a link back to the home page. Its title SHALL be "Not found · Tesla Solar Report".

#### Scenario: A mistyped address
- **WHEN** a visitor opens `/nope`
- **THEN** the response is a 404, the page reads "You've gone off-grid" and "/nope isn't a page on the site, so nothing is flowing here.", with Pick a day and a link home below, inside the usual top bar and footer

#### Scenario: A light-mode browser
- **WHEN** a visitor whose system prefers light mode opens `/nope`
- **THEN** the page is on the dark field like every other page

#### Scenario: Picking a day from it
- **WHEN** the visitor picks Random day on the 404 page
- **THEN** Solar's day view for that day opens

### Requirement: The range header
Solar's range view, Impact and True-Up SHALL head the page the same way: the page's heading at 22 pixels, its range controls in the same row in a window at least 640 pixels wide, and the page's lead sentence on its own line under that row, at the same size on all three. In a narrower window the order SHALL be the heading, the lead sentence, then the range controls.

#### Scenario: Three pages at 1440
- **WHEN** a viewer opens Solar, Impact and True-Up in turn, each on its default range, in a 1440 by 900 window
- **THEN** each heading is 22 pixels with its range controls on its row, and each lead sentence is under that row in the same size

#### Scenario: On a phone
- **WHEN** a viewer opens Impact in a 390 pixel wide window
- **THEN** the heading comes first, the lead sentence second and the range controls third

### Requirement: The preset core
Every page with range presets SHALL offer the core presets in this order: This month, This year, True-up year, All time. A page MAY put presets of its own before the core, and MAY leave out core presets that don't fit its data, but SHALL NOT reorder the core or put anything between its presets.

#### Scenario: The same order
- **WHEN** a viewer looks at the presets on Solar, Impact and True-Up
- **THEN** whichever core presets each shows appear in the order This month, This year, True-up year, All time

### Requirement: Stepping the range
A preset SHALL be marked as selected when it gives the shown range, or when the shown range has its shape: a day, a Sunday to Saturday week, a calendar month, a January to December year or an October to September true-up year. The selected preset SHALL hold a previous and a next button that step the range by that shape, each named for its step, like "Previous month". Stepping SHALL change the address as a preset does.

#### Scenario: A month back
- **WHEN** a viewer on Solar showing November 2026 presses Previous month
- **THEN** the address becomes `/solar?start=2026-10-01&end=2026-10-31`, the page shows October 2026, and the This month preset stays marked

#### Scenario: A true-up year back
- **WHEN** a viewer on `/true-up` showing 2026-10-01 to 2027-09-30 presses Previous true-up year
- **THEN** the page shows 2025-10-01 to 2026-09-30, and the True-up year preset stays marked

#### Scenario: A week
- **WHEN** a viewer on Impact showing Sunday 2026-11-08 to Saturday 2026-11-14 presses Next week on 2026-11-23
- **THEN** the page shows 2026-11-15 to 2026-11-21, and This week stays marked

#### Scenario: A range no preset's shape fits
- **WHEN** a viewer shows 2026-10-10 to 2026-10-20, or a single day on Solar, which has no day preset
- **THEN** no preset is marked and there are no step buttons

### Requirement: A stepped preset names its range
While a preset is marked for a range other than its own, it SHALL read that range's name instead of its label: "October 2026", "2025", "'25 - '26", "Nov 15 – 21, 2026" or "Nov 22, 2026". Choosing it SHALL bring back its own range, and its tooltip SHALL say so, like "Back to this month".

#### Scenario: Stepped back a month
- **WHEN** a viewer on Solar presses Previous month on November 2026
- **THEN** the marked preset reads "October 2026", and choosing it shows November 2026 again

#### Scenario: Not stepped
- **WHEN** a viewer shows This month
- **THEN** the marked preset reads "This month"

### Requirement: Steps stay within the data
The next button SHALL be disabled when the next span would start after today in the site's time zone, and the previous button when the previous span would end before 2021-10-10, the site's first day of service.

#### Scenario: The current month
- **WHEN** a viewer shows November 2026 on 2026-11-23
- **THEN** Next month is disabled and Previous month is not

#### Scenario: The first month
- **WHEN** a viewer shows October 2021
- **THEN** Previous month is disabled

#### Scenario: The first true-up year
- **WHEN** a viewer on `/true-up` shows 2021-10-01 to 2022-09-30
- **THEN** Previous true-up year is disabled, since that year ends before the first day of service

### Requirement: Month and year lists in the picker
Each month the date-range picker shows SHALL be captioned by a month list and a year list instead of the month's name, offering only months and years from October 2021 to the current month. Choosing from either SHALL move the picker to that month, keeping any start day already picked.

#### Scenario: To 2022
- **WHEN** a viewer on Solar showing November 2026 opens the picker in a 390 pixel wide window and chooses 2022 in the year list
- **THEN** the picker shows November 2022

#### Scenario: The first year
- **WHEN** a viewer chooses 2021 in a picker's year list
- **THEN** its month list offers only October to December

### Requirement: True-Up's All time title
True-Up's All time runs between true-up year boundaries, so its document title SHALL name it "All time" rather than those boundary dates.

#### Scenario: True-Up's All time
- **WHEN** a viewer opens True-Up's All time
- **THEN** the title is "True-Up · All time · Tesla Solar Report", not "True-Up · Oct 1, 2021 – Sep 30, 2027 · Tesla Solar Report"
