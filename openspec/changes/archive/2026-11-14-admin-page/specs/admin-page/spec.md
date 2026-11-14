## Purpose

The owner's page at `/admin` for the data the site can't get on its own: PG&E's billed figures, the VPP event days and Tesla's VPP payouts, entered through forms with the checks anton-tesla-api-ws's scripts apply.

## ADDED Requirements

### Requirement: Only the owner reaches the admin page
Every request to `/admin` and every admin form submission SHALL carry a Cloudflare Access token in `Cf-Access-Jwt-Assertion` that is signed by one of the configured team domain's keys, issued by that team domain, addressed to the configured application audience and not expired. Anything else, including a server without both settings, SHALL get a not-found answer and SHALL neither read nor write admin data.

#### Scenario: The owner through Access
- **WHEN** the owner opens `https://teslasolar.report/admin` and signs in to Cloudflare Access
- **THEN** the admin page loads with its three sections

#### Scenario: No token
- **WHEN** a request for `/admin` reaches the app without `Cf-Access-Jwt-Assertion`
- **THEN** the answer is the site's not-found page

#### Scenario: A token for another application
- **WHEN** the token is validly signed by the team domain but its audience isn't the configured one
- **THEN** the answer is the site's not-found page

#### Scenario: A forged submission
- **WHEN** a form submission to `/admin` carries an expired token or one with a bad signature
- **THEN** nothing is stored and no figures are dropped

#### Scenario: Settings missing
- **WHEN** the team domain or audience setting is unset and a request with a valid token arrives
- **THEN** the answer is the site's not-found page

### Requirement: The admin page is hidden
No page or menu of the site SHALL link to `/admin`.

#### Scenario: The top bar
- **WHEN** any page of the site is open
- **THEN** none of its links lead to `/admin`

### Requirement: Stored bill figures
The bill figures section SHALL list a picked true-up year's stored cycles, by the read that ends each, with PG&E's peak, off-peak and net kWh and NEM charges, and whether that year's true-up statement is stored. The picker SHALL offer the current true-up year and every year with stored cycles, newest first, and SHALL start at the current year. A year with none stored SHALL say so.

#### Scenario: Two bills in
- **WHEN** '26 - '27's first two cycles are stored from the December 2026 bill
- **THEN** the section lists both cycles with their figures and says the year has no true-up statement yet

#### Scenario: A past year picked
- **WHEN** the owner picks '25 - '26 while '26 - '27 is the current year
- **THEN** the section lists '25 - '26's 12 stored cycles and says its true-up statement is stored, with $767.73 due

### Requirement: Stored cycles loaded into the form
The section SHALL offer to load the picked year's stored cycles into the bill form: one row per cycle with its read as the end date (MM/DD/YYYY) and its figures, minimum delivery only when that year's true-up statement is stored, and the TOTAL row filled with the loaded rows' sums. Loading SHALL store nothing; the loaded table is saved, checked and stored as a typed one is.

#### Scenario: Correcting a stored statement
- **WHEN** the owner loads '25 - '26, changes the last cycle's charges to 101.51 and the TOTAL's to 827.92, and saves
- **THEN** '25 - '26 still has 12 cycles, the last at $101.51, and $767.83 due

#### Scenario: Loading a monthly year
- **WHEN** the owner loads '26 - '27 with two cycles stored from monthly bills
- **THEN** the form has those two rows with their minimum delivery inputs blank, so saving them again stores a monthly bill

### Requirement: Live sums under the TOTAL row
While the bill form is filled in, the form SHALL show under each TOTAL input what the rows typed so far add up to, and SHALL mark the net kWh, NEM charges and minimum delivery sums that differ from the typed TOTAL by more than a save allows. The TOTAL row SHALL still be typed; the sums SHALL never fill it.

#### Scenario: A row that doesn't reach the total
- **WHEN** the October 2026 statement is typed with its first cycle's charges as 131.41 and its TOTAL's as 827.82
- **THEN** the NEM charges sum shows 845.82, marked as differing from the total, before the form is saved

#### Scenario: Within a cent a row
- **WHEN** the October 2026 statement is typed with its last cycle's charges as 101.51 and its TOTAL's as 827.82
- **THEN** the NEM charges sum shows 827.92, unmarked, as a save would take it

#### Scenario: Everything adds up
- **WHEN** the October 2026 statement is typed as printed
- **THEN** the sums show 2437 net kWh, 827.82 and 60.09, none marked

### Requirement: A true-up statement entered as rows
The section SHALL take a bill's "Summary of NEM Charges" table as rows of inputs: end date as printed (MM/DD/YYYY), peak, off-peak and net kWh, NEM charges, and minimum delivery, plus a TOTAL row. Blank rows SHALL be ignored. 12 cycles with minimum delivery SHALL be a true-up statement: its cycles and its year's totals and amount due (NEM charges less minimum delivery) stored, replacing that year's.

#### Scenario: October 2026 statement
- **WHEN** the 12 rows of the statement dated October 12, 2026 and its TOTAL row are saved
- **THEN** its cycles are stored, from the one ending at the November 4, 2025 read ($113.41) to the one ending at the October 5, 2026 read ($101.41), with $827.82 of NEM charges, $60.09 of minimum delivery charges and $767.73 due

#### Scenario: Saved again
- **WHEN** the same statement is saved again with the last cycle's charges corrected to $101.51 and the total to $827.92
- **THEN** '25 - '26 still has 12 cycles, the last at $101.51, and $767.83 due

#### Scenario: The 2025 statement's older dates
- **WHEN** the statement dated October 14, 2025 lists cycles ending 11/03/2024 through 08/04/2025 (each the day before its read) and then 09/04/2025 and 10/03/2025 (the reads)
- **THEN** each row is stored against the read that ends its cycle, from November 4, 2024 to October 3, 2025

### Requirement: A monthly bill entered as rows
A table of 1 to 11 cycles with no minimum delivery SHALL be a monthly bill. Its cycles SHALL be stored with PG&E's figures and a minimum delivery worked out from the rates for their days, replacing that year's stored cycles, and nothing about the year's amount due. A table of 12 cycles without minimum delivery, or with it on only some rows, SHALL be refused.

#### Scenario: November 2025 bill
- **WHEN** one row, 11/04/2025 with 64 kWh peak, 300 off-peak, 364 net and $113.41, and its TOTAL row are saved, with a minimum delivery rate of $0.40313 a day in effect
- **THEN** the cycle ending at the November 4, 2025 read has PG&E's $113.41, 364 kWh net and $12.90 minimum delivery, and '25 - '26 has no amount due from a statement

#### Scenario: The next month's bill
- **WHEN** the December bill's two rows are saved after November's
- **THEN** both cycles have the December bill's figures

#### Scenario: 12 cycles without minimum delivery
- **WHEN** a true-up statement's 12 rows are saved with the minimum delivery inputs blank
- **THEN** nothing is stored and the form says 12 cycles are a true-up statement, which needs minimum delivery

### Requirement: Figures that don't add up are refused
Nothing SHALL be stored unless each row's peak and off-peak sum to its net within 1 kWh; the rows' NEM charges, minimum delivery and net kWh sum to the TOTAL row's within a cent or 1 kWh per row; there is exactly one TOTAL row; every figure is a number; and every end date is MM/DD/YYYY. A refusal SHALL name the row or total that doesn't add up and SHALL keep every input as typed.

#### Scenario: A digit mistyped in a row
- **WHEN** the 11/04/2025 row is saved with 46 kWh peak, 300 off-peak and 364 net
- **THEN** nothing is stored, the form names the 11/04/2025 row, and every input still holds what was typed

#### Scenario: Charges that don't reach the total
- **WHEN** the 11/04/2025 row's charges are typed as $131.41 with the statement's TOTAL row
- **THEN** nothing is stored and the form says the NEM charges sum to a figure other than the total, giving both

#### Scenario: Minimum delivery off
- **WHEN** the last row's minimum delivery is typed as 9 with the statement's TOTAL row
- **THEN** nothing is stored and the form says the minimum delivery charges don't sum to the total

### Requirement: End dates are the true-up year's meter reads
The end dates SHALL be consecutive meter reads, each the printed date or, on statements before September 2025, the day after it, starting at the read that ends the true-up year's first cycle. A monthly table SHALL be refused for a year whose true-up statement is stored. Each refusal SHALL store nothing and say why.

#### Scenario: An end date off the reads
- **WHEN** the statement's 06/05/2026 row is typed as 06/15/2026
- **THEN** nothing is stored and the form names 06/15/2026 as neither a meter read nor the day before one

#### Scenario: A row left out
- **WHEN** the statement is saved with its 06/05/2026 row blank
- **THEN** nothing is stored and the form says it expected 12 cycles and found 11

#### Scenario: Not from the year's start
- **WHEN** a monthly table's first row ends at the December 2025 read
- **THEN** nothing is stored and the form says the table must start at the true-up year's first cycle

#### Scenario: Year already trued up
- **WHEN** a monthly table for '25 - '26 is saved after its true-up statement
- **THEN** nothing is stored and the form says '25 - '26's true-up statement is already stored

### Requirement: The season's VPP days
The VPP days section SHALL list the current VPP season's days marked as VPP days, each with the Powerwalls' export to the grid that day in kWh and an Unmark button. A season with none marked SHALL say so.

The current season SHALL be May 1 to October 31 of the latest year whose May 1 has come, so from January to April it is still last year's.

#### Scenario: Two event days
- **WHEN** August 12 and September 3, 2026 are marked, exporting 21.4 and 18.9 kWh from the Powerwalls
- **THEN** the section lists both days with those kWh, oldest first

#### Scenario: Before the next season
- **WHEN** the page is opened on March 2, 2027
- **THEN** the section lists the 2026 season's marked days

### Requirement: Marking a VPP day
The section SHALL mark a day picked from the current season's days up to today, among those whose day of data is stored. A day after today, outside the season or without stored data SHALL be refused, storing nothing.

#### Scenario: Marking an event day
- **WHEN** the owner picks September 18, 2026 and marks it
- **THEN** that day counts as a VPP day, it joins the list, and the True-Up Tracker's VPP estimate includes its export

#### Scenario: A day not yet stored
- **WHEN** a mark is submitted for a day after today
- **THEN** nothing is stored and the form says the day has no data yet

### Requirement: Unmarking a VPP day
Unmark SHALL clear the day's VPP mark, so its export stops counting toward the season's estimate and the Top Ten's VPP filter.

#### Scenario: Marked by mistake
- **WHEN** the owner unmarks September 3, 2026
- **THEN** it leaves the list and its 18.9 kWh no longer count toward the 2026 estimate

### Requirement: Recording a VPP payout
The VPP payout section SHALL show the latest recorded season's payout and payment date, and SHALL record a season's payout from its year, the amount in dollars and the date it was paid. Recording a season again SHALL replace it. An amount that isn't a positive number, a missing or invalid date, or a payment date on or before October 31 of the season SHALL be refused, storing nothing, with the reason.

#### Scenario: The 2025 season
- **WHEN** 2025 is recorded as $728.26 paid April 15, 2026
- **THEN** the 2025 season has that payout and payment date, and the True-Up Tracker shows it in place of the estimate

#### Scenario: Recorded again
- **WHEN** 2025 is recorded again as $730.00
- **THEN** the 2025 season's payout is $730.00

#### Scenario: Paid before the season ended
- **WHEN** 2026 is recorded with a payment date of September 1, 2026
- **THEN** nothing is stored and the form says the 2026 season hadn't ended by then

#### Scenario: Nothing owed
- **WHEN** an amount of 0 is recorded
- **THEN** nothing is stored and the form says the amount must be positive

### Requirement: A save shows at once
Each save SHALL be stored in one transaction and, once committed, SHALL drop the figures the server keeps from stored data, as an anton rewrite does, so every page shows the change on its next load. A refused or failed save SHALL drop nothing. The form SHALL say what was stored.

#### Scenario: A statement saved
- **WHEN** the 2026 statement is saved
- **THEN** the next True-Up Tracker load shows its figures, without waiting for a restart or the next day

#### Scenario: A refused table
- **WHEN** a table is refused
- **THEN** the server's kept figures stay as they were
