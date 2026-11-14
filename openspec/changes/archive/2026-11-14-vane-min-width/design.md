# Design

## Context

The arrow is a plate drawn in its own vertical plane, pointing along +x, and posed with one affine `matrix(dx dy 0 1 x y)` (`vanePose` in `components/scene/live-scene.tsx`), where `(dx, dy)` is the compass direction mapped along the house art's ground axes (`vaneAxis`). The arrow's width on screen is `|dx|`, the direction's left-to-right part. With east `(0.97, 0.24)` and north foreshortened to `(0.51, -0.48)`, `dx` is zero at about 152 degrees (pointing straight at the viewer) and 332 degrees (straight away). The weather-vane design accepted that collapse as what a real vane does; on teslasolar.report it reads as a missing arrow (see proposal.md, Why).

The frame loop writes the pose every frame from the swinging, shaking angle (`angle + wobble`), and knows the wind's direction as `vaneTarget`.

## Goals / Non-Goals

**Goals:**
- A visible arrow at every direction, with the toward/away tilt it already has.
- No side-to-side flicker when a gusty wind shakes the vane across end-on.

**Non-Goals:**
- True perspective near end-on. The minimum width is a cheat, chosen to read well rather than to be exact.
- Changing the compass arms, post, swing, shake or readout.

## Decisions

**Clamp the arrow's width, keep its length and tilt.** In the pose, `dx` becomes at least `MIN` in size; `dy` is untouched, so the arrow still tips down toward the viewer for a southerly wind and up for a northerly one, at its full foreshortened length. *Alternatives:* lay the arrow flat like a compass needle, which never goes edge-on but no longer looks like a vane; or add a flat fin or shadow beside the upright plate, which is more art to draw and tune for the same fix.

**The side is remembered, and changes only once the heading is clearly past end-on.** Exactly end-on the arrow has no side, so clamping by the pose's own sign would flick it from one side of the post to the other on every shake across end-on. The pose's `dx` is a side's sign times `max(|dx|, MIN)`. The frame loop keeps the side, starting from the wind's direction, and takes the spring's heading's (the swinging angle before the wobble is added) only while the heading is outside the zone (`|dx| >= MIN`); inside the zone the side holds. A shake never moves the heading, so a shake around SSE stays on one side, its far swings drawn as their mirror. A swing through end-on flips side once, as the heading leaves the zone, which is fast enough mid-swing not to notice; when it settles near end-on, an overshoot that leaves the zone may flip it, and the return into the zone keeps that side, so it still flips at most once. Under reduced motion the side is the wind's direction's, so turning reduced motion off starts from the right one. Side-on, the heading and the pose share a sign, so nothing changes there. *Alternatives, each tried and dropped:* the target direction's sign only while the pose is within the zone, the plan before the tests: a gale's shake of about 16 degrees around 150 carries the pose out of the zone on the far side, where its own sign took over and it still flicked; the heading's sign alone, which the review found flipped 3 or 4 times as the spring settled near end-on; the heading's sign outside the zone and the wind's inside it, the review's fix, which still flipped twice on the branch container swinging from W to 154, as 154 lies on the other side of end-on from 152 and the first overshoot left the zone on the far side.

**`MIN` is 0.25**, settled in the mockups (https://claude.ai/artifact/7iGyuSWKpL6Cb8c1DuiwcU, approved 2026-11-14) against 0.15, which left the arrow about 4 px wide on a 390 px phone, and 0.35, which started to read as side-on. Side-on is about 0.97. At 0.25 the zone is roughly 13 degrees either side of 152 and 332.

**Tests read the arrow from its matrix.** The vane tests' `pointing` helper inverts `vaneAxis`; inside the zone the clamped `dx` would misread, so tests of the clamp check the matrix's `dx` and `dy` directly instead. The existing tests' directions (225, 350 to 10, 180, 270) sit outside the zone and keep using `pointing`.

## Risks / Trade-offs

- [The narrow plate still reads as a sliver at night] → the mockups show it by day and at night, at 1440 and 390 px, before `MIN` is chosen.
- [The one flip during a swing through the zone shows] → checked on the branch container on a replay whose wind turns from east to southwest (Results).
- [A shake that carries the pose past end-on is drawn as its mirror, on the heading's side] → only for a wind within the shake's 25-degree cap of end-on, where the arrow is narrow anyway; it reads as the arrow breathing in width rather than as a wrong direction.

## Migration Plan

Ships in a release like any scene change; rollback is the previous release.

## Results

Checked 2026-11-14 on a throwaway branch container on onyx reading production read-only, through an SSH tunnel, in headless Chromium at 1440 x 900 and 390 x 844 (3x screenshots). The production build drops the development weather overrides, so the directions were checked on replayed readings:

- **Toward the viewer**, 2024-02-04 1 PM ("23 mph, gusts 56 mph, from SE", 152°) and 2023-02-24 5 AM at night (152°): the arrow is 0.25 wide, its tip down toward the viewer (`dy` 0.53), at both widths.
- **Away**, 2026-05-17 5 PM (327°) and 2022-10-22 10 PM at night (327°): 0.25 wide, its tip up into the picture (`dy` -0.53).
- **Side-on**, 2026-11-01 1 AM (from W): unchanged, `dx` -1.01.
- **Gusty shake**, the 2024-02-04 replay playing: over 6 seconds every frame stays on one side of the post, between 0.25 and 0.46 wide.
- **Swing**, 2026-10-31 scrubbed from 8 AM (from E) to 11 AM (from SW): over 4 seconds the arrow changes side once, never under 0.25 wide, and settles at -0.89.
- **Swing settling end-on**, after the review: 2026-11-11 scrubbed from 12:30 PM (from W, 288°) to 8:30 PM (from SE, 154°): over 5 seconds the arrow changes side once and settles 0.25 wide. Before the fix it changed side twice.
- **Live** ("7 mph, gusts 9 mph, from S") and the console: no errors and no CSP violation, there and under `yarn build && yarn start` locally.
