# Design

## Context

Two rules decide where a car's charging comes from, and they disagree:

- The live scene fills destinations from each source in a fixed order (`DESTINATIONS` in `lib/scene/live-scene.ts`), with the house before the car.
- History splits each interval's charging across the home flows in proportion (`intervalWh` in `lib/intervals/intervals.ts`). The intervals route, the Distribution replay, the Solar day view and `lib/car-charging.ts` (Impact's Home car charging section) all read that split.

Replay draws its links from the recorded vehicle flows, not from the scene's rule, so the scene and the replay of the same moment can disagree today. See proposal.md for the case that started this.

Tesla's interval data already says how much of the Powerwall's charging came from solar and how much from the grid. The only split history makes is the car's share of the home flows.

## Goals / Non-Goals

**Goals:**
- One rule, car before house for every source, in the scene and in history.

**Non-Goals:**
- Detecting Charge on Solar. The setting can't be read, and the rule doesn't need it.
- Marking the 1.2 kW hold before Charge on Solar pauses. Attribution only divides up measured power; the threshold decides when the car charges, not where its power comes from.
- Stored data. The vehicle flows are computed on read, so there is no backfill.

## Decisions

**Car before house for every source, not only solar.** One rule matches the app for the 10:08 case and keeps the scene and history on the same method. The alternative, car first for solar and then the remainder split in proportion, would leave the live scene (ordered) and history (proportional) using different methods after solar. Trade-off: overnight charges with a part-discharged Powerwall now lean toward the Powerwall.

**The Powerwall stays first in solar's order.** History can't choose here: Tesla's data fixes the Powerwall's solar share. Putting the car before the Powerwall would draw grid-to-Powerwall links when solar can't cover both, which this site almost never has; Powerwall first draws grid to car, which is what happens.

**History fills in the same order the scene does.** `intervalWh` keeps its cap (charging never exceeds home consumption). It then walks the home flows in `HOME_TO_VEHICLE`'s order (solar, Powerwall, grid, already the key order), moving `min(left, flow)` from each. That is the same greedy fill `sceneLinks` does for one destination, so it doesn't need a shared helper.

**Replay's flow order follows the scene's.** `FLOWS` in `lib/scene/replay.ts` lists vehicle before home within each source, so a replayed link comes out in the order the live page builds it.

## Risks / Trade-offs

- [Past percentages move on the next release; a visitor who remembers the old Impact figures sees them change] → Expected and intended; the shift goes toward the app's figures.
- [The rule after solar rests on one app example] → If the app shows a mixed charge that contradicts it, only the Powerwall and grid lists and the order in `intervalWh` change; the specs' scenarios name the cases to recheck.
- [The per-process car-charging cache holds old splits] → The deploy that ships this starts a new process, which empties it.

## Migration Plan

Ship it in a release. Rolling back is the previous release; nothing is stored.
