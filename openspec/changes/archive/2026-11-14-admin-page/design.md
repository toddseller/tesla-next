# Design

## Context

- `lib/db.ts` opens every session with `default_transaction_read_only=on`, as `tsr_app`, the same login anton's API writes with. The read-only rule is that session option, not the role's grants, so a writer needs no new login or password.
- `lib/live.ts` listens on `data_rewritten`; `instrumentation.ts` clears every kept cache (`chargingDays`, `paybackKept`, `savingsKept`, `patternsMonths`, `trueUpGrids`) and warms them again when it hears one. anton's scripts send it after they commit.
- `lib/true-up/reads.ts` and `lib/true-up/pricing.ts` already have the reads, the true-up year arithmetic and `minimumDelivery`; `lib/true-up/cost.ts`'s `loadPricing` reads `rate_revision`. `test/true-up.ts` seeds PG&E's published reads and gives a test file its own database.
- The app has no server actions yet. Next 16 treats each action as a POST entry point of its own: the page's check does not cover it, and its ID ships in a static chunk under `/_next/`, outside the Access path, so it can be posted to any route.
- `proxy.ts` sets the CSP on pages; its matcher skips prefetch requests, so it is not a place for a security check.

## Goals / Non-Goals

**Goals:** the three forms with anton's checks, one shared owner check run by the page and by every action, writes isolated to the admin code, and the site's figures refreshed by the mechanism that already exists.

**Non-Goals:** sessions, cookies or roles of the app's own; editing or deleting single cycles or payouts (a table or season is replaced whole, which "Load into form" makes quick for a stored table); listing past seasons' payouts beyond the latest; marking days outside the current season; retiring anton's scripts.

## Decisions

### Mockups

Approved 2026-11-14 (https://claude.ai/artifact/UPMR2xbeC4ao2UjwPMDmM7): three cards (bill figures, VPP days, VPP payout) under the site's top bar, in `globals.css`'s tokens. On a phone the bill table becomes one card per cycle, three inputs across, rather than a table that scrolls sideways. Save buttons are the light secondary style, not Tesla red, which is under 4.5:1 for button text. The payout card shows the latest recorded season's payout and date above its form, so the owner sees what a new entry would replace.

### The owner check: verify Access's token in the app, with Node's crypto

`lib/admin/access.ts` exports `owner()`: it reads `Cf-Access-Jwt-Assertion` from `headers()`, splits the JWT, requires `alg` RS256, looks up `kid` in the keys from `https://<CF_ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs` (kept in memory, fetched again once on an unknown `kid` so Cloudflare's key rotation works), verifies the signature with `crypto.verify` on a `createPublicKey({ key: jwk, format: "jwk" })`, then checks `iss`, that `aud` includes `CF_ACCESS_AUD`, and `exp`/`nbf`. Any failure, or either setting unset, calls `notFound()`. The page awaits it before reading, and each action awaits it first, before parsing or connecting.

- Over `jose`: about 30 lines against a new runtime dependency that the audit would watch forever.
- Over checking only in Cloudflare: Access guards `/admin*` paths, but actions are reachable through any path (Context), and a misconfigured Access policy would otherwise leave the writer open.
- Over checking `Cf-Access-Authenticated-User-Email`: a plain header anyone reaching the origin could set; the token is signed.
- `notFound()` over 403: the page stays hidden; Access gives a signed-out visitor its own login page before the app sees anything.

### A writer pool in the admin code only

`lib/admin/writer.ts` builds `new Pool({ ...connection, options: "-c timezone=UTC" })` from `lib/db.ts`'s `connection`, dropping only the read-only option. Only `lib/admin/*` imports it; a test greps that no other module does, which is the spec's "no other page uses it" made checkable. `pg` pools connect lazily, so a server nobody signs in to never opens a writer session.

Each save is `save(work)`: take a client, `BEGIN`, run `work(client)`, `SELECT pg_notify('data_rewritten', '{"script":"admin","start":null,"end":null}')`, `COMMIT`; `ROLLBACK` and rethrow on any error. A notification sent inside a transaction is delivered only when it commits, so the caches drop after the commit and never on a rollback, with no in-process hook to add. If the listener happens to be disconnected then, its reconnect already counts as a rewrite.

- Over calling the rewrite hooks directly: that would need a new export from `lib/live.ts` and could run before a failed commit is known; the notification is one query and is the path anton's scripts take.

### Statement parsing: a port of `true_up_statement.parse` on form rows

`lib/admin/statement.ts` keeps anton's function shape: `parse(rows, total)` returns the statement or throws `StatementError` with anton's messages (each per-row message starts with the row's end date as typed), and `store(client, statement)` deletes the year's cycles, upserts `true_up_statement` for a 12-cycle statement, and inserts the cycles. Differences from the CSV version, all from the input being a form:

- The header check becomes: a table whose minimum delivery inputs are all blank, the TOTAL row's included, is a monthly bill; otherwise every row must have one (a blank one fails `isn't a number`, naming the row).
- Rows whose inputs are all blank are dropped before parsing; the form has 12 cycle rows and a TOTAL row.
- Reads come from `readsFor`, the year from `endYearOf`/`trueUpEndYear`, labels from `trueUpLabel`; a monthly cycle's minimum delivery is `minimumDelivery(start, read - 1 day, revisions)` with `revisions` from `loadPricing()`. Python's `round(x, 2)` is `pyRound`.
- The "already stored" check reads `true_up_statement` through the read-only pool before the save; one owner saving one form at a time makes the gap harmless.

anton's tests are ported as `lib/admin/statement.db.test.ts` on the 2025 and 2026 fixtures (copied to `test/fixtures/`, read into rows), with the same edits and expected messages.

### Forms: server actions with `useActionState`, input echoed back

`app/admin/page.tsx` (server) awaits `owner()`, reads the three sections' data, and renders `components/admin/` client forms. `app/admin/actions.ts` (`"use server"`) has `saveBill`, `markVppDay`, `unmarkVppDay`, `savePayout`; each awaits `owner()`, validates, calls `save`, and returns `{ ok, message, values? }`. React resets a form after its action, so `saveBill` returns the submitted values and the bill form renders its inputs with `defaultValue` from them, keyed on the result so a refusal shows exactly what was typed. On success the page's lists re-render with `revalidatePath("/admin")`.

- The end date is a text input, `MM/DD/YYYY`, because the statement prints it that way; a date picker would hide the pre-September 2025 "day before" form the parser has to see.
- The VPP mark and the payout's paid date use the house `Calendar` in a `Popover` (`components/ui/`), the mark's disabling days outside the season and after today. The server repeats both limits.
- A refusal names the row through the message; the bill form also marks that row's inputs `aria-invalid` when the message starts with one of its end dates.

### Year picker, loading and live sums: in the page and the browser, no new server code

The year is a `?year=<end year>` search parameter (the page is rendered per request already); the picker is a `<select>` that navigates to it, offering `SELECT DISTINCT true_up_end_year FROM true_up_statement_cycle` and the current year, newest first, and the page reads that year's cycles and statement row. An unknown or absent year falls back to the current one.

"Load into form" needs no request: the page already passed the picked year's cycles to the bill form, which fills its rows from them (the read as `MM/DD/YYYY`, which the parser accepts as a meter read), leaves minimum delivery blank unless the year's statement is stored, and fills the TOTAL with the rows' sums. The loaded values are ordinary inputs, so a save goes through `parse` like a typed table.

The sums are worked out in the bill form as it is typed. The tolerances (1 kWh and 1 cent per row) and the rule for which sums are checked live in one small module, `lib/admin/sums.ts`, that both `parse` and the form import, so the mark and the refusal can't drift apart; it has no database import, so it is safe in a client component.

- Over filling the TOTAL from the sums: the typed TOTAL from the bill is the check that catches a mistyped row (proposal); the sums only show it sooner.
- Over a per-cycle edit form: the checks are on the whole table, so a single-cycle edit would skip them.

### The VPP season and its writes

The current season is `today.year` if `today >= May 1`, else the year before (spec: The season's VPP days). The list is `SELECT date, powerwall_to_grid FROM data WHERE is_vpp AND date BETWEEN May 1 AND Oct 31 ORDER BY date` (`data.date` is text in ISO form, as `vppSeason` already compares it). Mark and unmark are `UPDATE data SET is_vpp = … WHERE date = $1`; a mark updating no row is refused as "no data yet". Payouts are `INSERT … ON CONFLICT (season) DO UPDATE`, after anton's three checks.

## Risks / Trade-offs

- [The writer shares `tsr_app`, which can write every table] → only `lib/admin/` imports it, every action checks the token first, the grep test fails if anything else imports it, and `CLAUDE.md`'s trap is reworded to say exactly that rather than dropped.
- [The Access application is set up by hand in Cloudflare] → README gives the steps; until both settings are on the server the page answers not found, so shipping the code before Access is configured exposes nothing.
- [Cloudflare's certs endpoint is down] → the check fails closed (not found); the scripts in anton stay as the fallback (proposal, out of scope).
- [anton's checks and these drift apart] → anton's scripts are retired after the December 2026 bill, leaving this the only copy.
- [`ON CONFLICT` needs a key] → production's dump in `test/schema.sql` has primary keys on `true_up_statement (true_up_end_year)`, `true_up_statement_cycle (end_read)` and `vpp_payout (season)`.

## Migration Plan

1. Merge with the page answering not found until configured.
2. In Cloudflare Zero Trust, add a self-hosted application for `teslasolar.report/admin*` with an Allow policy for the owner's email; note its audience tag.
3. Add `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` to `~/tesla-next/.env` on onyx, then publish a release (asked first, as always).
4. Sign in at `/admin`; save the next bill through the form and compare with `import_true_up`'s result.

Rollback: delete the two settings (the page answers not found) or roll back the image as README says. Nothing in the database changes shape.

## Rollout

Released as v2026.11.14.1 on 2026-11-14; the Deploy workflow succeeded. The Cloudflare Access application for `teslasolar.report/admin` allows only the owner's email: a sign-in from another address got no code. With both `CF_ACCESS_*` settings in `~/tesla-next/.env` and the container recreated, `/admin` without signing in is sent to Access's login, and signed in it shows the page. The owner loaded '25 - '26 into the form and saved it, then unmarked a 2026 VPP day and marked it again. Read back: '25 - '26 still has 12 cycles, $827.82 of NEM charges and $767.73 due; the 2026 season has its 7 marked days; the server logged one cache refresh per save and no errors. The payout form is not yet used on production.
