# Spec Delta

## MODIFIED Requirements

### Requirement: Cycle list
Under the chart the page SHALL list each started cycle with its dates, imported, exported, net and NEM charges, fitting a phone without sideways scrolling. The list's heading SHALL say once that its figures are in kWh, and its rows SHALL stay in kWh. A calculated charge SHALL be marked "est."; a credit SHALL read like "$118.81 credit", never in red; a cycle with PG&E's charge SHALL show under it its estimate, when there is one, and PG&E's net kWh. The open cycle SHALL show the last day it covers. When the cycles listed span more than one true-up year, each year SHALL be a row in the list's columns that opens to show its cycles, giving the year's name and its cycles' imported, exported and net, and the sum of their NEM charges, marked "est." when any of them is calculated and left out when any cycle has none. A year's cycles SHALL be indented under it so their dates start where the year's name starts. At All time only the last year listed SHALL start open, the others closed; for any other range every year SHALL start open, since its first or last year can be cut short. Each opens and closes from the keyboard as well as by pointer. Narrower than 640 pixels, each row SHALL give its dates or year's name and its charges on its first line, the charges at the right edge, and its imported, exported and net below. From 640 pixels wide, every row SHALL set its dates, imported, exported, net and charges in the same columns, whether or not it has charges.

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

#### Scenario: The unit, once
- **WHEN** the list is shown
- **THEN** its heading reads "Billing cycles in kWh", "Billing cycles" in the headings' uppercase and "in kWh" in plain case, and no imported, exported or net figure repeats "kWh"

#### Scenario: A cycle on a phone
- **WHEN** the list is 390 pixels wide and shows Oct 5 to Nov 2 with PG&E's $97.80
- **THEN** "Oct 5 to Nov 2" and "$97.80" share the row's first line, $97.80 ending at the row's right edge, with the imported, exported and net figures below them

#### Scenario: A year's cycles indented
- **WHEN** All time is shown with 2026-27 open
- **THEN** each of 2026-27's cycles starts its dates at the same horizontal position as the name "2026-27", to the right of the year row's chevron, at a phone's width and at 1440 pixels
