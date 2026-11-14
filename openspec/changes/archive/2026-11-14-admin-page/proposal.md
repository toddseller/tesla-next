# Proposal

## Why

Three jobs that change what the site shows are still done by hand on onyx with anton-tesla-api-ws's scripts: typing a PG&E bill's "Summary of NEM Charges" table into a CSV for `import_true_up`, marking VPP event days in `data.is_vpp` with SQL, and recording Tesla's yearly payout with `record_vpp_payout`. A form on the site does each one from any browser, with the same checks, and shows the change at once.

## What Changes

- A hidden page at `/admin`, linked from nowhere, behind a Cloudflare Access application on `teslasolar.report/admin*` that admits only the owner's email. The app also checks the `Cf-Access-Jwt-Assertion` header on every admin request and action, against two new settings: the Access team domain and the application's audience tag. No login or session code of the app's own.
- **Bill figures**: lists a picked true-up year's stored cycles (`true_up_statement_cycle`), the current one by default, loads them into the form to correct and save again, and takes a bill's table as rows of plain inputs: end date as printed, peak, off-peak and net kWh, NEM charges, and minimum delivery for a 12-cycle true-up statement only, plus a TOTAL row, with the rows' sums shown live under it. The checks and the store are ported from anton's `services/true_up_statement.py` and its tests, on `lib/true-up/reads.ts` and `lib/true-up/pricing.ts`. A refused table stores nothing, keeps what was typed, and says which row or total doesn't add up.
- **VPP days**: lists the current season's (May to October) marked days with each day's Powerwall export, each with Unmark, and marks a day picked from the season's days up to today.
- **VPP payout**: records a season's amount and payment date in `vpp_payout`, with `record_vpp_payout`'s checks.
- **BREAKING (for the read-only rule)**: the app gains a second database pool that can write, imported only by the admin code. Every other session stays read-only as now (`lib/db.ts`). Each save sends `data_rewritten` in its transaction, so the server's kept figures are dropped once it commits, as after one of anton's scripts.
- `README.md`, `.env.example` and `CLAUDE.md` say the app now writes from `/admin` only, and how Access is set up.

Out of scope: no file upload and no object storage, plain forms only. Retiring `import_true_up` and `record_vpp_payout` in anton-tesla-api-ws: they stay as a fallback until the December 2026 bill has gone through the form, then a separate change there retires them.

## Capabilities

### New Capabilities
- `admin-page`: the owner-only `/admin` page: its access check, and its bill figures, VPP days and VPP payout forms with their checks and stores.

### Modified Capabilities
- `database-access`: "Read-only sessions" now excepts the admin writer, which only the admin page uses; its sessions are still in UTC.

## Impact

- New: `app/admin/` (page and server actions), `lib/admin/` (access check, writer pool, statement parse and store, VPP writes), `components/admin/` and their tests. The statement fixtures from anton's tests are ported for the parse tests.
- Changed: `README.md`, `.env.example`, `CLAUDE.md`. `lib/db.ts` is unchanged; the writer reuses its exported `connection`.
- Settings: two new env vars, the Access team domain and audience tag. The writer uses the same `DATABASE_URL` and password file: `tsr_app` already has write grants, the read-only rule was only ever the session option.
- Outside the repository: a Cloudflare Access application on `teslasolar.report/admin*` with an allow policy for the owner's email, created in Cloudflare's dashboard before the release that ships the page.
- No new dependencies: the token check uses Node's `crypto` and `fetch`.
