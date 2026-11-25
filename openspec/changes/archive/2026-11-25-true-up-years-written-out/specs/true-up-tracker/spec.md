## MODIFIED Requirements

### Requirement: Default and invalid ranges
When `start` and `end` are both missing, the page SHALL show the current true-up year (see true-up-cycles). When either is given but `start` or `end` is missing, is not a `YYYY-MM-DD` calendar date, is before 2021-10-01, is more than 732 days after today in the site's time zone, or `start` is after `end`, the page SHALL redirect to its address without `start` and `end`, keeping its other parameters and adding `unshown=1`, so the address names the range shown and the page knows to say so. An address with `unshown=1` SHALL show one line under the page's title naming the range it shows instead, as the browser tab's title names it ("That link asked for dates the site doesn't have, so this shows 2026-27."), and SHALL then remove `unshown` from the address without reloading, so a reload or a copied link shows the page without the line.

#### Scenario: No range in November
- **WHEN** a visitor opens `/true-up` on 2026-11-08
- **THEN** the page shows 2026-10-01 to 2027-09-30, with no line about the link

#### Scenario: No range before the October read
- **WHEN** a visitor opens `/true-up` on 2026-10-04, the day before the October read
- **THEN** the page shows 2025-10-01 to 2026-09-30

#### Scenario: A range past the horizon
- **WHEN** a visitor opens `/true-up?start=2030-10-01&end=2031-09-30` on 2026-11-08
- **THEN** the visitor is redirected to `/true-up?unshown=1`, which shows 2026-10-01 to 2027-09-30 with "That link asked for dates the site doesn't have, so this shows 2026-27." under the title

#### Scenario: The line leaves the address
- **WHEN** the page has shown the line for `/true-up?unshown=1`
- **THEN** the address reads `/true-up`, and reloading it shows the page without the line

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
- **THEN** the address becomes `/true-up?start=2025-10-01&end=2026-09-30`, the True-up year preset stays marked and reads 2025-26, and the page shows 2025-26 with its tiles and headline

#### Scenario: An earlier year picked on a phone
- **WHEN** a visitor on a 390-pixel-wide screen showing the current year presses Previous true-up year on 2026-11-08
- **THEN** the address becomes `/true-up?start=2025-10-01&end=2026-09-30`, and the menu's button reads 2025-26

#### Scenario: Before the October read
- **WHEN** a visitor opens the page on 2026-10-04, the day before the October read
- **THEN** True-up year shows 2025-10-01 to 2026-09-30, the current true-up year

#### Scenario: All time
- **WHEN** a visitor picks All time on 2026-11-08
- **THEN** the page shows 2021-10-01 to 2027-09-30

### Requirement: Year names stay on one line
A true-up year's name ("2024-25") SHALL NOT break across lines anywhere on the page.

#### Scenario: Projection on a phone
- **WHEN** the current year's projection is shown on a 390-pixel-wide screen
- **THEN** "2024-25" and "2025-26" each appear whole on one line

### Requirement: Billed against estimate tile
With one true-up year shown and at least one of its cycles having both PG&E's charge and an estimate, the page SHALL add a tile with PG&E's total for those cycles, how many there are, the estimate's total for them, and how much more or less PG&E billed than the estimate, or that it was exact.

#### Scenario: A finished year
- **WHEN** 2025-26 is shown, its 12 cycles billed $827.82 and estimated $825.00
- **THEN** the tile reads $2.82 more than the estimate, PG&E billed $827.82 for 12 cycles; the estimate for them was $825.00

#### Scenario: Billed less than the estimate
- **WHEN** 2024-25 is shown, its cycles billed $612.40 and estimated $613.00
- **THEN** the tile reads $0.60 less than the estimate

#### Scenario: Nothing billed
- **WHEN** no cycle of the shown year has PG&E's charge
- **THEN** there is no such tile

### Requirement: Cycle list
Under the chart the page SHALL list each started cycle with its dates, imported, exported, net and NEM charges, fitting a phone without sideways scrolling. A calculated charge SHALL be marked "est."; a credit SHALL read like "$118.81 credit", never in red; a cycle with PG&E's charge SHALL show under it its estimate, when there is one, and PG&E's net kWh. The open cycle SHALL show the last day it covers. When the cycles listed span more than one true-up year, each year SHALL be a row in the list's columns that opens to show its cycles, giving the year's name and its cycles' imported, exported and net, and the sum of their NEM charges, marked "est." when any of them is calculated and left out when any cycle has none. At All time only the last year listed SHALL start open, the others closed; for any other range every year SHALL start open, since its first or last year can be cut short. Each opens and closes from the keyboard as well as by pointer. From 640 pixels wide, every row SHALL set its dates, imported, exported, net and charges in the same columns, whether or not it has charges.

#### Scenario: Open cycle
- **WHEN** the current cycle started November 3 and the data runs through November 8
- **THEN** its row reads "Nov 3 to Nov 8 (so far)", with its charges so far marked "est."

#### Scenario: Estimate under PG&E's charge
- **WHEN** a cycle has PG&E's $113.41 on 364 kWh net and an estimate of $113.72
- **THEN** it shows $113.41, and under it "est. $113.72 · PG&E net 364 kWh"

#### Scenario: Cycles across true-up years
- **WHEN** All time is shown, its cycles starting in both 2025-26 and 2026-27
- **THEN** the list has a row for 2025-26 and one for 2026-27, with 2026-27's cycles shown and 2025-26's hidden until its row is opened

#### Scenario: A custom range across true-up years
- **WHEN** 2026-08-01 to 2026-11-30 is shown, its cycles starting in both 2025-26 and 2026-27
- **THEN** both years' rows start open, so 2025-26's totals show the two cycles they come from

#### Scenario: A year's row
- **WHEN** All time is shown and 2025-26's 12 cycles imported 4,210.5 kWh and exported 3,980.2 kWh, with PG&E's charges for all of them summing to $1,012.40
- **THEN** its row reads 2025-26, Imported 4,210.5, Exported 3,980.2, Net 230.3 imported and $1,012.40

#### Scenario: A year with calculated charges
- **WHEN** All time is shown and the current year's cycles so far have calculated charges summing to $180.12
- **THEN** its row's charges read "$180.12 est."

#### Scenario: A year with a cycle without charges
- **WHEN** All time is shown and one of 2022-23's cycles has no charges
- **THEN** 2022-23's row gives no charges

#### Scenario: One true-up year
- **WHEN** 2025-26 is shown
- **THEN** the list has no year rows, only its cycles

#### Scenario: Columns stay put
- **WHEN** the list is 640 pixels wide or more and shows a cycle without charges above one with charges
- **THEN** both rows' imported, exported and net figures start at the same horizontal positions

### Requirement: The current year's headline
With dollar projections, the headline SHALL give the lowest and highest projected amount due in whole dollars, the true-up's month, and the charges so far when there are any: "On track to owe $611 to $657 at the October 2027 true-up; $180 in charges so far." With a kWh projection only, it SHALL give the projected year-end net. Its kWh SHALL read as `display-units` reads energy, both ends of a range in the unit the larger takes. A muted line under it SHALL name the years the projection comes from.

#### Scenario: Two comparable years
- **WHEN** the current year projects $611.45 and $656.69, and 2,092.1 and 2,376.1 kWh imported, from 2024-25 and 2025-26, with $180.23 of charges so far
- **THEN** the headline reads "On track to owe $611 to $657 at the October 2027 true-up; $180 in charges so far.", over "Year-end 2.1 to 2.4 MWh imported, if the rest of the year goes like 2024-25 or 2025-26"

#### Scenario: Without rates
- **WHEN** the current year has a kWh projection of 2,092.1 and 2,376.1 kWh imported and no dollar projections
- **THEN** the headline reads "On track to end 2026-27 with 2.1 to 2.4 MWh imported.", over "If the rest of the year goes like 2024-25 or 2025-26"

#### Scenario: A projection crossing zero
- **WHEN** the kWh projection runs from 120 kWh exported to 80 kWh imported, without dollars
- **THEN** the headline reads "On track to end 2026-27 between 120 kWh exported and 80 kWh imported."

#### Scenario: No projection yet
- **WHEN** the current year has no kWh projection
- **THEN** the page has no headline

### Requirement: A past year's headline
For a finished year whose amount due is known, and the year before's too, the headline SHALL give the amount in whole dollars against the year before's: "2025-26 ended owing $768 at the true-up, $213 more than 2024-25." It SHALL read "less than" for a smaller amount and "the same as" for an equal one, "ended with nothing due" when nothing was due, and "after nothing due in <year before>" when only the year before owed nothing. Without both amounts there SHALL be no headline.

#### Scenario: '25 - '26
- **WHEN** 2025-26 is shown, owing $767.73, and 2024-25 owed $554.83
- **THEN** the headline reads "2025-26 ended owing $768 at the true-up, $213 more than 2024-25."

#### Scenario: Less than the year before
- **WHEN** 2026-27 is shown owing $500.00, and 2025-26 owed $767.73
- **THEN** the headline reads "2026-27 ended owing $500 at the true-up, $268 less than 2025-26."

#### Scenario: Nothing due
- **WHEN** 2026-27 is shown with nothing due, and 2025-26 owed $767.73
- **THEN** the headline reads "2026-27 ended with nothing due at the true-up, $768 less than 2025-26."

#### Scenario: The year before unknown
- **WHEN** 2023-24 is shown, and 2022-23's amount isn't known
- **THEN** the page has no headline

#### Scenario: After a year with nothing due
- **WHEN** 2024-25 is shown, owing $554.83, and 2023-24 owed nothing
- **THEN** the headline reads "2024-25 ended owing $555 at the true-up, after nothing due in 2023-24."

### Requirement: The range explained
The page SHALL say in one sentence how much of the house's use solar covered, as Impact gives it over the days the net tile counts, and what that left with PG&E, to a tenth as the net tile gives it, in kWh, or in MWh from 1,000 kWh as `display-units` reads energy: under a headline, or as the lead. A true-up year is named "This true-up year" (with "so far") or by its name; any other range by the cycles' days, from no earlier than October 10, 2021: "Since <day>" while it reaches today, else "From <day> to <day>". Before any house use is saved there SHALL be none.

#### Scenario: Short of the house's use
- **WHEN** 2025-26 is shown, solar covered 89% of the house's use, and the year imported 2,422.7 kWh more than it sent
- **THEN** the sentence reads "In 2025-26 solar covered 89% of the house's use, so the house drew 2.4 MWh more from PG&E than it sent."

#### Scenario: Above the house's use, yet importing
- **WHEN** 2022-23 is shown, solar covered 103% of the house's use, and the year imported 231.3 kWh more than it sent
- **THEN** the sentence reads "In 2022-23 solar covered 103% of the house's use, yet the house drew 231.3 kWh more from PG&E than it sent: the Powerwalls lose some of what they store, so solar needs a margin over use to break even."

#### Scenario: Sending more than drawn
- **WHEN** 2023-24 is shown, solar covered 109% of the house's use, and the year sent 412.3 kWh more than it imported
- **THEN** the sentence reads "In 2023-24 solar covered 109% of the house's use, and the house sent 412.3 kWh more to PG&E than it drew."

#### Scenario: The year under way
- **WHEN** the current year is shown on 2026-11-23, solar has covered 73% of the house's use, and it has imported 671.3 kWh more than it sent
- **THEN** the sentence reads "This true-up year solar has covered 73% of the house's use so far, so the house has drawn 671.3 kWh more from PG&E than it sent."

#### Scenario: All time
- **WHEN** All time is shown on 2026-11-23, its cycles run from 2021-10-06, solar has covered 100% of the house's use, and they have imported 4,541.3 kWh more than they sent
- **THEN** the sentence reads "Since October 10, 2021 solar has covered 100% of the house's use, yet the house has drawn 4.5 MWh more from PG&E than it sent: the Powerwalls lose some of what they store, so solar needs a margin over use to break even."

#### Scenario: A past custom range
- **WHEN** a range's cycles run from 2026-02-05 to 2026-04-06, solar covered 96% of the house's use, and they imported 120.4 kWh more than they sent
- **THEN** the sentence reads "From February 5 to April 6, 2026 solar covered 96% of the house's use, so the house drew 120.4 kWh more from PG&E than it sent."

#### Scenario: Before any house use is saved
- **WHEN** a new true-up year has no saved day yet
- **THEN** there is no such sentence, rather than one with 0%
