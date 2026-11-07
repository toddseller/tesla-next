# Spec Delta

## Purpose

How the dashboard reads the site's database, which the API in anton-tesla-api-ws writes: as the site's own login, in sessions that cannot write and run in UTC, with the password kept out of the repository and out of `.env`.

## ADDED Requirements

### Requirement: Read-only sessions
Every database session the app opens SHALL be read-only, so no request, bug or injected query can change the data the API writes.

#### Scenario: A write through the app
- **WHEN** the app's database connection runs `CREATE TABLE`, `INSERT`, `UPDATE` or `DELETE`
- **THEN** PostgreSQL refuses it as a write in a read-only transaction, and nothing changes

#### Scenario: A read
- **WHEN** the app's database connection runs a `SELECT`
- **THEN** it returns the rows

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
