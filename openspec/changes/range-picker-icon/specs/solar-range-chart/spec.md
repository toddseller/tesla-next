# Spec Delta

## MODIFIED Requirements

### Requirement: Custom range picker
The page SHALL offer a date-range picker, opened from the dates button over the page, showing the current range, from which a visitor picks a start and an end day in either order. It SHALL offer no day before 2021-10-10, the site's first day of service, and none after today in the site's time zone, and its months SHALL page no earlier than October 2021 and no later than the current month. It SHALL say "Pick a start day" until a day is picked, then "Pick an end day".

#### Scenario: Picking a range
- **WHEN** a visitor picks October 20 and then October 10, 2026
- **THEN** the page shows 2026-10-10 to 2026-10-20

#### Scenario: Saying which day to pick
- **WHEN** a visitor opens the picker and picks October 10, 2026
- **THEN** it says "Pick a start day" before the pick and "Pick an end day" after it

#### Scenario: Far future
- **WHEN** a visitor opens the picker on 2026-11-07
- **THEN** November 7, 2026 can be picked, November 8, 2026 can't, and there is no later month to page to

#### Scenario: From the first day of service
- **WHEN** a visitor pages the picker back to October 2021
- **THEN** October 9, 2021 can't be picked, October 10 can, and there is no earlier month to page to

#### Scenario: The site's today
- **WHEN** a visitor whose computer is in New York opens the picker at 1:00 AM on 2026-12-01 there, which is still November 30 at the site
- **THEN** December 1, 2026 can't be picked

## ADDED Requirements

### Requirement: The picker's months
In a window at least 640 pixels wide the picker SHALL show two months side by side, and in a narrower one a single month. It SHALL open with the range's end month last, or the current month when the range ends after it, and no earlier than October 2021 first. Days of the shown range after today SHALL show as part of the range but can't be picked.

#### Scenario: A past range
- **WHEN** a visitor showing October 1 to 31, 2026 opens the picker in a 1280 pixel wide window
- **THEN** it shows September and October 2026

#### Scenario: A range reaching past today
- **WHEN** a visitor showing All time, or This year, opens the picker in a 1280 pixel wide window on 2026-11-11
- **THEN** it shows October and November 2026, and on This year the days after November 11 show as part of the range

#### Scenario: The first month
- **WHEN** a visitor showing October 10 to 20, 2021 opens the picker in a 1280 pixel wide window
- **THEN** it shows October and November 2021

#### Scenario: On a phone
- **WHEN** a visitor showing October 1 to 31, 2026 opens the picker in a 390 pixel wide window
- **THEN** it shows October 2026 alone
