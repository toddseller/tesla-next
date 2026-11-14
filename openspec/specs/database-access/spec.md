# database-access Specification

## Purpose

How the dashboard reads the site's database, which the scheduler and scripts in anton-tesla-api-ws write: as the site's own login, in sessions that cannot write and run in UTC, with the password kept out of the repository and out of `.env`.

## Requirements

### Requirement: Read-only sessions
Every database session the app opens SHALL be read-only, so no request, bug or injected query can change the data the API writes, except the admin writer's: sessions that can write, opened only to store a save from the admin page after its access check has passed (see `admin-page`). No other page, route, listener or check SHALL use the admin writer.

#### Scenario: A write through the app
- **WHEN** the app's database connection runs `CREATE TABLE`, `INSERT`, `UPDATE` or `DELETE`
- **THEN** PostgreSQL refuses it as a write in a read-only transaction, and nothing changes

#### Scenario: A read
- **WHEN** the app's database connection runs a `SELECT`
- **THEN** it returns the rows

#### Scenario: An admin save
- **WHEN** the owner saves a VPP payout from the admin page
- **THEN** the admin writer stores it, and the app's other sessions stay read-only

#### Scenario: A request that isn't the owner's
- **WHEN** an admin form submission fails the access check
- **THEN** no admin writer session is used and nothing changes

### Requirement: Sessions in UTC
Every database session the app opens SHALL use UTC as its time zone, whatever the database server's default, so timestamps are read back with a UTC offset of zero, as the API reads them.

#### Scenario: A server whose default zone is not UTC
- **WHEN** the app connects to a database server whose default time zone is America/Los_Angeles
- **THEN** `SHOW timezone` in its session returns UTC

### Requirement: Database password from a file outside the repository
The app SHALL connect as `tsr_app` with the password read from the libpq password file whose host path `PGPASS_FILE` in `.env` names, mounted read-only into the container, so `DATABASE_URL` carries no password. Without `PGPASS_FILE`, a password in `DATABASE_URL` SHALL work instead.

#### Scenario: Password from the file
- **WHEN** `PGPASS_FILE` names a password file holding a line for the database and `DATABASE_URL` has no password
- **THEN** the app connects

#### Scenario: No password file
- **WHEN** `PGPASS_FILE` is unset and `DATABASE_URL` includes the password
- **THEN** the app connects, and the container starts with no file to mount

#### Scenario: A missing password
- **WHEN** neither the password file nor `DATABASE_URL` has a password for the database
- **THEN** the page that needs the database fails with an error in the log naming the database, and no password or connection string is printed
