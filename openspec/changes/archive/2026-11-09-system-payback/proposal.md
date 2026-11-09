# Proposal

## Why

The True-Up Tracker says what the system saved each year, but not whether it has paid for itself. The owner knows what the solar and the Powerwalls cost, but those figures are private: the repository is public and so is the site. The savings are also priced only from '24 - '25 on, because WestLight's rates are stored only from August 2024. PG&E's are stored only from September 2023, and PG&E's readings from October 2023, and PG&E no longer offers older usage. So '23 - '24 can be priced with one estimate, WestLight's generation rate, while '21 - '22 and '22 - '23 can only be estimated as whole years.

## What Changes

- **'23 - '24 gets priced savings.** WestLight's (then Peninsula Clean Energy's) E-TOU-C generation rates for September 2023 to July 2024 are estimated from PG&E's stored generation rates, times each period's ratio of PCE's first known rate (August 2024) to PG&E's then, and marked as estimated. The savings card appears for '23 - '24 and says its generation rates are estimated.
- **The system's costs stay on the server.** They are read from a file on onyx, named by `SYSTEM_COSTS_FILE` in `.env` and mounted read-only, as the database password is. They never appear in the repository, the specs, the tests, the route's answers or the page. Without the file, there is no Payback card.
- **A Payback card** on the True-Up Tracker, for the system's whole life whatever year is picked, giving years only:
  - Solar: the year it paid for itself, or the year it is projected to.
  - The whole system: the year solar's savings alone cover the solar and Powerwalls together, or the year they are projected to.
  - The Powerwalls: the year they would pay for themselves, or that they won't in dollars, and what they did in outages instead.
- **'21 - '22 and '22 - '23 solar savings are estimated per year** for the payback, from '23 - '24's: scaled by that year's solar output and by that year's average E-TOU-C cost in PCE and PG&E's joint rate comparisons. The Powerwalls count only priced years.

## Capabilities

### New Capabilities
- `system-payback`: the private costs file, the savings that count toward payback year by year (priced or estimated), and the Payback card, which shows years and never costs.

### Modified Capabilities
- `true-up-savings`: priced from '23 - '24 on, with WestLight's generation rates for that year estimated from PG&E's.
- `true-up-tracker`: the savings card for '23 - '24, naming its estimated generation rates; the Payback card on the page.

## Impact

- `lib/true-up/westlight.ts`: estimated revisions from September 2023, marked as estimated. `lib/true-up/savings.ts`: the first priced year moves to '23 - '24.
- New `lib/true-up/payback.ts` (reading the costs file, the year estimates, the payback dates), `app/api/payback/route.ts`, and a card in `components/true-up/`.
- New env var `SYSTEM_COSTS_FILE`, with its read-only mount in `docker-compose.yml`. The README documents the file's shape, not its contents, and CLAUDE.md says never to commit or print the costs.
- Reads only what the app already reads (`rate_revision`, `energy_interval`, `meter_day`, `data`, `vpp_payout`, `grid_outage`). Nothing in anton changes.
