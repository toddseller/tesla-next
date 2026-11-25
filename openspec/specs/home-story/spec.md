# home-story Specification

## Purpose
The home page at `/`: one home's solar and Powerwalls told as a story, from what the house is doing right now out to the years since October 2021, each chapter in the visual form its data has and leading to the page that holds its full data.

## Requirements

### Requirement: The story page
The site SHALL serve the home page at `/` with six chapters in this order, each headed by one word or year: Now, Today, the current year (for example "2026"), Records, Habits, and Since 2021, followed by Pick a day. The page SHALL be served with every chapter's figures in the first response, and each chapter SHALL end with a link to the page that holds its full data.

#### Scenario: Opening the site
- **WHEN** a visitor opens `/` on November 21, 2026
- **THEN** the first response holds Now, Today, 2026, Records, Habits, Since 2021 and Pick a day in that order, each chapter with its figures and its link

### Requirement: What the page is
The page SHALL open, above the Now chapter, with its one heading: a line saying it shows one home's Tesla solar panels, with their size in kW, and its three Powerwalls, live and recorded since October 10, 2021, the first day of data.

#### Scenario: A first-time visitor
- **WHEN** a visitor opens `/`
- **THEN** the first thing under the top bar is the heading "One home's 12.24 kW of Tesla solar and three Powerwalls, live and recorded since October 10, 2021", the page's only h1

### Requirement: The same story at every width
Every chapter SHALL show the same figures, sentences and links at every window width; only their layout SHALL change.

#### Scenario: A phone and a laptop
- **WHEN** the same address is opened on a 390-pixel phone and a 1440-pixel window
- **THEN** each chapter holds the same figures, sentences and links on both

### Requirement: Figures agree with the pages they link to
Every figure on the home page SHALL be the figure the linked page shows for the same range and readings, with the same rounding. The home page SHALL use the corrected readings, the default of the pages it links to.

#### Scenario: This year's share
- **WHEN** Impact shows 69% of the house from solar and the Powerwalls for January 1 to November 21, 2026
- **THEN** the 2026 chapter on November 21, 2026 says 69%

### Requirement: Charts readable as text
Every chart on the home page SHALL have its key figures as text beside it, and a chart drawn as an image SHALL carry a text summary for assistive technology.

#### Scenario: A screen reader on the year
- **WHEN** a screen reader reaches the 2026 chapter's chart
- **THEN** it reads a summary naming the year, its solar total and its best day

### Requirement: Now in a sentence
The Now chapter SHALL lead, under the word Now, with one sentence from the live status, the scene beside it carrying the figures: what supplies the house, largest first; that solar is at 0 after sunset or before sunrise when it is; what the Powerwalls are doing and how full they are; and, when the live status carries the car, its charge or charging power. The sentence SHALL change with each live status. A flow under 0.05 kW, which the scene shows at 0, SHALL not count as supplying the house.

#### Scenario: Stale
- **WHEN** the latest live status arrived at 10:41 AM and is 5 minutes old
- **THEN** the sentence is replaced by "No live update since 10:41 AM."

#### Scenario: After sunset
- **WHEN** the house uses 1.0 kW, all from the grid, after sunset, with the Powerwalls idle at 100% and the car at 50%, not charging
- **THEN** the sentence reads "The grid supplies the house; solar is at 0 after sunset. The Powerwalls are idle at 100%, and the car is at 50%."

#### Scenario: Midday
- **WHEN** solar supplies all of the house's 1.1 kW, the Powerwalls charge at 3.1 kW at 86% and the car charges at 5.1 kW
- **THEN** the sentence reads "Solar supplies the house. The Powerwalls are charging at 3.1 kW, 86% full, and the car is charging at 5.1 kW."

#### Scenario: Before sunrise
- **WHEN** at 5:00 AM the house uses 2.4 kW from the grid with the Powerwalls idle at 20% and no car in the status
- **THEN** the sentence reads "The grid supplies the house; solar is at 0 before sunrise. The Powerwalls are idle at 20%."

### Requirement: Now says what goes to PG&E
When the grid is exporting 0.05 kW or more and something supplies the house, the Now sentence's first clause SHALL add the power sent to PG&E, its verbs agreeing with what supplies the house ("the Powerwalls" taking plural verbs).

#### Scenario: Sending to PG&E
- **WHEN** solar supplies all of the house's 0.8 kW and sends 1.2 kW to the grid, with the Powerwalls idle at 100%
- **THEN** the sentence reads "Solar supplies the house and sends 1.2 kW to PG&E. The Powerwalls are idle at 100%."

#### Scenario: A VPP evening
- **WHEN** after sunset the Powerwalls supply 6.0 kW at 80%, all of the house's 1.0 kW and 5.0 kW to the grid
- **THEN** the sentence reads "The Powerwalls supply the house and send 5.0 kW to PG&E; solar is at 0 after sunset. The Powerwalls are supplying 6.0 kW, 80% full."

### Requirement: The house scene in Now
The Now chapter SHALL show the Distribution page's live house scene beside its sentence, drawn and updated as live-flow-scene and scene-weather specify, with its stale warning, and without the replay controls. Below 1024 pixels the scene SHALL sit under the sentence at the content's width.

#### Scenario: Opening the site
- **WHEN** a visitor opens `/` at 3:39 PM with solar at 0.7 kW and 0.5 kW coming from the grid
- **THEN** the Now chapter shows the same scene `/distribution` shows at that moment, with its flows, weather and labels, and no replay bar

#### Scenario: A phone
- **WHEN** a visitor opens `/` on a 390-pixel-wide screen
- **THEN** the scene sits under the sentence at the screen's width, and nothing scrolls sideways

#### Scenario: A tablet
- **WHEN** a visitor opens `/` in a 768-pixel-wide window
- **THEN** the scene sits under the sentence at the content's width, its labels apart, and nothing scrolls sideways

#### Scenario: A laptop
- **WHEN** a visitor opens `/` in a 1024-pixel-wide window
- **THEN** the scene sits beside the sentence

### Requirement: The live readings move
The sentence and the scene SHALL move to each new live status without a page reload.

#### Scenario: A new reading
- **WHEN** a new live status arrives with solar at 5.8 kW
- **THEN** the scene shows 5.8 kW of solar and the sentence names solar as what supplies the house, without a reload

### Requirement: Now leads to Distribution
The Now chapter's link SHALL open the Distribution page.

#### Scenario: Following the link
- **WHEN** a visitor follows the Now chapter's link
- **THEN** `/distribution` opens

### Requirement: Today's chart
The Today chapter SHALL chart the site day: solar made filled up to now, the forecast's expected kWh by hour as a dashed line across the whole day with the hours to come dimmed and captioned "still to come", and the Powerwalls charging and the grid exporting drawn below zero up to now. Its time axis SHALL be marked 12 AM at both ends, and 6 AM, 12 PM and 6 PM between. A day without an hourly forecast SHALL draw solar and the flows below zero alone.

#### Scenario: Mid-afternoon
- **WHEN** a visitor opens `/` at 3:39 PM with today's hourly forecast stored
- **THEN** the chart fills solar to 3:39 PM, dashes the forecast from sunrise to sunset, dims the hours after 3:39 PM with "still to come" in them and shows the charging and export below zero, on an axis marked 12 AM, 6 AM, 12 PM, 6 PM and 12 AM

### Requirement: Today against the forecast
The Today chapter SHALL lead with today's solar so far in kWh to one decimal, as the forecast card's today tile gives it, then today's expected kWh to one decimal (the sum of the forecast's hours when it has them) as the forecast card says it, and the kWh still to come: the forecast hours left after now (the day's expected without hours, none after sundown). Without an expected kWh it SHALL show the kWh so far alone.

#### Scenario: Ahead of the forecast
- **WHEN** at 3:39 PM today has made 21.7 kWh, 18 kWh is expected for the day, 17.8 kWh was expected by 3:35 PM, and the forecast's 3 PM hour expects 0.4 kWh with no hour after it
- **THEN** the chapter leads with 21.7 kWh, then "generated, of 18.0 kWh expected", "3.9 kWh ahead of the forecast" and "0.2 kWh still to come", each figure with its unit beside it

#### Scenario: After sundown
- **WHEN** at 7:25 PM the day's hours sum to 19.7 kWh and the forecast card says the day's sunlight is over
- **THEN** the chapter shows "of 19.7 kWh expected" and "0.0 kWh still to come"

#### Scenario: No forecast
- **WHEN** there are too few days with a forecast to give an expected kWh and today has made 3.0 kWh
- **THEN** the chapter shows 3.0 kWh and no expected figure

### Requirement: Today ahead of or behind the forecast
Between the day's expected and still to come, the Today chapter SHALL say how far the forecast's kWh made by now is ahead of or behind its kWh expected by the same time, each to one decimal as the Solar page compares them, or "on the forecast" when they read the same.

#### Scenario: Behind the forecast
- **WHEN** at 2:15 PM today has made 15.6 kWh and 20.6 kWh was expected by 2:15 PM
- **THEN** the chapter shows "5.0 kWh behind the forecast"

#### Scenario: On the forecast
- **WHEN** today has made 12.4 kWh and 12.4 kWh was expected by the same time
- **THEN** the chapter shows "0.0 kWh on the forecast"

### Requirement: Today's totals
The Today chapter SHALL show today's totals so far in kWh to one decimal: the house's use, the car's charging, energy from the grid, energy sent to PG&E, and the Powerwalls' energy in and out, each the day view's figure for today, so the house's use leaves out the car as the day view does and, on a day with car data, is labelled "used by the house, without the car".

#### Scenario: A sunny afternoon
- **WHEN** the day view for today shows the house at 21.3 kWh, the car charged 3.1 kWh, 14.4 kWh from the grid, 11.0 kWh sent, and the Powerwalls 0.7 kWh in and 0.0 kWh out
- **THEN** the Today chapter shows the same six figures, the house's as "21.3 kWh used by the house, without the car"

#### Scenario: Just after midnight
- **WHEN** it is 12:05 AM and today has 0.1 kWh of house use and nothing else
- **THEN** the chapter shows 0.1 kWh for the house and 0.0 kWh for the rest, with no warning

#### Scenario: No car data
- **WHEN** today's day view has no car data, so its house figure holds any charging
- **THEN** the figure is labelled "used by the house"

### Requirement: Today stays current
The Today chapter's chart and figures SHALL reload when a totals event arrives for the site's current day and when the live stream reopens, so a page left open past midnight moves on to the new day. When a reload fails, they SHALL keep what they show and say the time they are as of, the last successful load, until a reload succeeds.

#### Scenario: More sun comes in
- **WHEN** the chapter shows 6.6 kWh and a totals event for today arrives with 7.1 kWh made
- **THEN** the chapter moves to 7.1 kWh and its chart extends without a page reload

#### Scenario: A failed reload
- **WHEN** a reload at 3:45 PM fails and the figures are from 3:39 PM
- **THEN** the chapter keeps showing its chart and figures with "as of 3:39 PM" until a reload succeeds

### Requirement: Every chart point gives its values
Pointing at a home page chart SHALL show the values at that point: Today's time with its solar, energy into the Powerwalls and energy sent to PG&E in kW; a record's day or month with the record as it stood; Habits' month with each year's overnight draw, newest first; Since 2021's month with both running totals. A marker SHALL never appear without its values.

#### Scenario: Pointing at November on Habits
- **WHEN** the visitor points at November on the Habits chart, with 864 W in 2026 and 643 W in 2025
- **THEN** a box shows "November", then "2026 864 W" and "2025 643 W"

### Requirement: The days ahead
The Today chapter SHALL show the next three days' expected kWh to a tenth with their day names, as the forecast card gives them, or say there is no forecast right now when the card would.

#### Scenario: Three days ahead
- **WHEN** it is Saturday and Sunday, Monday and Tuesday expect 22.4, 27.0 and 16.1 kWh
- **THEN** the chapter shows "Sun 22.4 kWh · Mon 27.0 kWh · Tue 16.1 kWh", each day kept whole on one line, over "expected over the next three days"

### Requirement: Today leads to the Solar page
The Today chapter's link SHALL open today on the Solar page, in its month.

#### Scenario: Following the link
- **WHEN** a visitor follows the Today chapter's link on November 21, 2026
- **THEN** `/solar?start=2026-11-01&end=2026-11-30&day=2026-11-21` opens

### Requirement: The year's solar by day and hour
The year chapter SHALL draw one row per day of the chosen year and one column per hour of the site day, each cell shaded from dark through amber to white by the solar kWh made in that hour. Days before October 10, 2021, after today, or without solar figures SHALL be left blank.

#### Scenario: A clear June day and a cloudy one
- **WHEN** June 13 made 9 kWh at noon and June 14 made 1 kWh at noon
- **THEN** June 13's noon cell is near white and June 14's is dark amber

#### Scenario: The current year
- **WHEN** a visitor opens `/` on November 21, 2026
- **THEN** rows from November 22 to December 31 are blank

### Requirement: A day from the year
The year chart SHALL label each month along its side and, in the current year, mark today's row. Pointing at or tapping a row, or dragging across the chart, SHALL show that day's date and solar kWh with a link that opens the day on the Solar page. In a window 1024 pixels wide or more, where the readout sits beside the chart, the readout and the column it sits in SHALL stay in view while any part of the chart is on screen, so the readout of a row near the chart's foot can be read without scrolling back up. In a narrower window the readout, its day buttons and its link SHALL sit above the chart, and the chart SHALL be at most half the window's height, so a visitor who sees the whole chart also sees the day they tap.

#### Scenario: Tapping June 13
- **WHEN** a visitor taps the row for June 13, 2026
- **THEN** the chapter shows "June 13, 2026" with its solar kWh and a link to `/solar?start=2026-06-01&end=2026-06-30&day=2026-06-13`

#### Scenario: Dragging on a phone
- **WHEN** a visitor drags a finger down the chart from June into July
- **THEN** the readout follows each day under the finger

#### Scenario: Scrolling past it on a phone
- **WHEN** a visitor on a 390 by 844 screen scrolls down the page
- **THEN** the chart is at most half the screen's height, so most of the screen still scrolls the page

#### Scenario: Tapping a day on a phone
- **WHEN** a visitor on a 390 by 844 screen scrolls until the whole chart is on screen and taps a row in November
- **THEN** the readout above the chart is on screen and shows that November day with its solar kWh, and "Open the day" is on screen with it

#### Scenario: Tapping a day on a small tablet
- **WHEN** a visitor on a 744 by 1133 screen scrolls until the whole chart is on screen and taps a row in November
- **THEN** the chart is at most half the screen's height, and the readout above it is on screen showing that November day

#### Scenario: Pointing at November on a laptop
- **WHEN** a visitor on a 1440 by 900 screen scrolls until the chart's November rows are on screen and points at November 10
- **THEN** the readout beside the chart is on screen and shows November 10 with its solar kWh

#### Scenario: Tapping a day on a tablet
- **WHEN** a visitor in a 768 by 1024 window scrolls until the whole chart is on screen and taps a row in November
- **THEN** the readout, its day buttons and "Open the day" sit above the chart and are on screen showing that November day, and nothing scrolls sideways

### Requirement: Stepping through the year's days
The day readout SHALL have previous-day and next-day buttons at least 44 pixels square. The chart SHALL take keyboard focus, the Up and Down keys moving the shown day one day and Home and End to the year's first and last day with figures, and assistive technology SHALL hear each shown day.

#### Scenario: The next day on a phone
- **WHEN** the readout shows June 13, 2026 and a visitor taps its next-day button
- **THEN** it shows June 14, 2026 with its solar kWh

#### Scenario: The keyboard
- **WHEN** a keyboard user focuses the chart showing June 13 and presses Down
- **THEN** June 14 is shown and announced with its solar kWh

### Requirement: The year switcher
The year chapter SHALL offer every year from 2021 to the current one, the current year chosen by default. Choosing a year SHALL show its chart and shares without a page reload and put the year in the address as `year` without adding a history entry, keeping the address's other parameters. Opening `/?year=<year>` SHALL show that year. A `year` outside 2021 to the current year SHALL show the current year.

#### Scenario: Choosing 2023
- **WHEN** a visitor on `/` chooses 2023
- **THEN** the chart shows 2023, the address becomes `/?year=2023`, the page does not reload, and Back leaves the page

#### Scenario: A shared year
- **WHEN** a visitor opens `/?year=2022` on November 22, 2026
- **THEN** the year chapter shows 2022 in the first response, its readout on November 22, 2022

### Requirement: Another year keeps the date
Choosing a year SHALL open its readout on the same month and day as the day shown (February 28 for a 29th), or the nearest day with figures; in the current year, up to today. Opening `/?year=<year>` SHALL open on today's month and day in that year.

#### Scenario: The same date in another year
- **WHEN** the readout shows November 22, 2026 and a visitor chooses 2024
- **THEN** the readout shows November 22, 2024

#### Scenario: A date before the figures begin
- **WHEN** the readout shows June 13, 2026 and a visitor chooses 2021
- **THEN** the readout shows the first day with figures, in October 2021

### Requirement: A year that is slow or fails
While a chosen year loads, the chart SHALL say so and keep the year it showed. If the year fails to load, the chapter SHALL say it couldn't load that year, offer to try again, and keep the year it showed chosen.

#### Scenario: A year that fails to load
- **WHEN** a visitor chooses 2023 and the request fails
- **THEN** the chapter says it couldn't load 2023 with a Try again button, and keeps showing 2026, with 2026 still chosen

### Requirement: The year switcher on a phone
Below 640 pixels the year switcher SHALL be one button naming the chosen year that opens a menu of the years, as the range presets are on a phone.

#### Scenario: A phone
- **WHEN** a visitor on a 390-pixel-wide screen taps the year button reading 2026
- **THEN** a menu lists 2021 to 2026 with 2026 marked

### Requirement: The year's shares
Under its chart, the year chapter SHALL say how much of the house's energy in the chosen year, January 1 to December 31 or to today, came from solar, from the Powerwalls and from the grid, as Impact gives them for that range, saying that the house's energy here includes the car's charging, and SHALL link to Impact for that calendar year, January 1 to December 31, so Impact opens on its preset for the year rather than a custom range.

#### Scenario: 2026 so far
- **WHEN** on November 21, 2026 Impact gives 39% from solar, 30% from the Powerwalls and 31% from the grid for the year so far
- **THEN** the chapter gives the three shares under "Where the house's energy came from in 2026, car included" and links to `/impact?start=2026-01-01&end=2026-12-31`, where This year is marked as selected

#### Scenario: A past year
- **WHEN** a visitor picks 2024 in the year chapter
- **THEN** the chapter links to `/impact?start=2024-01-01&end=2024-12-31`

### Requirement: The records
The Records chapter SHALL offer four tabs, Best solar day, Most sent to PG&E in a day, Most sent to PG&E in a month, and Longest outage, Best solar day chosen by default, as tabs for assistive technology, all four shown in full without sideways scrolling at any width. Each tab SHALL list the top five of that Top Ten ranking as Top Ten shows it by default (an outage's length in days and hours), each linked to its day or month on the Solar page, and the chapter SHALL link to Top Ten.

#### Scenario: The best solar days
- **WHEN** a visitor opens `/` and June 13, 2022 is Top Ten's best solar day at 80.9 kWh
- **THEN** the chapter's first row gives 80.9 kWh on June 13, 2022, linked to `/solar?start=2022-06-01&end=2022-06-30&day=2022-06-13`

#### Scenario: The longest outage
- **WHEN** the longest outage lasted 52.3 hours from February 4, 2024
- **THEN** the Longest outage tab reads "2 d 4 h on February 4, 2024" and its first row gives 2 d 4 h

#### Scenario: Never off the grid
- **WHEN** Top Ten has no outages
- **THEN** the Longest outage tab says "The house hasn't been off the grid since it was approved to run on October 22, 2021."

### Requirement: A Records tab in the address
Choosing a Records tab SHALL put it in the address as `record` (`solar`, `sent-day`, `sent-month` or `outage`) without adding a history entry, keeping the address's other parameters, and opening such an address SHALL show that tab in the first response.

#### Scenario: A shared tab
- **WHEN** a visitor on `/?year=2024` chooses Longest outage, then reloads
- **THEN** the address is `/?year=2024&record=outage` and Longest outage is shown

### Requirement: How each record was beaten
Under its steps, each Records tab SHALL say how many days (or months) since the record was set have come within 2% of it, or that none has. Each Records tab SHALL chart its record since October 10, 2021 as steps, the highest figure up to each date, its y-axis marked at 0, the record and the lowest figure if below 0 (to a tenth, or in days and hours for outages), and its x-axis at each January 1. The current record SHALL be marked with its date and how long ago it was set ("set 4 years ago").

#### Scenario: A record that stands
- **WHEN** June 13, 2022 at 80.9 kWh is the best solar day and nothing has beaten it
- **THEN** the steps rise until June 13, 2022 and stay flat since, marked "set 4 years ago", and the tab says "Three days since have come within 2% of it" when June 20, 2023, June 17, 2024 and June 21, 2025 made at least 79.3 kWh

#### Scenario: A record set today
- **WHEN** today has made more solar than any day before
- **THEN** the last step rises today and is marked "set today"

#### Scenario: An axis in hours
- **WHEN** the longest outage lasted 52.3888 hours
- **THEN** the y-axis of the outage tab reads 0 and 2 d 4 h

#### Scenario: A series that starts below 0
- **WHEN** October 2021 imported 136.3 kWh more than it sent and April 2024's 479.2 kWh is the record
- **THEN** the month tab's y-axis reads -136.3, 0 and 479.2

### Requirement: Habits
The Habits chapter SHALL chart the always-on load by month, one line per year on a January to December axis in watts, as Patterns gives each month's figure. The current year SHALL be in the home color, last year in a darker gray than the years before it, and a key under the chart SHALL name the current year, last year and, when there are any, "earlier years". The chapter SHALL link to Patterns.

#### Scenario: This November
- **WHEN** Patterns shows November so far at 864 W
- **THEN** the 2026 line ends at November at 864 W, and the key names 2026

#### Scenario: Last year stands apart
- **WHEN** the chart holds 2022 to 2026 on 2026-11-24
- **THEN** 2025 is drawn darker than 2022 to 2024, and the key reads 2026, 2025 and earlier years

#### Scenario: No years before last
- **WHEN** the chart holds only 2025 and 2026
- **THEN** the key reads 2026 and 2025 alone

### Requirement: Habits' figures
Beside its chart, the Habits chapter SHALL say since which month the always-on load has run above (or below) the same month a year earlier, when that has held for three months or more, and otherwise how the latest month compares. It SHALL give the latest month and the same month a year earlier as Patterns labels them, and the watts between them, signed, followed by their difference in kWh a day as Patterns gives it. It SHALL NOT give the Powerwalls' energy out, which is not the house's habit.

#### Scenario: This November against last
- **WHEN** Patterns shows November so far at 864 W, November 2025 at 643 W and a difference of +5 kWh a day
- **THEN** the chapter gives 864 W and 643 W with Patterns' labels, then +221 W with "about +5 kWh a day more than a year ago"

#### Scenario: Below last year
- **WHEN** the latest month ran 400 W against 820 W a year earlier, a difference of -10 kWh a day
- **THEN** the chapter gives -420 W with "about -10 kWh a day less than a year ago"

#### Scenario: A run of months above last year
- **WHEN** July to November 2026 each ran above the same month of 2025 and June did not
- **THEN** the chapter says "Since July it has run above last year"

#### Scenario: No Powerwall figure
- **WHEN** 4.4 MWh has come out of the Powerwalls this year
- **THEN** Habits gives no Powerwall figure

### Requirement: Since 2021
The Since 2021 chapter SHALL chart, by month from October 2021 to today, the running totals of solar generated and of the house's use, as Impact gives each month's figures, each line named, the house's as including the car's charging, with today marked. It SHALL mark on the chart the payback years from the Payback card that have been reached, and say a projected one in words under the chart. The time axis SHALL be marked at each January 1 it spans, with that year. It SHALL link to True-Up.

#### Scenario: With costs
- **WHEN** the server has the costs file and the Payback card gives solar paid back in March 2025 and the whole system in 2028, projected
- **THEN** the chart marks March 2025, ends at today, and under it reads "The whole system is projected to pay back in 2028"

#### Scenario: Without costs
- **WHEN** the server has no costs file
- **THEN** the chapter shows its chart and figures and no payback marks

#### Scenario: The lines named
- **WHEN** a visitor reads the chart's legend
- **THEN** it names "solar generated" and "house used, car included"

#### Scenario: The years on the axis
- **WHEN** the chart runs from October 2021 to November 22, 2026
- **THEN** the axis reads 2022 to 2026, each at its January 1, so March 2025's payback mark falls just after "2025", and nothing is drawn past today

### Requirement: Since 2021's figures
Beside its chart, the Since 2021 chapter SHALL give the solar since October 10, 2021, and say whether solar has generated as much as the house used and by what share, as Impact gives it for that range. The current true-up year's net SHALL be given once, in the chapter's true-up explanation, with no separate net figure beside it.

#### Scenario: As much as the house used
- **WHEN** Impact gives 75,611 kWh of solar and 100% of the house's use for October 10, 2021 to today
- **THEN** the chapter says solar has generated as much as the house used (100%) and gives 75.6 MWh

#### Scenario: The true-up so far
- **WHEN** the true-up year that began October 1, 2026 has imported 611.4 kWh more than it sent
- **THEN** 611.4 kWh appears once in the chapter, in its true-up explanation, and no figure is labelled "more imported than sent this true-up year"

### Requirement: Since 2021 explains the true-up
The Since 2021 chapter SHALL explain the current true-up year as True-Up's year explanation does, in the same words, its net to a tenth. When the since-2021 share is 100% or more and the current year's is below 100%, it SHALL first say that the since-2021 share rests on the early years: "That 100% rests on the early years, when solar covered more than the house used."

#### Scenario: Matched but still importing
- **WHEN** the chapter shows 100% matched since 2021, and this true-up year solar has covered 73% of the house's use and imported 671.3 kWh more than it sent
- **THEN** the sentence reads "That 100% rests on the early years, when solar covered more than the house used. This true-up year solar has covered 73% of the house's use so far, so the house has drawn 671.3 kWh more from PG&E than it sent."

#### Scenario: Not yet matched
- **WHEN** the chapter shows 96% matched since 2021
- **THEN** the explanation gives the current year's sentence alone

### Requirement: The Powerwalls' payback in words
When the Payback card says the Powerwalls won't pay for themselves within their warranty, the Since 2021 chapter SHALL say so in words rather than give a year. Solar's payback SHALL be said once: by the chart's dotted line and its key once it is reached, and in words beside the figures only while it is projected.

#### Scenario: Beyond the warranty
- **WHEN** the Payback card gives no year for the Powerwalls because it lies beyond their 10-year warranty
- **THEN** the chapter says "The Powerwalls won't pay for themselves within their warranty"

#### Scenario: Solar paid back
- **WHEN** the Payback card gives solar paid back in March 2025
- **THEN** the key reads "dotted line: solar paid back, March 2025", and no sentence repeats it

#### Scenario: Solar projected
- **WHEN** the Payback card projects solar to pay for itself in 2027
- **THEN** no dotted line is drawn, and beside the figures the chapter says "Solar should pay for itself in 2027, projected."

### Requirement: No costs on the home page
The home page SHALL NOT show what the system cost, its net cost, the amount left or the share of its cost recovered, only years, and the month solar paid back once it has. PG&E's bill, as True-Up estimates it, MAY appear.

#### Scenario: Reading the page
- **WHEN** a visitor reads every chapter
- **THEN** no dollar figure about what the system cost appears

### Requirement: Pick a day
The page SHALL end with a date field limited to October 10, 2021 through today, a filled Go button that leads, and an outlined Random day button. The field SHALL start empty; submitting it (Go or Enter) SHALL open that day on the Solar page, and changing it alone SHALL NOT. A date outside the span SHALL be refused with a message naming the span, under the form, one line on a wide screen, the buttons unmoved. Random day SHALL open a day picked at random from that span.

#### Scenario: A random day
- **WHEN** a visitor presses Random day
- **THEN** a day between October 10, 2021 and today opens on `/solar` in its month

#### Scenario: A refused date on a wide screen
- **WHEN** a visitor at 1440 pixels submits a date before October 10, 2021
- **THEN** the message appears and the Go and Random day buttons stay where they were

### Requirement: Chapters below Today stay as served
The year, Records, Habits and Since 2021 chapters SHALL show the figures they were served with and SHALL NOT update while the page is open, except that the year switcher loads the year it is asked for.

#### Scenario: A totals event
- **WHEN** a totals event for today arrives
- **THEN** only the Today chapter reloads

### Requirement: The first screen on a phone
On a screen 390 pixels wide and 844 tall, the status line, the sentence, the house scene and the start of the Today chapter SHALL be visible without scrolling, with no horizontal scrolling anywhere on the page.

#### Scenario: Opening on a phone
- **WHEN** a visitor opens `/` on a 390 by 844 screen
- **THEN** they see the status line, the sentence, the house scene and today's solar so far before scrolling

### Requirement: The home page moves as the site does
The home page's charts and figures SHALL arrive and move to new values as site-motion says they do, and SHALL show their final state at once under reduced motion.

#### Scenario: Reduced motion
- **WHEN** a viewer with reduced motion on opens `/` and a new live status arrives
- **THEN** every chart and figure shows its final state at once, with no counting or drawing in

### Requirement: Today's morning sentence
While the day is young, the Today chapter SHALL say above its chart when the sun rose and between which hours most of today's expected solar will come: the middle 80% of the forecast's expected kWh by hour, from the start of the hour by which 10% has come to the end of the hour before 90% has. It SHALL show until that window begins, and not at all without the forecast's hours.

#### Scenario: 8 AM
- **WHEN** at 8:00 AM the sun rose at 6:58 AM, 22.6 kWh is expected, and 10% of it comes by 10 AM and 90% by 3 PM
- **THEN** the chapter reads "Sunrise 6:58 AM. Most of today's 22.6 kWh is expected between 10 AM and 3 PM."

#### Scenario: Late morning
- **WHEN** it is 10:30 AM, after the window began
- **THEN** there is no morning sentence

#### Scenario: No hourly forecast
- **WHEN** the forecast card has no hours for today
- **THEN** there is no morning sentence

### Requirement: Since 2021's dollar estimate
Beside its chart, first among the chapter's figures, the Since 2021 chapter SHALL give True-Up's dollar estimate for the current true-up year, as its headline gives it: the range, then "on track to owe at the <month year> true-up". Without dollar projections it SHALL give none.

#### Scenario: The estimate
- **WHEN** True-Up projects $610 to $654 due at the October 2027 true-up
- **THEN** the chapter gives "$610 to $654", then "on track to owe at the October 2027 true-up"

#### Scenario: No dollar projections
- **WHEN** True-Up has only a kWh projection for the current year
- **THEN** the chapter gives no dollar figure, and the net still appears in its true-up explanation
