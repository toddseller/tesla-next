# true-up-tracker Specification

## Purpose
The True-Up Tracker page shows where the house stands for its PG&E NEM true-up: grid energy by billing cycle, the running net through each true-up year, the year in dollars and Tesla's VPP credit, for the range in the page's address.

## Requirements

### Requirement: The range is in the address
The True-Up Tracker (`/true-up`) SHALL show the range given by its `start` and `end` parameters, each a `YYYY-MM-DD` date in the site's time zone, rendered on the server with its data. Each tab SHALL keep its own range, and opening the same address SHALL show the same range.

#### Scenario: A shared link
- **WHEN** a visitor opens `/true-up?start=2025-10-01&end=2026-09-30`
- **THEN** the page shows '25 - '26, with its cycles in the first response

### Requirement: Default and invalid ranges
When `start` and `end` are both missing, the page SHALL show the current true-up year (see true-up-cycles). When either is given but `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL redirect to its address without `start` and `end`, keeping its other parameters, so the address names the range shown.

#### Scenario: No range in November
- **WHEN** a visitor opens `/true-up` on 2026-11-08
- **THEN** the page shows 2026-10-01 to 2027-09-30

#### Scenario: No range before the October read
- **WHEN** a visitor opens `/true-up` on 2026-10-04, the day before the October read
- **THEN** the page shows 2025-10-01 to 2026-09-30

#### Scenario: A range past the horizon
- **WHEN** a visitor opens `/true-up?start=2030-10-01&end=2031-09-30` on 2026-11-08
- **THEN** the visitor is redirected to `/true-up`, which shows 2026-10-01 to 2027-09-30

### Requirement: Year picker
The page SHALL offer the tail of the dashboard shell's preset core, each changing the address: True-up year (the current true-up year) and All time (2021-10-01 to the current year's end); True-up year's step buttons, which step a true-up year by a year; and the date-range picker the other pages use. The control matching the shown range SHALL be marked as selected. In a window narrower than 640 pixels True-up year and All time SHALL be one menu, as the dashboard shell's range presets on a phone are.

#### Scenario: In 2026
- **WHEN** a visitor opens the page on 2026-11-08
- **THEN** the presets are True-up year and All time, with True-up year marked as selected

#### Scenario: In 2036
- **WHEN** a visitor opens the page on 2036-11-08
- **THEN** the presets are still True-up year and All time, with no year buttons and no Earlier menu

#### Scenario: An earlier year picked
- **WHEN** a visitor showing the current year presses Previous true-up year on 2026-11-08
- **THEN** the address becomes `/true-up?start=2025-10-01&end=2026-09-30`, the True-up year preset stays marked and reads '25 - '26, and the page shows '25 - '26 with its tiles and headline

#### Scenario: An earlier year picked on a phone
- **WHEN** a visitor on a 390-pixel-wide screen showing the current year presses Previous true-up year on 2026-11-08
- **THEN** the address becomes `/true-up?start=2025-10-01&end=2026-09-30`, and the menu's button reads '25 - '26

#### Scenario: Before the October read
- **WHEN** a visitor opens the page on 2026-10-04, the day before the October read
- **THEN** True-up year shows 2025-10-01 to 2026-09-30, the current true-up year

#### Scenario: All time
- **WHEN** a visitor picks All time on 2026-11-08
- **THEN** the page shows 2021-10-01 to 2027-09-30

### Requirement: Year names stay on one line
A true-up year's name ("'24 - '25") SHALL NOT break across lines anywhere on the page.

#### Scenario: Projection on a phone
- **WHEN** the current year's projection is shown on a 390-pixel-wide screen
- **THEN** "'24 - '25" and "'25 - '26" each appear whole on one line

### Requirement: Net tile
The page SHALL head the range with a tile of its net in kWh, labeled "Imported" or "Exported" by its sign (a net of 0.0 reads "Exported"), with the imported and exported totals and the net in peak hours (4 to 9 p.m.) and off-peak. It SHALL be titled "Net so far" for the current year, "Net for the year" for a finished year, and "Net" otherwise.

#### Scenario: Importing so far
- **WHEN** the current year's cycles have imported 660.1 kWh and exported 251.4 kWh, -15.8 kWh net in peak hours
- **THEN** the tile reads Net so far 408.6 kWh imported, with Peak 15.8 exported and Off-peak 424.4 imported

#### Scenario: Ahead in summer
- **WHEN** the shown cycles have imported 50 kWh and exported 450 kWh
- **THEN** the net reads 400.0 kWh exported, in the page's normal text color

### Requirement: Dollar tiles for a true-up year
With one true-up year shown, the page SHALL add tiles from its true-up cost: for the current year, the charges so far marked as an estimate when calculated; for a finished year, the amount due and whether it came from PG&E's statement. Amounts SHALL be before taxes and SHALL say the Base Services Charge and WestLight Energy's generation charges are billed separately.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown
- **THEN** a True-up tile reads $767.73, from PG&E's statement, NEM charges of $827.82 less $60.09 of minimum delivery charges already paid

#### Scenario: Current year
- **WHEN** the current year is shown with $106.46 of calculated charges so far
- **THEN** a Charges so far tile reads $106.46, estimate

#### Scenario: Credit left over
- **WHEN** '23 - '24 is shown, calculated at nothing due with $58.03 of unused credit and $15.07 of Net Surplus Compensation on 412.3 kWh exported
- **THEN** the True-up tile reads nothing due (estimate), and says $58.03 of unused credit isn't paid out and PG&E pays about $15 of Net Surplus Compensation on the 412.3 kWh exported

#### Scenario: No dollars before '23 - '24
- **WHEN** '22 - '23 is shown
- **THEN** the True-up tile says its dollars aren't shown, because PG&E's statement for it isn't available and the rates it was billed at aren't stored

#### Scenario: All time or a custom range
- **WHEN** All time or a custom range is shown
- **THEN** only the Net tile is shown, and the cycle list still shows each cycle's charges

### Requirement: Billed against estimate tile
With one true-up year shown and at least one of its cycles having both PG&E's charge and an estimate, the page SHALL add a tile with PG&E's total for those cycles, how many there are, the estimate's total for them, and how far the estimate was under or over, or that it was exact.

#### Scenario: A finished year
- **WHEN** '25 - '26 is shown, its 12 cycles billed $827.82 and estimated $825.00
- **THEN** the tile reads $2.82 under, PG&E billed $827.82 for 12 cycles; the estimate for them was $825.00

#### Scenario: Nothing billed
- **WHEN** no cycle of the shown year has PG&E's charge
- **THEN** there is no such tile

### Requirement: VPP credit tile
With one true-up year shown that has a VPP season, the page SHALL add a Tesla VPP credit tile, saying Tesla pays it apart from PG&E's true-up: a paid season's payout and the month it was paid; an unpaid season's estimate, marked as such, with its kWh and when payment is expected (spring after the season); "Not started" with when the season runs, May 1 to October 31, before the season's May 1; and $0 with no events marked yet when the season has begun and its estimate is zero.

#### Scenario: '25 - '26 before the payout
- **WHEN** '25 - '26 is shown on 2026-11-08 with $367.60 estimated on 183.8 kWh
- **THEN** the tile reads $368 estimate, 2026 season, paid around spring 2027

#### Scenario: Paid season
- **WHEN** '24 - '25 is shown
- **THEN** the tile reads $728.26, 2025 season, paid April 2026

#### Scenario: Current year
- **WHEN** the current year is shown on 2026-11-08
- **THEN** the tile reads Not started, 2027 season, which runs May 1 to October 31

#### Scenario: A season under way with nothing marked
- **WHEN** the current year is shown on 2027-06-10 with no VPP events marked for 2027
- **THEN** the tile reads $0, 2027 season, no events marked yet

#### Scenario: Before the first season
- **WHEN** '22 - '23 is shown
- **THEN** there is no VPP tile

### Requirement: Metering fault note
When the shown cycles include days before April 27, 2026 without PG&E data, the page SHALL say how many such days there are and that their grid figures read about half of what PG&E's meter recorded, because of a Tesla metering fault since corrected.

#### Scenario: Past true-up year
- **WHEN** '25 - '26 is shown and only January 28, 2026 lacks PG&E data
- **THEN** the note says 1 day uses Tesla's grid readings

#### Scenario: Current year
- **WHEN** the current year is shown
- **THEN** no note is shown

### Requirement: Cycle chart
The page SHALL chart each started cycle's imports as a bar above zero in the grid color and its exports below in the solar color, each rounded only at its outer end, square at zero, with a running net line in Tesla red that starts again at each true-up year's first cycle. Months label the cycles, and a legend names every series shown.

#### Scenario: Current year in November
- **WHEN** the current year is shown on 2026-11-08
- **THEN** the chart has bars for two cycles, October and November, and slots for all twelve

#### Scenario: All time
- **WHEN** All time is shown
- **THEN** the running net returns to that cycle's own net at the first cycle of each true-up year

### Requirement: Last year and projection on the chart
With one true-up year shown, the chart SHALL show last year's running net as a dashed line across its cycles, and, with a kWh projection, a band from the open cycle to the twelfth between the lowest and highest projected running net, named in the legend. Neither SHALL show for other ranges.

#### Scenario: October
- **WHEN** the current year is shown on October 21, 2026 with one cycle open
- **THEN** the band runs from the open cycle to the twelfth, and the dashed line shows all 12 cycles of '25 - '26

#### Scenario: A custom range
- **WHEN** a custom range is shown
- **THEN** there is no dashed line and no band

### Requirement: Cycle list
Under the chart the page SHALL list each started cycle with its dates, imported, exported, net and NEM charges, fitting a phone without sideways scrolling. A calculated charge SHALL be marked "est."; a credit SHALL read like "$118.81 credit", never in red; a cycle with PG&E's charge SHALL show under it its estimate, when there is one, and PG&E's net kWh. The open cycle SHALL show the last day it covers.

#### Scenario: Open cycle
- **WHEN** the current cycle started November 3 and the data runs through November 8
- **THEN** its row reads "Nov 3 to Nov 8 (so far)", with its charges so far marked "est."

#### Scenario: Estimate under PG&E's charge
- **WHEN** a cycle has PG&E's $113.41 on 364 kWh net and an estimate of $113.72
- **THEN** it shows $113.41, and under it "est. $113.72 · PG&E net 364 kWh"

### Requirement: Layout
On a 375-pixel-wide screen the page SHALL show its tiles, chart and cycle list in one column with no horizontal scrolling and nothing overlapping; on wider screens the tiles SHALL sit side by side as they fit, and from 1280 pixels every tile SHALL sit on one row.

#### Scenario: Phone
- **WHEN** a viewer opens the current year on a 375-pixel-wide screen
- **THEN** the headline, every tile, the chart and every cycle's figures are visible without scrolling sideways

#### Scenario: Five tiles on a wide screen
- **WHEN** a viewer opens the current year at 1440 pixels, with its net, charges, billed and VPP tiles
- **THEN** all four sit on one row, each figure whole within its tile

### Requirement: The range stays current
When a `totals` event arrives for a day from the first shown cycle's first day to the last shown cycle's last day, the page SHALL reload its data without reloading the page; other days SHALL NOT reload it. When the stream opens again after it was lost, the page SHALL reload if those days include today. A failed reload SHALL keep the shown data.

#### Scenario: Viewing the current year
- **WHEN** the current year is shown and a `totals` event arrives for today
- **THEN** the tiles, chart and list update in place

#### Scenario: The last cycle runs past September 30
- **WHEN** '25 - '26 is shown and a `totals` event arrives for 2026-10-02, inside its last cycle
- **THEN** the page reloads its data

#### Scenario: Viewing a past year
- **WHEN** '24 - '25 is shown and a `totals` event arrives for today
- **THEN** the page does not reload its data

### Requirement: Savings card
With one true-up year from '23 - '24 on shown, a card below the tiles, "What the system saved" (see true-up-savings), SHALL show the saving in whole dollars ("so far" for the current year) of the no-system cost, and a key giving what was paid (PG&E and WestLight Energy), what solar saved, and the Powerwalls. The shown dollars SHALL add up, the Powerwalls' amount being solar's saving less the saving, and cost or saved read from it; a cost SHALL be shown as taken from solar's saving.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, costing $6,693.86 with no system, $966.56 with solar only and $1,118.07 actual ($825.00 PG&E, $293.07 WestLight)
- **THEN** the card reads $5,576 saved of $6,694, and its key reads Paid $1,118 (PG&E $825, WestLight $293) and Saved $5,576, with "Solar $5,727 against buying it all from the grid, less the Powerwalls' $151" under it

#### Scenario: The current year
- **WHEN** the current year is shown
- **THEN** the card reads its saving so far, through the last day counted

#### Scenario: '23 - '24
- **WHEN** '23 - '24 is shown
- **THEN** the savings card is shown

#### Scenario: Before '24 - '25, All time or a custom range
- **WHEN** '22 - '23, All time or a custom range is shown
- **THEN** there is no savings card

### Requirement: The savings key when the Powerwalls cost money
When the Powerwalls cost money, the savings card's key SHALL name the bar's two parts, Paid and Saved, with solar's saving less the Powerwalls' cost in the line under Saved; a year they saved money SHALL keep Solar saved beside its own part of the bar.

#### Scenario: The Powerwalls cost $151
- **WHEN** '25 - '26 is shown, solar saving $5,727 and the Powerwalls costing $151
- **THEN** the key reads Saved $5,576, with "Solar $5,727 against buying it all from the grid, less the Powerwalls' $151" under it

### Requirement: Savings bar
The card SHALL draw the no-system cost as one bar split into paid, Powerwalls saved and solar saved, each part's length in proportion to its dollars and in the grid, Powerwall and solar colors. The bar SHALL be announced as an image whose label reads out each part.

#### Scenario: A year the Powerwalls saved money
- **WHEN** a year is shown with $905 paid, $216 saved by the Powerwalls and $2,289 by solar
- **THEN** the bar's parts are in the proportion 905 to 216 to 2,289, and a screen reader hears all three amounts

### Requirement: The Powerwalls in the key
The key SHALL give the Powerwalls' effect on the bill, "saved" or "cost" with the amount as the savings card shows it, and beside it the year's VPP credit from the VPP credit tile: the season's payout, or its estimate marked as one. When the Powerwalls cost money, the bar SHALL show only paid and saved, and the key SHALL say that under NEM2 exporting solar earns about what importing it later costs, so storing it pays only between 4 and 9 p.m. The effect's two parts and the peak-only line follow it (see The Powerwalls' effect explained).

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, its Powerwalls having added -$151.51, with the 2026 season's VPP credit estimated at $367.60
- **THEN** the key reads Powerwalls cost $151 on the bill, VPP credit $368 (estimate), with the NEM2 sentence, and the bar has a paid part and a saved part only

#### Scenario: A paid season
- **WHEN** '24 - '25 is shown, the 2025 season paid $728.26
- **THEN** the Powerwalls' entry gives the VPP credit as $728

#### Scenario: No season yet
- **WHEN** the current year is shown on 2026-11-08, with no VPP events marked for 2027
- **THEN** the Powerwalls' entry gives no VPP credit

### Requirement: The card names its estimates
The card SHALL say its figures are estimates of PG&E's and WestLight Energy's charges; how many of the year's days before April 27, 2026 were rebuilt from PG&E's meter or used without it, when there are any; when the last day counted is more than 12 months after the newest WestLight rate's date, that WestLight's rates are from that date; and when any WestLight rate used was estimated, that WestLight's generation rates are estimated from PG&E's.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, with 205 days rebuilt and January 28, 2026 without PG&E's reading
- **THEN** the card says 205 days before April 27, 2026 were rebuilt from PG&E's meter and 1 is as Tesla read it

#### Scenario: Rates out of date
- **WHEN** the current year is shown on 2027-11-01 and the newest WestLight rate is from 2026-03-01
- **THEN** the card says WestLight's rates are from March 2026

#### Scenario: '23 - '24
- **WHEN** '23 - '24 is shown
- **THEN** the card says WestLight's generation rates that year are estimated from PG&E's

### Requirement: The card on a phone
On a 375-pixel-wide screen the card SHALL fit the page's single column with no horizontal scrolling, its key stacked as one label and amount per row.

#### Scenario: Phone
- **WHEN** '25 - '26 is shown on a 375-pixel-wide screen
- **THEN** the bar spans the card and each key row shows its label and amount without scrolling sideways

### Requirement: Savings stay current
When the page reloads its data for a `totals` event or a reopened stream (see The range stays current), it SHALL reload the savings too. A failed reload SHALL keep the shown savings.

#### Scenario: Viewing the current year
- **WHEN** the current year is shown and a `totals` event arrives for today
- **THEN** the savings card updates in place

### Requirement: The Powerwalls' effect explained
Under the Powerwalls' bill effect the key SHALL give its parts: what the held days added, as keeping charge on that many days; what the used days added, as storing solar on that many days; what the VPP event days added, as VPP events on that many days; and what the storm watch days added, as storm watch on that many days; each "saved" or "cost" with its amount in whole dollars, a part with no days left out. Set apart from those figures and labeled as a simulation, it SHALL say how much less or more peak-only on the used days would have cost.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown with 129 held days that added -$83.40, 232 used days that added -$110.61, 6 VPP event days that added $42.50, and a peak-only case costing $985.01 against $1,118.07 actual
- **THEN** the key reads $83 cost keeping charge on 129 days, $111 cost storing solar on 232 days, $43 saved on VPP events on 6 days, and that covering only 4 to 9 p.m. on those 232 days would have cost about $133 less (simulation)

#### Scenario: Peak-only costs more
- **WHEN** a year's peak-only case costs $12.40 more than what happened
- **THEN** the key says covering only 4 to 9 p.m. would have cost about $12 more (simulation)

#### Scenario: VPP events
- **WHEN** '24 - '25's 7 VPP event days added $73.28 to the bill
- **THEN** the key reads $73 saved on VPP events, 7 days, beside the VPP credit

#### Scenario: No used days
- **WHEN** every day of the year so far was held
- **THEN** the key gives the held part and no peak-only line

#### Scenario: Storm watch days
- **WHEN** a year's 3 storm watch days added -$18.40 to the bill
- **THEN** the key reads $18 cost on storm watch, 3 days

#### Scenario: No storm watch yet
- **WHEN** a year has no storm watch days
- **THEN** the key has no storm watch line

### Requirement: The Payback card on the page
The True-Up Tracker SHALL show the Payback card (see system-payback) right after the savings card, or after the tiles and metering note when no savings card is shown, for every range, rendered with the page and reloaded when the savings are.

#### Scenario: A totals event
- **WHEN** a `totals` event arrives for today
- **THEN** the Payback card updates in place, with no page reload

#### Scenario: A true-up year
- **WHEN** a true-up year with savings is shown
- **THEN** the Payback card follows the savings card and comes before the billing-cycle chart

#### Scenario: All time
- **WHEN** All time is shown, with no savings card
- **THEN** the Payback card follows the tiles and comes before the billing-cycle chart

### Requirement: The headline
When a true-up year has something its tiles don't say, the page SHALL lead with it as a headline sentence under the "True-Up Tracker" heading, at the shared lead size with its figures in mono, in place of the subtitle. The heading SHALL stay at its full size. Without a headline the heading and subtitle SHALL stay as they are.

#### Scenario: A headline
- **WHEN** the current year has a dollar projection
- **THEN** "True-Up Tracker" heads the page at 22 pixels and the headline sits under it at the size of Solar's and Impact's lead sentences

#### Scenario: All time
- **WHEN** All time is shown
- **THEN** the page has no headline, and "True-Up Tracker" heads it with its subtitle

### Requirement: The current year's headline
With dollar projections, the headline SHALL give the lowest and highest projected amount due in whole dollars, the true-up's month, and the charges so far when there are any: "On track to owe $611 to $657 at the October 2027 true-up; $180 in charges so far." With a kWh projection only, it SHALL give the projected year-end net. A muted line under it SHALL name the years the projection comes from.

#### Scenario: Two comparable years
- **WHEN** the current year projects $611.45 and $656.69, and 2,092.1 and 2,376.1 kWh imported, from '24 - '25 and '25 - '26, with $180.23 of charges so far
- **THEN** the headline reads "On track to owe $611 to $657 at the October 2027 true-up; $180 in charges so far.", over "Year-end 2,092 to 2,376 kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26"

#### Scenario: Without rates
- **WHEN** the current year has a kWh projection of 2,092.1 and 2,376.1 kWh imported and no dollar projections
- **THEN** the headline reads "On track to end '26 - '27 with 2,092 to 2,376 kWh imported.", over "If the rest of the year goes like '24 - '25 or '25 - '26"

#### Scenario: A projection crossing zero
- **WHEN** the kWh projection runs from 120 kWh exported to 80 kWh imported, without dollars
- **THEN** the headline reads "On track to end '26 - '27 between 120 kWh exported and 80 kWh imported."

#### Scenario: No projection yet
- **WHEN** the current year has no kWh projection
- **THEN** the page has no headline

### Requirement: A past year's headline
For a finished year whose amount due is known, and the year before's too, the headline SHALL give the amount in whole dollars against the year before's: "'25 - '26 ended owing $768 at the true-up, $213 more than '24 - '25." It SHALL read "less than" for a smaller amount and "the same as" for an equal one, and "ended with nothing due" when nothing was due. Without both amounts there SHALL be no headline.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, owing $767.73, and '24 - '25 owed $554.83
- **THEN** the headline reads "'25 - '26 ended owing $768 at the true-up, $213 more than '24 - '25."

#### Scenario: Less than the year before
- **WHEN** '26 - '27 is shown owing $500.00, and '25 - '26 owed $767.73
- **THEN** the headline reads "'26 - '27 ended owing $500 at the true-up, $268 less than '25 - '26."

#### Scenario: Nothing due
- **WHEN** '26 - '27 is shown with nothing due, and '25 - '26 owed $767.73
- **THEN** the headline reads "'26 - '27 ended with nothing due at the true-up, $768 less than '25 - '26."

#### Scenario: The year before unknown
- **WHEN** '23 - '24 is shown, and '22 - '23's amount isn't known
- **THEN** the page has no headline
