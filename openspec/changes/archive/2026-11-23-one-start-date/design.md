# Design

## Context

`lib/scene/replay.ts` holds both dates: `FIRST_DAY` ("2021-10-10", the first day of data) and `PTO` ("2021-10-22", permission to operate). Solar, Impact and Distribution count from `FIRST_DAY`. Home counts from `PTO`: `app/page.tsx` (its first year, the since-2021 `impactByMonth` and `impactFigures`), `components/home/pick-a-day.tsx` (imported as `FIRST`), `components/home/year.tsx` and `lib/home/solar-hours.ts` with its route. The payback (`lib/true-up/payback.ts`) and backup events' commissioning rule count from `PTO` by design. Home's words name the date in its heading, the Since chart's description, Pick a day's count and Records' empty outage line; Top Ten's outage note and the Payback card name it too.

## Goals / Non-Goals

**Goals:** every figure counted from the start counts from `FIRST_DAY`, and every sentence that names a start names the date its figures use.

**Non-Goals:** changing the payback calculation, the backup events' commissioning rule, or `PTO` itself.

## Decisions

- **Home's data readers switch from `PTO` to `FIRST_DAY`**, and the sentences naming the start read it from the constant rather than spelling the date in each component, so a figure and its words can't disagree again. Alternative: change only the words. Rejected: Home's totals would still leave out ten days Solar and Impact count.
- **The date in words comes from one helper** formatting a `YYYY-MM-DD` day as "October 10, 2021" (the Pick a day component already has one); Home's heading, the Since chart's description and Pick a day use it.
- **Records' empty outage line and the Payback card keep `PTO`** and say why: "since it was approved to run on October 22, 2021", "when the system was approved to run". Top Ten's note already says so.
- **The year chapter's 2021 starts at the first day with figures**, which the solar-hours query finds once its lower bound is `FIRST_DAY`; no day is named in code.

## Risks / Trade-offs

- [Home's since-2021 totals and share change, by about 262 kWh of solar and up to a point] → Intended: they now match Impact's All time and Solar's.
- [Pick a day and Random day can land on October 10 or 11, whose day view is empty] → Accepted: Solar's calendar already offers them; a later change could start Random day at the first day with solar.
