# Spec Delta

## ADDED Requirements

### Requirement: Selecting a span
Dragging across a day's power chart with a mouse SHALL select the span of time it covers, from the 5 minute step where the drag started to the one where it ended, at least one step long. A click without a drag SHALL select nothing. The span SHALL be shaded on the chart and named by its start and end times, like "4:00 PM to 12:00 AM", with a Clear control that ends it.

#### Scenario: After solar export stopped
- **WHEN** a visitor drags across November 9, 2026's Grid chart from 4:00 PM to the end of the day
- **THEN** the span from 4:00 PM to 12:00 AM is shaded and named "4:00 PM to 12:00 AM"

#### Scenario: A click still reads the values
- **WHEN** a visitor clicks the chart at 12:30 PM without dragging
- **THEN** no span is selected and the details for 12:30 PM show as before

### Requirement: Selecting on a touch screen
On touch screens the day view SHALL offer a Select toggle beside the chart. While it is on, a finger drag across the chart SHALL select a span as a mouse drag does, and the toggle SHALL turn off once the span is selected. While it is off, touching the chart SHALL show its details as before.

#### Scenario: Selecting on a phone
- **WHEN** a visitor on a phone turns on Select and drags from 4:00 PM to the end of the day
- **THEN** the span from 4:00 PM to 12:00 AM is selected

#### Scenario: Reading values on a phone
- **WHEN** Select is off and a visitor drags a finger across the chart
- **THEN** the details follow the finger and no span is selected

### Requirement: A span's totals
A span's totals SHALL be the sum of each flow's energy over its 5 minute steps, counting only steps with stored energy. At 640 pixels wide and more, each headline and the Grid view's net line SHALL keep the day's figure with the span's beside it, and each breakdown SHALL show the span's kWh in a column beside the day's. Under 640 pixels the headlines, net line and breakdowns SHALL show the span's figures and shares in place of the day's.

#### Scenario: Imported after export stopped
- **WHEN** November 9, 2026 imported 22.19 kWh, 8.67 kWh of it from 4:00 PM, and a visitor selects 4:00 PM to 12:00 AM on the Grid view
- **THEN** at 1280 pixels the Imported headline reads 22.2 kWh with 8.7 kWh from 4:00 PM to 12:00 AM under it, and on a phone it reads 8.7 kWh

#### Scenario: The whole day
- **WHEN** a visitor selects 12:00 AM to 12:00 AM
- **THEN** every span total equals the day's total for it

#### Scenario: Today in progress
- **WHEN** it is 11:47 AM and a visitor selects 10:00 AM to 2:00 PM on today
- **THEN** the span's totals count the steps stored so far

### Requirement: A span outlives a view
A selected span SHALL stay selected when the visitor switches views and when the open day reloads, and SHALL end when another day opens.

#### Scenario: From Grid to Home
- **WHEN** 4:00 PM to 12:00 AM is selected on the Grid view and the visitor switches to Home
- **THEN** the Home view shows the same span shaded with its sources' totals for it

#### Scenario: Another day
- **WHEN** a span is selected and the visitor opens the next day
- **THEN** the next day opens with no span
