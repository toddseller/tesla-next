# Proposal

## Why

Critique round 5 (2026-11-24, P3) found Home saying things twice. Since 2021 gives solar's payback month in the chart's key and again in the sentence beside the figures; it gives the true-up year's net as 693.7 kWh in its figure and as 694 kWh in the explanation beside it (True-Up's sentence and net tile disagree the same way). And Habits, a chapter about the always-on load, ends on the Powerwalls' energy out this year, which isn't a habit.

## What Changes

- Habits no longer gives this year's Powerwall energy out. Year's shares already give the Powerwalls' part of each year, and Patterns gives their energy out by year.
- Since 2021 says solar's payback month once, in the chart's key under the dotted line. The sentence beside the figures names solar's payback only while it is projected (no line drawn); the Powerwalls' sentence stays.
- The true-up explanation gives the net to a tenth, as True-Up's net tile does (671.3 kWh, 2.4 MWh), on True-Up and on Home.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: Habits' figures, Since 2021's payback in words, and the explanation's figure.
- `true-up-tracker`: the range explanation's net in tenths.

## Impact

- `components/home/habits.tsx`, `components/home/since.tsx`, `lib/true-up/text.ts`, `app/page.tsx` (the Powerwall figure's query wiring goes), and their tests.
- No API, data or dependency changes.
