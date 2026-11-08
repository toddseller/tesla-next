# Proposal

## Why

The Top Ten's export rankings are led by VPP event days: May 30, 2024 (60.0 kWh, #1) and July 23, 2024 (49.6 kWh, #2) are the evenings Tesla discharged the Powerwalls to the grid for PG&E, 12.0 and 6.6 kWh by Tesla's count. Those exports aren't what the system does on its own, and the day's net hides that the house then ran on grid power with the batteries at the event's reserve. Every event since the first, in May 2024, is marked as a VPP day, so the page can rank without them, and should by default.

## What Changes

- **The export rankings leave out VPP event days by default.** The ten export days are chosen from days not marked as VPP days, and each export month is summed over its days that aren't. The solar ranking is unchanged.
- **A switch, Without VPP events | With VPP events,** governs both export rankings. `/top` shows them without; `/top?vpp=with` shows them as today, VPP days included.
- **The footnote follows the switch:** "The export rankings leave out VPP event days, when Tesla discharged the Powerwalls to the grid for PG&E." or "The export rankings include VPP event days, when Tesla discharged the Powerwalls to the grid for PG&E."
- **`/api/top-ten?vpp=without`** answers the rankings without VPP days, in the same shape. Plain `/api/top-ten` stays equal to Flask's `/api/v2/top_ten` until 7b retires the comparison; the page asks for the variant it shows, server-side and on each reload.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `top-ten`: the export days and months gain the rankings without VPP days, which the page shows by default; a switch and the address choose between them, the footnote says which is shown, and `/api/top-ten` gains `?vpp=without`.

## Impact

- **Code:** `lib/top-ten.ts` (the export queries take whether to leave VPP days out), `app/api/top-ten/route.ts` (the parameter), `app/top/page.tsx` (reads `vpp` from the address), `components/top-ten/top-ten-page.tsx` (the switch, the footnote, reloading the shown variant).
- **Database (read-only, unchanged):** `data.is_vpp`, already in `test/schema.sql` and set by anton-tesla-api-ws.
- **Docs:** `README.md`'s top-ten entry names the parameter.
- **Unchanged:** anton-tesla-api-ws, the default `/api/top-ten` answer and `scripts/compare-top-ten.mjs`, the solar ranking, and how VPP days count on the Solar page and the True-Up Tracker.
