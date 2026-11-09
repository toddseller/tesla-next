# Spec Delta

## MODIFIED Requirements

### Requirement: Updates reach open pages within a second
Each live status anton-tesla-api-ws notifies on `live_status` SHALL reach every open page as a server-sent event within one second, with the notification's fields: `load_power`, `home_power`, `solar_power`, `grid_power`, `battery_power`, `battery_percentage`, `battery_status`, `vehicle`, `island_status`, `storm_mode_active`, `modified` and `weather`. All open pages SHALL receive identical content.

#### Scenario: Two pages open
- **WHEN** two browsers have the Distribution page open for one minute while anton polls every 10 seconds
- **THEN** each receives about six updates, each within a second of anton's notification, with identical content

#### Scenario: Another page open
- **WHEN** a browser has the Solar page open for one minute
- **THEN** it receives about six updates, which its top bar shows

#### Scenario: Island status and storm watch
- **WHEN** anton notifies a status with `island_status` `off_grid_unintentional` and `storm_mode_active` true
- **THEN** every open page receives both fields as anton sent them

## ADDED Requirements

### Requirement: The server keeps the site's current state
The Next.js server SHALL keep the site's current state stretch, its start, island status and storm watch, read when the server starts listening and again whenever anton notifies `site_state_updated`. Every page SHALL be rendered with it, and a stream opening SHALL send it after the latest live status.

#### Scenario: Opening a page during an outage
- **WHEN** a viewer opens any page while the open stretch is `off_grid_unintentional` from 06:25:52
- **THEN** the page as served carries that stretch, before any script runs

#### Scenario: Not read yet
- **WHEN** a page is opened before the server has read the site's state
- **THEN** the page is rendered without a stretch

### Requirement: Outage and site-state changes reach open pages
When anton notifies `outages_updated`, every open stream SHALL receive an `outages` event within a second. When anton notifies `site_state_updated`, the server SHALL read the current stretch and every open stream SHALL receive a `site_state` event carrying it.

#### Scenario: Storm watch stored
- **WHEN** anton stores a storm watch stretch from 14:02:10 and notifies `site_state_updated`
- **THEN** every open page receives a `site_state` event with that stretch

#### Scenario: Outages refreshed
- **WHEN** anton stores a new outage and notifies `outages_updated`
- **THEN** every open page receives an `outages` event

#### Scenario: Reading the state fails
- **WHEN** the read after `site_state_updated` fails
- **THEN** the server logs it, keeps the stretch it had, and keeps forwarding live statuses
