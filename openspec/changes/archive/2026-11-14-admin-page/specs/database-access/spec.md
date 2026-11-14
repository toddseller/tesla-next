## MODIFIED Requirements

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
