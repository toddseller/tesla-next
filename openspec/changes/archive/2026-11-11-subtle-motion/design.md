# Design

## Context

See proposal.md for why and the delta spec for the behavior. What shapes the approach:

- **Charts.** They are recharts 3.8.0 (`ComposedChart` on the day view; `BarChart` on the range chart, the forecast card's Today by hour and True-Up's cycle chart) with all animation off. The horizontal bars are plain `div`s whose width is a percentage. Impact's ring is an SVG with one dashed `circle` per share (`components/impact/sections.tsx`). Top Ten's timeline places `span` dots with `left` and `top`.
- **Reloads.** `useReload` swaps in fresher data for the same key; the live stream triggers it every few minutes. A change of range or day changes the address. `SolarPage` and `ImpactPage` stay mounted across those changes (`router.push` or `router.replace` to the same route).
- **Recharts 3 animation.** An `Area` with no earlier points reveals itself by a clip rectangle growing from its first point's x to its last, so its pace is even across the plot whatever the easing does to time. With earlier points, it interpolates each point from old to new. A `Line` animates its stroke dash along the path's length, so a hill draws unevenly across. `isAnimationActive` defaults to `"auto"`, which follows `prefers-reduced-motion`.
- **View Transitions.** Next 16.4.5 bundles React `19.3.0-canary-278794d7-20261002`, which exports `ViewTransition` and `addTransitionType`. React DOM calls `document.startViewTransition`. `router.push` and `router.replace` take `{ transitionTypes }`, as does `Link`. No `experimental.viewTransition` setting exists in this Next to turn on.
- **Rendering.** Pages render per request with a per-request CSP nonce (`lib/csp.ts`). Inline style attributes set through React are style properties, not a `<style>` element, so the CSP doesn't block them.
- **Prototype.** The canvas at https://claude.ai/artifact/JmyaCrFweA1QgW57o5VJA9 has the timings the owner chose. Its Rules board lists the decisions.

## Goals / Non-Goals

**Goals:**
- One place for the timings, so every chart moves alike.
- Motion that is tied to the element's life: drawing in happens when an element mounts, so a reload, which keeps the elements, can't replay it.

**Non-Goals:**
- Page changes between top-bar tabs (`page-transitions`).
- Distribution's house scene, the house use heat grid, the payback track, the days strip, the range controls and tooltips.
- Motion on hover or pointing.

## Decisions

### Drawing in is mounting, or the first moments of a chart

Plain HTML bars (Impact, Patterns, the savings bar) and Top Ten's dots carry their enter class for good. Their elements outlive a reload, so the CSS animation, which runs when an element is inserted, plays once. Where a range or day change should draw them again, their section is keyed by it (`SolarOffset` and `CarChargingSection` by the Impact range), so the change mounts fresh elements.

Recharts is different. Each series wraps its marks in an animation keyed by an id that changes whenever its props object does (`useAnimationId`), and that object is new on every render. So recharts rebuilds every bar and path on every render, reloads and live statuses included. A recharts chart's marks therefore carry their enter classes only while `useEntering(ms)` says the chart is in its first moments: 650 ms for columns (450 ms plus the 200 ms stagger cap) and 900 ms for the day chart. A render after that rebuilds them with no class, so nothing replays. Each chart is keyed by what it shows (the range's address, the day), so a new one starts its first moments again.

Alternative: track "has drawn" per mark. Recharts' rebuild would still drop the state with the element.

### One stylesheet of keyframes

`app/motion.css`, imported by `app/globals.css`, holds the motion stylesheet:

- **Timings:** `--motion-enter: 450ms`, `--motion-tween: 400ms`, `--motion-ease: cubic-bezier(.2,.7,.2,1)`.
- **Keyframes:** `rise` (scaleY from 0), `uncover` (`clip-path: inset(0 100% 0 0 round 4px)` to `inset(0 round 4px)`), `sweep` (ring dash from 0), `pop` (opacity and `scale` from .6) and `ring` (the live dot).
- **Classes:** a few that apply them. A per-item `--i` custom property gives the stagger, `animation-delay: min(calc(var(--i) * 15ms), 200ms)`.

A `@media (prefers-reduced-motion: reduce)` block sets `animation: none` and `transition: none` for those classes.

Alternative: Tailwind's `tw-animate-css` utilities, already installed. They have no clip-path uncover and no stagger cap, and the timings would end up spread across class strings.

### Columns rise about the zero line

The range chart and True-Up's cycle chart stack segments above and below zero. Each segment's shape (`section`, `flow`) gets the `rise` class with `transform-box: view-box` and `transform-origin` at the zero line's y, which comes from the value axis's domain and the plot height recharts passes to the shape. Every segment of a column then scales about the same line, so the column grows as one piece, with no gaps opening between segments. `--i` is the column's index.

After the first paint, the `Bar`'s `isAnimationActive` turns on with 400 ms and ease-out. A reload then interpolates each segment from its old values to its new ones: today's column grows, and unchanged columns interpolate to themselves and don't move. Because one easing drives every segment's `y` and `height`, the segments stay joined.

Alternative: recharts' own mount animation. Each segment would grow from its own bottom, so a stack would come apart mid-animation, and recharts has no per-column stagger.

### The estimate first, with the chart's own clip paths

On the day view's Solar view, the chart adds two `clipPath`s while it draws in. Each holds a rect the chart's full size that grows from the left by `transform: scaleX`:
- `motion-expected` grows over 600 ms with `linear`. The expected line's layer is clipped by it.
- `motion-flows` grows over 600 ms easing out from 300 ms, or at once with no expected line. Every flow area and top edge is clipped by it.

Both rects span the whole chart, so the flows start when the line is halfway across. The ids are fixed, which is fine while a page shows one such chart; True-Up's cycle chart reuses `motion-flows` with no delay for its lines and band.

The forecast card follows the same rule with its own marks:
- **Today bar:** the track uncovers with `linear`, and the made fill (a full-width bar clipped to its share) uncovers from half the enter time.
- **Today by hour:** each hour's expected column rises with `linear`, and its made column starts half the enter time later.

Alternative, the one first planned and checked in the spike: recharts' own `Area` reveal, which grows a clip rect at an even pace. The flows' top edges are `Line`s, whose animation traces the path's length. Making them unfilled `Area`s would add area paths that the stacking tests and the bottom-band logic read. Clipping by CSS keeps the chart as it was.

### Tweens

The tweens split into two kinds:

- **Marks** move by CSS transition on the same element:
  - the Today bar's clip;
  - the ring's `stroke-dasharray` and `stroke-dashoffset`, which are paint, not layout;
  - recharts' interpolation for today's column.
- **Figures** use `useTween(value)` (`components/use-tween.ts`). It moves the figure from the shown value to the new one over 400 ms with a cubic ease-out through `requestAnimationFrame`, and returns the value at once under reduced motion or on the first render. That way the server's HTML and hydration agree.

`Rolling` (`components/rolling.tsx`) renders a figure. At rest it is one plain span. While it rolls, the moving text is `aria-hidden` beside an `sr-only` span holding the new value, so a screen reader never reads a figure in between.

The range chart's today column tweens through recharts' own interpolation, turned on once the chart has entered, as `"auto"` (which leaves it still under reduced motion, where `true` would not): unchanged columns interpolate to themselves, and today's grows from its old height. The cycle chart, the day chart and the hour columns keep recharts' animation off, so a reload redraws them in place.

Alternative: a counter library. Twenty lines don't warrant one.

### Day steps slide with a View Transition

`DayPanel` steps call `router.replace(address, { transitionTypes: [direction] })`, with `day-next` or `day-previous`. The day's content (`DayView`) sits in a `<ViewTransition>` whose `update` animation is chosen by type:
- `day-next` gets the class `slide-next`: the old content leaves left in 150 ms and the new comes in from the right in 250 ms.
- `day-previous` gets the mirror.
- Any other type gets `none`.

The root's `::view-transition-old(root)` and `::view-transition-new(root)` animations are `none`, so the stepper, the back link, the strip and the top bar don't move. The new view is live during the transition, so the new day's chart starts drawing as it slides in.

This answers the fetch delay. The day comes from the server in 0.1 to 0.4 s, so the slide can't start on the click: the old day stays until the new one has arrived, and then both move in one pass. That is the behavior the owner chose for page changes.

Alternative: slide the new content in on mount by CSS and drop the out half. That is simpler, but the old day would vanish with no exit, and the step would read as a cut.

### The live dot

`Status` keeps a counter of statuses received. The ring is a `span` keyed by that counter with the `ring` class, so each status mounts a new one that plays once. The charge figure uses `useTween`.

## Risks / Trade-offs

- [`ViewTransition` comes from the canary React that Next bundles] → Next ships it in its stable 16.4 release and exposes `transitionTypes` on the router; the first task checks it in a production build under the CSP before anything depends on it. A browser without `startViewTransition` switches days at once, as today.
- [The two halves of a day slide happen after the fetch, so a slow day load still shows the old day for up to 0.4 s] → This is the behavior chosen for pages. The stepper's own state changes at once, so the click still has feedback.
- [Recharts' mount animation in a hidden or background tab may finish without painting] → Nothing depends on it finishing: `onAnimationEnd` only turns animation off.
- [`transform-box: view-box` on SVG shapes] → It's supported in current Chrome, Safari and Firefox. The browser check covers all three widths in Chrome, and Safari at least once.
- [Recharts' clip reveal assumes every series spans the whole day] → The rows cover 0 to 1440 for every view (`fill`). A test pins that the expected series has a row at the plot's first and last step.

## Results

- **Spike (task 1.1), 2026-11-11:** a throwaway page in a local `yarn build && yarn start`, under the production CSP header with its nonce. `router.replace` with `{ transitionTypes: ["day-next"] }` started `document.startViewTransition` with that type, and the slide's keyframes ran on `::view-transition-old` and `::view-transition-new`. There were no `securitypolicyviolation` events. An unfilled recharts `Area` with `animationEasing="linear"` revealed about 100 px every 500 ms across 600 px.

- **Branch container (task 6.2), 2026-11-11:** onyx, reading production read-only, through an SSH tunnel in Chrome at 1280 pixels.
  - The first build showed Today by hour's expected columns black. Tailwind hadn't generated `fill-solar/25`, because the class sat against `${` in a template literal. The class strings now leave a space before each expression; the rebuilt container showed them in their faded solar. `components/class-names.test.ts` now fails on any component class name run into an expression.
  - First views: the Solar page ran 42 `motion-rise` and 5 `motion-uncover` animations, Impact a `motion-sweep` and its bars, Patterns 12 each of `motion-uncover`, `motion-rise` and `motion-pop`, Top Ten 40 `motion-pop`, and True-Up its columns, line reveal and savings bar.
  - On the Solar page, 13 s later, after live statuses had re-rendered it, nothing was running and no mark carried `motion-rise`.
  - A day step from April 17 to 16, 2026 started a view transition typed `day-previous` with `motion-out-right` and `motion-in-left`. Total Generated rolled from 31.3 to 25.7. The expected line's clip grew evenly (0.36, then 0.72 of the width about 200 ms apart) while the flows' clip waited. After the draw, no clip path remained.
  - Layout shift stayed under 0.001 on every page and through day steps (0 on Impact and True-Up), with no CSP violation.
  - Not checked: the 375-pixel width (the browser window wouldn't shrink below its screen's width), reduced motion in a browser (the stylesheet test covers its rules) and Safari.
  - The owner then went through the branch in their own browser through the same tunnel and found it right. Its outlines first looked recolored: the Dark Reader extension restyles `localhost`, not teslasolar.report.

## Migration Plan

Release as usual (ask first). Nothing on the server changes. Rollback is the previous release.

## Rollout

Released as v2026.11.11.0 on 2026-11-11. Its Deploy run passed; onyx runs the tag and teslasolar.report answered 200.

- **The live site:** the Solar page's first view ran 42 `motion-rise` and 5 `motion-uncover` animations. 15 s later, after a live status had arrived (its dot rang), nothing was running and no column carried `motion-rise`. Layout shift was 0, with no CSP violation.
