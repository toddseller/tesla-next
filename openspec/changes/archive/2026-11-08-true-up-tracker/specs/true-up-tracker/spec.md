# Spec Delta

## Purpose

The True-Up Tracker page shows where the house stands for its PG&E NEM true-up: grid energy by billing cycle, the running net through each true-up year, the year in dollars and Tesla's VPP credit, for the range in the page's address.

## ADDED Requirements

### Requirement: The range is in the address
The True-Up Tracker (`/true-up`) SHALL show the range given by its `start` and `end` parameters, each a `YYYY-MM-DD` date in the site's time zone, rendered on the server with its data. Each tab SHALL keep its own range, and opening the same address SHALL show the same range.

#### Scenario: A shared link
- **WHEN** a visitor opens `/true-up?start=2025-10-01&end=2026-09-30`
- **THEN** the page shows '25 - '26, with its cycles in the first response

### Requirement: Default and invalid ranges
When `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL show the current true-up year (see true-up-cycles).

#### Scenario: No range in November
- **WHEN** a visitor opens `/true-up` on 2026-11-08
- **THEN** the page shows 2026-10-01 to 2027-09-30

#### Scenario: No range before the October read
- **WHEN** a visitor opens `/true-up` on 2026-10-04, the day before the October read
- **THEN** the page shows 2025-10-01 to 2026-09-30

### Requirement: Year picker
The page SHALL offer, each changing the address: This year (the current true-up year) and the two years before it as buttons labeled like "'25 - '26"; an Earlier menu with every older year, newest first; All time (2021-10-01 to the current year's end); and the date-range picker the other pages use. The control matching the shown range SHALL be marked as selected.

#### Scenario: In 2026
- **WHEN** a visitor opens the page on 2026-11-08
- **THEN** the buttons are This year, '25 - '26 and '24 - '25, and Earlier lists '23 - '24, '22 - '23 and '21 - '22

#### Scenario: In 2036
- **WHEN** a visitor opens the page on 2036-11-08
- **THEN** there are still three year buttons, This year, '35 - '36 and '34 - '35, and Earlier lists the thirteen years from '33 - '34 to '21 - '22

#### Scenario: An earlier year picked
- **WHEN** a visitor picks '22 - '23 from Earlier
- **THEN** the address becomes `/true-up?start=2022-10-01&end=2023-09-30`, and the Earlier button reads '22 - '23 and is marked as selected

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

### Requirement: Projection tile
When the current year has a kWh projection, the page SHALL add a Projected true-up tile: the lowest and highest projected amount due when there are dollar projections, and the lowest and highest projected year-end net, naming the years they come from. A range crossing zero SHALL read "between N kWh exported and M kWh imported".

#### Scenario: Two comparable years
- **WHEN** the current year projects $592.92 and $652.39, and 2,031.9 and 2,361.5 kWh imported, from '24 - '25 and '25 - '26
- **THEN** the tile reads $593 to $652, and year-end 2,032 to 2,362 kWh imported, if the rest of the year goes like '24 - '25 or '25 - '26

#### Scenario: Without rates
- **WHEN** the current year has a kWh projection and no dollar projections
- **THEN** the tile gives the kWh projection alone

#### Scenario: A finished year
- **WHEN** a finished true-up year is shown
- **THEN** there is no Projected true-up tile

### Requirement: Billed against estimate tile
With one true-up year shown and at least one of its cycles having both PG&E's charge and an estimate, the page SHALL add a tile with PG&E's total for those cycles, how many there are, the estimate's total for them, and how far the estimate was under or over, or that it was exact.

#### Scenario: A finished year
- **WHEN** '25 - '26 is shown, its 12 cycles billed $827.82 and estimated $825.00
- **THEN** the tile reads $2.82 under, PG&E billed $827.82 for 12 cycles; the estimate for them was $825.00

#### Scenario: Nothing billed
- **WHEN** no cycle of the shown year has PG&E's charge
- **THEN** there is no such tile

### Requirement: VPP credit tile
With one true-up year shown that has a VPP season, the page SHALL add a Tesla VPP credit tile, saying Tesla pays it apart from PG&E's true-up: a paid season's payout and the month it was paid; an unpaid season's estimate, marked as such, with its kWh and when payment is expected (spring after the season); $0 with no events marked yet when its estimate is zero.

#### Scenario: '25 - '26 before the payout
- **WHEN** '25 - '26 is shown on 2026-11-08 with $367.60 estimated on 183.8 kWh
- **THEN** the tile reads $368 estimate, 2026 season, paid around spring 2027

#### Scenario: Paid season
- **WHEN** '24 - '25 is shown
- **THEN** the tile reads $728.26, 2025 season, paid April 2026

#### Scenario: Current year
- **WHEN** the current year is shown on 2026-11-08
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
On a 375-pixel-wide screen the page SHALL show its tiles, chart and cycle list in one column with no horizontal scrolling and nothing overlapping; on wider screens the tiles SHALL sit side by side as they fit.

#### Scenario: Phone
- **WHEN** a viewer opens the current year on a 375-pixel-wide screen
- **THEN** every tile, the chart and every cycle's figures are visible without scrolling sideways

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
