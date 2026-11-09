# live-status-stream Specification

## Purpose

How live status reaches tesla-next's pages: anton-tesla-api-ws's scheduler, which reads Tesla every 10 seconds, notifies the database, and the Next.js server streams each update to every open page, along with new totals, outage refreshes and changes in the site's off-grid and storm watch state.

## Requirements

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

### Requirement: A page gets the current status at once
The Next.js server SHALL keep the latest live status it has received. Every page SHALL be rendered with it, the Distribution page's labels and every page's top bar, and a stream opening SHALL send it first, without waiting for the next update.

#### Scenario: Opening the page between updates
- **WHEN** a viewer opens the Distribution page 7 seconds after the last update
- **THEN** the labels show that update's values in the page as served, before any script runs

#### Scenario: Opening another page between updates
- **WHEN** a viewer opens the Impact page 7 seconds after the last update
- **THEN** the top bar shows that update's time, charge and state in the page as served, before any script runs

### Requirement: Before the first update
Until the Next.js server has received its first live status since it started, pages SHALL be rendered without one, so the Distribution page's labels and every top bar's time, charge and state show dashes, and streams SHALL send no status until it arrives.

#### Scenario: Right after a deploy
- **WHEN** the page is opened 3 seconds after the server started
- **THEN** the labels show dashes, and fill in with the first update

### Requirement: Streams last through idle time and restarts
An open stream SHALL send a keep-alive at least every 30 seconds, so Cloudflare does not close it, and a page whose stream was closed by a server restart SHALL reconnect by itself and resume receiving updates without a reload. A request for a stream SHALL always be answered with status 200 and a retry interval, so the browser keeps retrying, and a page whose stream is closed for good, by any answer other than 200 on its way (such as Cloudflare's rate limit or a tunnel's 502), SHALL open a new one within about 5 seconds.

#### Scenario: Deploy while a page is open
- **WHEN** a release replaces the container while a viewer has the page open
- **THEN** the page reconnects by itself and its labels resume updating, with no reload

#### Scenario: Refused by Cloudflare
- **WHEN** Cloudflare answers a page's stream with 429 for a minute
- **THEN** the page keeps opening a new stream every few seconds, and its labels resume updating once Cloudflare lets it through, with no reload

### Requirement: Losing the database doesn't stop the pages
When the server's notification connection to the database breaks, the server SHALL keep its open streams, reconnect to the database every few seconds, and resume forwarding updates once connected, with no page reload. While no updates arrive, the scene's stale-data warning applies.

#### Scenario: Database restart
- **WHEN** the database restarts while pages are open
- **THEN** the pages keep their last values, show the stale-data warning after 2 minutes if needed, and resume updating once the database is back

### Requirement: Listening stays read-only
The server's notification connection SHALL use the same read-only session settings as its other database connections, so it can receive notifications but never write.

#### Scenario: A write on the notification connection
- **WHEN** any statement that writes is sent on the notification connection
- **THEN** the database refuses it

### Requirement: New totals reach open pages
When anton-tesla-api-ws notifies `totals_updated` for a day, every open stream SHALL receive a `totals` event naming that day, within a second, so a page showing that day can reload it.

#### Scenario: Replaying today
- **WHEN** today is replayed and anton stores the 2:20 PM interval
- **THEN** the page receives a `totals` event for today and reloads its history

### Requirement: One stream per tab
A page's top bar and the page itself SHALL share one stream: a browser tab SHALL hold at most one open stream however many parts of the page listen to it, each receiving every live status and `totals` event, and the stream SHALL close when nothing on the page listens any more.

#### Scenario: The True-Up Tracker open
- **WHEN** a viewer has the True-Up Tracker open, whose top bar shows the live status and whose page reloads on `totals` events
- **THEN** the tab has one stream open, and both the top bar and the page receive its events

#### Scenario: Moving to another page
- **WHEN** the viewer moves from the True-Up Tracker to the Top Ten page in the same tab
- **THEN** the tab still has one stream open

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
