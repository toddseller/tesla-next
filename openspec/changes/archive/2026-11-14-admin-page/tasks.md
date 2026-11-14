# Tasks

Each code task goes test-first: write the test, run it and see it fail for the right reason, then the smallest code that passes, then `yarn vitest run`.

## 1. Mockups

- [x] 1.1 Branch `admin-page` from `main`, then mock up `/admin` (bill figures with the year picker, the stored cycles, Load into form and the 12-row form plus TOTAL with its live sums, a refusal naming a row, VPP days with Unmark and the Calendar picker, the payout form) in the design system's tokens at desktop and phone width; verify by the owner approving the mockups before any UI code. Approved 2026-11-14, with one card per cycle on a phone, light Save buttons and the latest payout shown

## 2. Owner check

- [x] 2.1 `lib/admin/access.test.ts`: a token signed by a generated RSA key served as the team's certs (stubbed `fetch`) passes; no header, wrong `aud`, wrong `iss`, expired, bad signature, non-RS256 `alg`, unknown `kid` after one refetch, and either setting unset each call `notFound()`; an unknown `kid` refetches the certs once. Verify the tests fail, then implement `owner()` in `lib/admin/access.ts` with `node:crypto` and verify they pass
- [x] 2.2 Add `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` to `.env.example` and README's Environment table, and add a README section on the admin page with the Cloudflare Access setup (Migration Plan steps 2 and 3); verify by reading both files against `access.ts`'s variable names

## 3. Writer and save

- [x] 3.1 `lib/admin/writer.db.test.ts` on the throwaway database: `save` commits an `INSERT` and its session reports UTC; a throw inside `work` rolls back and sends no `data_rewritten`; a committed save delivers one `data_rewritten` to a `LISTEN` client only after commit; `lib/db.ts`'s pool still refuses writes; no module outside `lib/admin/` and `app/admin/` imports `lib/admin/writer`. Verify they fail, implement `lib/admin/writer.ts`, verify they pass
- [x] 3.2 Reword `CLAUDE.md`'s read-only trap and README's "this app only reads" lines: every session is read-only except the admin writer, used only by `/admin` after the owner check; never add a write anywhere else. Verify by grepping both files for "read-only" and "only reads"

## 4. Bill figures

- [x] 4.1 Copy anton's `true-up-2025.csv` and `true-up-2026.csv` fixtures to `test/fixtures/` and port `test_true_up_statement.py` to `lib/admin/statement.db.test.ts` (rows from the fixtures through the form's row shape; every case: both statements, older dates, replace, the five mistyped edits, monthly bill with $12.90 minimum delivery, next month replaces, not from the start, already stored, 12 rows without minimum delivery, minimum delivery on only some rows, blank rows dropped). Verify they fail for the missing module
- [x] 4.2 Implement `parse` and `store` in `lib/admin/statement.ts` on `readsFor`, `OCTOBER`, `endYearOf`/`trueUpEndYear`, `trueUpLabel`, `minimumDelivery` and `loadPricing`, with the sum tolerances and checked columns in `lib/admin/sums.ts` (no database import); verify 4.1 passes
- [x] 4.3 `saveBill` action in `app/admin/actions.ts`: test that it refuses without the owner (nothing stored), returns the typed values and the parse message on a refusal, and on success stores, says what was stored ("12 cycles of '25 - '26 … $767.73 due" or "1 cycle of '25 - '26 from PG&E's bill"), and revalidates `/admin`. Verify fail then pass
- [x] 4.4 Bill section in `components/admin/` and `app/admin/page.tsx`: the picked true-up year's stored cycles (`?year=`, defaulting to the current year; the picker offers the current year and every year with stored cycles, newest first) and whether its statement is stored, and the rows form keeping its input on a refusal with the named row `aria-invalid`. Tests: the page reads the picked year and falls back to the current one for an unknown year; a refusal re-renders every typed value and marks the row. Verify fail then pass
- [x] 4.5 "Load into form": component test that loading '25 - '26's stored statement fills 12 rows with their reads as MM/DD/YYYY, their figures and minimum delivery, and the TOTAL with the sums; loading a year without a statement leaves minimum delivery blank; loading stores nothing. Then an action test that the loaded '25 - '26 table, with the last cycle at 101.51 and the TOTAL at 827.92, saves to $767.83 due. Verify fail then pass
- [x] 4.6 Live sums: component test that typing the October 2026 statement shows 2437, 827.82 and 60.09 unmarked under the TOTAL, that changing the last cycle's charges to 101.51 shows 827.92 unmarked (within a cent a row, as a save allows), and the first's to 131.41 marks the sum; the TOTAL inputs never change by themselves. Verify fail then pass

## 5. VPP days

- [x] 5.1 `lib/admin/vpp.db.test.ts`: the current season (November 14, 2026 gives 2026, March 2, 2027 gives 2026, May 1, 2027 gives 2027); the season's marked days with their `powerwall_to_grid`, oldest first; mark sets `is_vpp` and refuses a day after today, outside the season or without a `data` row; unmark clears it. Verify fail, implement `lib/admin/vpp.ts` and the `markVppDay`/`unmarkVppDay` actions with the owner check, verify pass
- [x] 5.2 VPP days section: the list with Unmark per day and the Calendar mark picker disabling days after today and outside the season. Component test for the disabled days and the empty-season text. Verify fail then pass

## 6. VPP payout

- [x] 6.1 Payout tests in `lib/admin/vpp.db.test.ts`: 2024 and 2025 recorded with their dates; recording 2025 again replaces it; amount 0 or negative, a non-number, a missing date and a date on or before October 31 of the season are refused with anton's reasons and store nothing. Verify fail, implement the store and `savePayout` with the owner check, verify pass
- [x] 6.2 Payout section with the latest recorded payout, season, amount and the Calendar paid date; component test that a refusal shows its reason and keeps the input. Verify fail then pass

## 7. Integration

- [x] 7.1 `app/admin/page.test.tsx`: without the owner the page calls `notFound()` and reads nothing; with the owner it renders the three sections; no file under `components/` or `app/` other than `app/admin/` links to `/admin`. Verify pass with the full suite (`yarn vitest run`)
- [x] 7.2 `yarn build && yarn start` with the two settings unset: verify by curl that `/admin` answers 404 and `/` still answers 200 with its CSP. Done 2026-11-14: `/admin` 404 bare, with a forged token and with `?year=`; `/` can't render without the database locally (500, `ENOTFOUND`, as before this change), so `/distribution` stood in: 200 with its CSP. The signed-in path is checked on onyx after the release (Workflow follow-up), since only Access issues real tokens
- [x] 7.3 Run `ponytail:ponytail-review` on the uncommitted diff in a fresh subagent, report the findings and wait for the owner's pick before committing. Five findings, all fixed test first: Cloudflare answering without keys locked the owner out until a restart (now refetched); a refused row marked only its kWh inputs (now every input); a failed rollback hid the save's error (ignored now), and the test for it showed a connection lost mid-save went unheard, which would take the server down, and was pooled again (now heard and closed); a payout of 1e999 was stored as infinity (refused); the bill form's labels were defined twice (one copy). A forged save posted to the production build, encoded as React sends it, with no token or a forged one, answered not found to `/` and `/admin` and touched no database

## Workflow follow-up

- Commit the code, then archive the change (spec sync included) as a second commit, `Archive admin-page`, and open one PR.
- Before the release: create the Access application and set the two settings on onyx (design, Migration Plan); ask before publishing the release.
- After the December 2026 bill goes through the form, a separate change in anton-tesla-api-ws retires `import_true_up` and `record_vpp_payout`.
