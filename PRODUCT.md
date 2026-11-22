# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is the home's owner, watching their own Tesla solar and Powerwall system: how much it made today, whether it is running right, and where the house stands for its PG&E true-up. They check it often, on a phone as much as a desktop, and use `/admin` to enter bills, payouts and VPP credits.

The site is also for other people, and should keep them exploring rather than land and leave:

- **People weighing solar:** neighbors and friends considering panels or Powerwalls, who want to see what a real system does month after month, cloudy days and outages included.
- **The curious and data-minded:** people who enjoy exploring a long, honest dataset: records, patterns, weather.

Anyone can open teslasolar.report, and every view's range lives in its address, so a link shows exactly what was shared.

## Product Purpose

Tesla Solar Report shows what one home's solar panels and Powerwalls have done since October 2021, live and over any range: generation, home use, grid import and export, battery use, outages, and the true-up in kWh and dollars. It replaces the Flask site in anton-tesla-api-ws, one page at a time, without changing a figure that site showed.

Success: the owner can answer "is it working, how is it doing, and where do I stand with PG&E" in a glance, and trust every number to match the source. A visitor follows the data as a story, from what the house is doing now out to the years since 2021, and goes on to explore the pages behind it.

## Positioning

It is built on this home's own recorded data, read straight from the database anton-tesla-api-ws writes, with figures computed exactly as the original site and the PG&E bills compute them. It is a personal instrument with years of history, not a vendor app or a generic solar dashboard.

## Operating Context

- Pages: Solar (`/`, day views and a range chart), Impact (`/impact`), Distribution (`/distribution`, the live flow scene with weather and day replay), True-Up (`/true-up`), Top Ten (`/top`), Patterns (`/patterns`), and the owner-only `/admin`.
- Distribution updates live from the database's notifications; most other pages render their figures on the server per request and do not update while open.
- Ranges are `start`/`end` dates in the address, in the site's time zone (America/Los_Angeles).
- Temperatures and wind display in the units of the browser's region.
- Self-hosted on onyx in Docker behind a Cloudflare tunnel; releases are `v*` tags.

## Capabilities and Constraints

- Read-only against production, except `/admin`'s saves after the owner check. No other surface may write.
- Figures must match anton-tesla-api-ws's results, including its rounding (some totals shift by 0.1 kWh if the casts change).
- The system's costs are private: the site shows years to payback and the month solar paid back, never dollar costs.
- Distribution and the Solar page's day views and range chart are ports; their behavior is fixed by the ported specs.
- Every page is rendered per request (per-request CSP nonce); a production CSP without `'unsafe-eval'`.
- Behavior of every part is specified in `openspec/specs/`; changes go through OpenSpec.
- Terminology: true-up, billing cycle, NEM, VPP, Powerwall, always-on load, export (sent to PG&E), import (from the grid).

## Brand Commitments

- Name: "Tesla Solar Report"; domain teslasolar.report; the existing orange sun icon.
- The incumbent design system lives in `app/globals.css`; the redesign's mockups are at https://claude.ai/artifact/7crQGRyQS9J8wSdKYJjD6d. Distribution's house scene keeps its own styling.
- New pages and page redesigns start with their own mockups.

## Evidence on Hand

- Real data from October 2021 on: daily and interval energy, live power, weather, outages, billing cycles, bills and VPP credits.
- Records worth showing as they are: Top Ten's best solar days, biggest export days and months, longest outages.
- No testimonials, users, press or comparisons exist; never invent them.

## Product Principles

1. Numbers match the source. A figure that differs from the original site or the bill is a bug, whatever the design gains.
2. Live state reads at a glance. Distribution's flow and today's figures should be understood in seconds, on a phone.
3. Tell the story the data holds, never a pitch. The owner and a visitor read the same page; the narrative comes from real figures, including the unflattering ones (outages, cloudy months, the Tesla and PG&E meter gap).
4. Every chapter is a doorway: a story beat leads to the page and range that hold its full data.
5. Private stays private: costs and credentials never reach the public site.

## Accessibility & Inclusion

WCAG 2.2 AA. Motion follows `site-motion`, which shows every chart and figure in its final state at once under reduced motion (Distribution's house scene keeps its own handling). No specific user needs beyond that are known.
