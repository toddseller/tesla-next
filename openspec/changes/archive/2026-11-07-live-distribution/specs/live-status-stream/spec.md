# Spec Delta

## Purpose

How live status reaches tesla-next's pages: Flask, which reads Tesla every 10 seconds, notifies the database, and the Next.js server streams each update to every open page, without Socket.IO or Flask's HTTP side.

## ADDED Requirements

### Requirement: Updates reach open pages within a second
Each live status Flask notifies SHALL reach every open Distribution page as a server-sent event within one second, with the same fields as anton's `live` socket event: `load_power`, `home_power`, `solar_power`, `grid_power`, `battery_power`, `battery_percentage`, `battery_status`, `vehicle`, `modified` and `weather`. All open pages SHALL receive identical content.

#### Scenario: Two pages open
- **WHEN** two browsers have the Distribution page open for one minute while Flask polls every 10 seconds
- **THEN** each receives about six updates, each within a second of Flask's notification, with identical content

### Requirement: A page gets the current status at once
The Next.js server SHALL keep the latest live status it has received. A Distribution page SHALL be rendered with it, and a stream opening SHALL send it first, without waiting for the next update.

#### Scenario: Opening the page between updates
- **WHEN** a viewer opens the Distribution page 7 seconds after the last update
- **THEN** the labels show that update's values in the page as served, before any script runs

### Requirement: Before the first update
Until the Next.js server has received its first live status since it started, the page SHALL be rendered without one, so its labels show dashes, and streams SHALL send no status until it arrives.

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
When Flask stores updated totals for a day, every open stream SHALL receive a `totals` event naming that day, within a second, as anton's `totals_updated` socket event does, so a page showing that day can reload it.

#### Scenario: Replaying today
- **WHEN** today is replayed and Flask stores the 2:20 PM interval
- **THEN** the page receives a `totals` event for today and reloads its history

### Requirement: Flask notifies each live status
In anton-tesla-api-ws, after each successful live status read Flask SHALL send the payload it broadcasts as its `live` socket event as a database notification as well. A failed notification SHALL be logged and SHALL NOT stop the socket broadcast or the next poll.

#### Scenario: Database unreachable
- **WHEN** the database is unreachable while Tesla is reachable
- **THEN** socket clients on teslasolar.report keep receiving `live` events every 10 seconds, and the failed notification is logged

### Requirement: Flask notifies updated totals
In anton-tesla-api-ws, wherever Flask emits its `totals_updated` socket event it SHALL also send `{"date": "YYYY-MM-DD"}` as a database notification. A failed notification SHALL be logged and SHALL NOT stop the socket event or the stored totals.

#### Scenario: A day's totals change
- **WHEN** the 5 minute refresh stores new intervals for today
- **THEN** socket clients get `totals_updated` for today as before, and a `totals_updated` notification names today
