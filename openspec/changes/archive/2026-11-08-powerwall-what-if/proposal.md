# Proposal

## Why

The savings card shows the Powerwalls costing $132 to $151 a year on the bill, which raises the question the card can't yet answer: why, and what to do about it. Read-only queries on November 8, 2026 found the cost comes from two habits. Days held full for an outage cost standby top-ups and leave the 4 to 9 p.m. peak to the grid; these are winter at 100% reserve, and Savings mode on poor-solar days or the day before them. In Self-Powered mode, the batteries move 11 to 17 kWh a day into the night, where under NEM2 each kWh earns no more than its noon export would have and loses about 10% on the round trip. The likely better summer setup covers only 4 to 9 p.m. It saves money and leaves more charge overnight for outages. The card should show the split, and price that alternative on the house's real days.

## What Changes

- **Each day is classified as used or held** from what the batteries did: held when they stayed out of the 4 to 9 p.m. peak while the house imported. This works from the 5-minute intervals, so every year from '24 - '25 is covered, not only the days since battery history began in October 2026.
- **The Powerwalls' bill effect is split** into what the held days cost (keeping charge for an outage) and what the used days cost or saved (moving solar in time).
- **A peak-only case:** the year replayed with the batteries charging from solar and covering only 4 to 9 p.m., everything else exported. It uses the batteries' usable size and round-trip efficiency, measured from the house's own data. It is priced like the other cases (PG&E's NEM charges plus WestLight's generation) and shown as a simulation.
- **The card's Powerwalls entry** gains the two parts of the split and a line on what peak-only would have cost compared with what happened, after a mockup round for the longer entry.
- **`/api/true-up-savings`** answers the same new figures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `true-up-savings`: adds the used and held classification of days, the split of the Powerwalls' bill effect, the peak-only case and their fields on the route.
- `true-up-tracker`: the savings card's Powerwalls entry shows the split and the peak-only comparison.

## Impact

- **Code:** `lib/true-up/savings.ts` (the classification, the split and the peak-only case), `lib/true-up/text.ts` and `components/true-up/savings-card.tsx` (the longer entry), their tests and fixtures; `app/api/true-up-savings/route.ts` answers the new fields unchanged in shape otherwise.
- **Database (read-only, unchanged):** `energy_interval` and `meter_day` as now; `battery_sample` only to check the measured battery size against.
- **Docs:** `README.md`'s savings entry names the new figures and that peak-only is a simulation.
- **Unchanged:** the three existing cases and their figures, `/api/true-up-cost`, anton-tesla-api-ws.
- **Later:** outage history from Teslemetry (anton's follow-up) can be set beside the held days' cost, so readiness is weighed against the outages it covered.
