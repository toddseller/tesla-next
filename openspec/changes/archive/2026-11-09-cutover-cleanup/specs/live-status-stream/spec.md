# Spec Delta

## MODIFIED Requirements

### Requirement: Updates reach open pages within a second
Each live status anton-tesla-api-ws notifies on `live_status` SHALL reach every open page as a server-sent event within one second, with the notification's fields: `load_power`, `home_power`, `solar_power`, `grid_power`, `battery_power`, `battery_percentage`, `battery_status`, `vehicle`, `modified` and `weather`. All open pages SHALL receive identical content.

#### Scenario: Two pages open
- **WHEN** two browsers have the Distribution page open for one minute while anton polls every 10 seconds
- **THEN** each receives about six updates, each within a second of anton's notification, with identical content

#### Scenario: Another page open
- **WHEN** a browser has the Solar page open for one minute
- **THEN** it receives about six updates, which its top bar shows

### Requirement: New totals reach open pages
When anton-tesla-api-ws notifies `totals_updated` for a day, every open stream SHALL receive a `totals` event naming that day, within a second, so a page showing that day can reload it.

#### Scenario: Replaying today
- **WHEN** today is replayed and anton stores the 2:20 PM interval
- **THEN** the page receives a `totals` event for today and reloads its history

## REMOVED Requirements

### Requirement: Flask notifies each live status
**Reason**: It describes anton-tesla-api-ws, whose own `live-site-status` spec now owns it, without the socket broadcast it retired.
**Migration**: anton-tesla-api-ws's `live-site-status` spec, "Live status is also sent as a database notification".

### Requirement: Flask notifies updated totals
**Reason**: It describes anton-tesla-api-ws, whose own `energy-intervals` spec now owns it, without the socket event it retired.
**Migration**: anton-tesla-api-ws's `energy-intervals` spec, "Totals updates are also sent as a database notification".
