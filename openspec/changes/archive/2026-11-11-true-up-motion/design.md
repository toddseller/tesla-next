# Design

## Context

- **Mockups,** on the motion prototype canvas:
  - "True-Up streaming in", option B, for the count-up. Its Payback card read "9.4 years"; the real card shows calendar years, which don't count.
  - "The Payback card's story", at 2.4 s across the track and 600 ms at each mark.
- **Figures:** the tiles' and savings card's figures are preformatted strings, like "$410" or "1,840" (`lib/true-up/text.ts`). `Rolling` and `useTween` move a figure from its old value to a new one, starting at the value on mount.
- **The Payback card** (`components/true-up/payback-card.tsx`) places its marks by date across a grey track: a solid solar bar to today, a dashed bar from today to the whole-system year, and each mark as label, connector and dot. On a phone it is a list of steps whose rails are solar before today and grey after. The motion rules keep the track still today (`site-motion`, "Motion never moves the layout").
- **Draw-in pieces:**
  - `useEntering` (`components/use-entering.ts`, `ENTER_MS` 650 ms) tells a component it has just mounted.
  - `app/motion.css` has `motion-uncover` (a clip-path from the left) and `motion-pop`, and a reduced-motion block that turns them off.
  - The cycle chart draws in on first view.
- **The page** renders the cards at once, its data mostly kept in memory since `payback-cache`. `TrueUpPage` is one client component that reloads each card's data on totals and pushes a new address for a new range, so the cards stay mounted across both.

## Goals / Non-Goals

**Goals:**
- The count-up and the story play once, on the page's first view, and never move anything around them.

**Non-Goals:**
- Streaming the page, skeletons, and any change to its loading (dropped with `true-up-streaming`).
- Motion on other pages.

## Decisions

**A count-up figure for preformatted text.** A new `CountUp` (beside `components/rolling.tsx`) takes a figure's text, like "$1,840.50" or "92%":
- It finds the first number and tweens it from 0 with `useTween`, keeping the text around it, its separators and its decimal places.
- `useTween` gains an optional starting value, so it can start at 0 on mount; everything else keeps starting at its value.
- The final text sits in the page as one span with transparent text, readable by screen readers, and sets the width. The counting copy is laid over it and hidden from screen readers, so counting never changes a tile's size. (A first build kept the width and the screen reader's text in two extra copies, which repeated each figure's text for every test that reads a tile.)
- After the first count it shows its text as given, so a reload changes the figure without counting.
- **Blank until the page's JavaScript runs.** The server's HTML, and the browser's first render, have the counting copy transparent over the final text. So before the page hydrates, a tile shows its unit and line with an empty figure, never a zero that isn't true. The first build sent "$0.00" in the HTML, where it stayed 92 ms on a fast machine and 365 ms with the CPU throttled 4x (review, finding 1). Rendering the same until hydration also avoids a mismatch under reduced motion, which the browser knows and the server doesn't.
- **Only on the page's first view.** `TrueUpPage` provides `FirstView` (a React context) for its first 650 ms, and a `CountUp` reads it once, when it mounts. A new range brings new tiles: a past year has "Net for the year", "True-up" and "Billed against estimate" where the current year has others. Those mount like a first view's but don't count. The first build let any newly mounted figure count, and on the branch container a range change counted three tiles again.
- Under reduced motion `useTween` already returns the final value.

The tiles' values and the savings card's figures use it. The Payback card's years don't.

Alternative: pass numbers and formatters into every tile, as `Rolling` takes them. That reworks `lib/true-up/text.ts`, which returns finished strings.

**The Payback card's story is CSS, timed from its dates, and starts in view.**
- **When:** an `IntersectionObserver` on the timeline starts the story once half of it is in view, so a viewer who scrolls down to the card sees it from the start. A first build started it 650 ms after the page appeared. On desktop the card is about 1,300 px down, so the story was mostly over before anyone reached it, and it felt rushed (2026-11-11).
- **States:**
  - **Waiting:** the server's HTML, and the browser until the timeline is in view, carry `motion-waiting` on each piece, which hides it, so the card shows its grey track. A `@media (scripting: none)` rule shows the pieces when JavaScript doesn't run, and the reduced-motion block shows them too.
  - **Playing:** each piece gets its class and an `animation-delay` from the schedule, counted from that moment.
  - **Done:** after the story's length, plain markup.

  A reload or a range change keeps the state, so the story plays once.
- **The schedule:** the line travels from mark to mark at an even pace, each stretch taking its share of 6 s, with 900 ms at each stop. With today's years, about 3.6 s of line and 3.6 s of stops, so about 7.2 s in all.
- **The lines:** the solid and dashed stretches uncover from their left with `clip-path` (`motion-stretch`, linear), one stretch per stop, so the line pauses at each mark. Only the bar's ends are rounded, as one bar's were.
- **The site's `motion-uncover` gets the same end shape,** `inset(0 0 0 0 round 4px)`. It is the bars' reveal on Solar's forecast, Patterns, Impact and the savings card, all of which have jumped in at half their 450 ms rather than uncovering, as the `site-motion` spec already asks of them. Its end is `inset(0 var(--hidden, 0%) 0 0 round 4px)`: the forecast's fill shows only its share, so it sets `--hidden` to that share. With a full end, on the branch container each forecast fill uncovered to 100%, then slid back to its share as its entrance ended at 650 ms.
- **Each reveal ends at a shape:** `to { clip-path: inset(0 0 0 0) }`, not the element's `none`. A clip-path can't be blended into `none`, so a reveal with only a start state shows nothing for half its time, then all of it in one frame. On screen the line sat empty, then jumped to each dot. Sampling the first stretch frame by frame on the branch container showed it 100% hidden until halfway, then 0%. With the end shape, it went 100, 95.8, 90.7, … 4.8, 0 across its 1.9 s.
- **A mark lands:**
  - **The dot** pops in over 260 ms with a slight overshoot (`motion-land`: from 30% to 112% and back to its size) and sends out one soft ring. The ring reuses the live dot's 700 ms `motion-ring`, in the mark's colour.
  - **The connector** grows up from the dot from 160 ms, over 260 ms (`motion-raise`).
  - **The label** fades in from 320 ms while growing from 85% to its peak and settling back to its size over 600 ms (`motion-grow`, its peak a custom property): 140% for solar's mark, 115% for the others. It grows around its base, above the connector; on a phone the step's text grows from its left edge.
- **The phone:** each rail uncovers downwards with the same delays, and each step lands when the rail reaches its dot.
- **Never moves anything:** everything moves by `clip-path`, `opacity` and `transform`, inside the card's final box. The card's `role="img"` label lists every year from the start, so a screen reader doesn't wait for the story.

Alternative: a JavaScript clock, as the mockup used. It would need state ticking on every frame for about 7 s in a card that otherwise renders once.

**Impact's Solar offset bars move, as its ring does.** The section was keyed by the range, so a new range mounted new bars that uncovered from zero. It now stays mounted:
- each bar is full width, cut by `clip-path: inset(0 <hidden> 0 0 round 8px)`, which `motion-tween` already transitions, the forecast fill's way, and sharing its `hidden` helper;
- `motion-uncover` is on only while the section is entering, since an animation held at its end would override the transition;
- the energy offset and each bar's kWh use `Rolling`, as the ring's figures do.

**The car charging section moves too.** It stays mounted across ranges, so its ring moves as the self-powered one does. Each car's split was three spans laid side by side by width; it is now three full-width layers, each cut by `clip-path` to its stretch, the 2 px gap between sources worked into the cut as `calc(<edge>% + 1px)`. A source with no share keeps its layer, cut to nothing, so it can grow from where it sits. Cars are keyed by name, not place, so a car keeps its bar, with a count after a repeated name, since a car missing from the account's list takes the default name; each split has its own `useEntering`, so a car new to the range uncovers on its own. The kWh roll, formatted to at most one decimal, which every figure from `lib/car-charging.ts` already is.

**Solar's month comes from the day the payback already works out.**
- `paybackDate` already finds the day solar's savings reached its net cost; only its year left the server.
- `payback()` adds solar's `month` ("2025-06") when solar has paid back, and `null` when the payback is projected, since a projected month would be false precision.
- The card writes it "Jun '25": the month's short name, and the year's last two digits.
- The screen-reader label says "solar paid for itself in June 2025".
- The footnote reads "Years, and the month solar paid back."

**Solar's dot sits at its month.** Each year's dot sits mid-year (1 July). Once the month is shown, solar's sits on the 15th of that month instead, so the line stops where the label says. With March 2025, the mid-year dot sat about four months to the right of the month it named (review, second round, finding 1).

**The month lands after the label.**
- On wider screens it sits under "Solar paid back", over the top 16 px of the connector. The connector draws up its full 28 px to the label, then shrinks down from it (`motion-shrink`, a transform, to 12 px) as the month fades in over 400 ms, 920 ms into the stop, once the label has settled. The dot so never loses its line to the label, and nothing moves.
- At rest, the connector is drawn 12 px tall with the month above it.
- On a phone the month follows the label on its line, " · Jun '25", fading in at the same moment.

**The phone's timeline starts as its grey track too.** Each rail sits on a grey track (`rail-track`), with the solar or dashed line drawn down over it. A short piece of track sits behind each dot (`track-bridge`): from the first dot's centre, through each middle dot, to the last one's centre. So the track runs unbroken before the dots appear, as it does across the card. It's placed with a computed `left`, not a centring transform, which drew it a device pixel off the rails at 4x.
- The first build drew only the solar and dashed rails, so the grey rail after the whole-system year floated alone mid-story.
- The second had gaps where the hidden dots would be.

**The phone's projection is dashed.** The rail from Today to the whole-system year takes the same dashed solar pattern as desktop, turned vertical (`repeating-linear-gradient(180deg, ...)`); after the whole-system year it stays grey. The `system-payback` "Payback card" requirement says so, so desktop and phone draw the same line in different directions.

## Risks / Trade-offs

- [A count from zero briefly shows figures that were never true, like $0 charges.] → Chosen with the mockup; 400 ms, first view only, and never years.
- [The story takes about 7 s.] → It starts when the card is in view and needs no input, over a card whose heading already states the years.
- [`@media (scripting: none)` is new: Chrome 120, Safari 17, Firefox 113.] → An older browser without JavaScript would show only the grey track; the card's heading and the `role="img"` label still give every year.
- [Changing pages in the top bar to True-Up is a first view, so it counts and tells the story each time.] → As a chart draws in on each first view; a reload or a range change inside the page doesn't.
- [The first view's count and the story now run apart: the count on arrival, the story when the card is in view.] → Each where the viewer is looking.

## Migration Plan

Merging to `main` deploys nothing. After the merge, a `v*` release (with the user's go-ahead) deploys it. Check the count-up and the story on teslasolar.report, desktop and phone.

## Results

- **Branch container (task 4.2), 2026-11-11, about 12:30 PM PST:** onyx, reading production read-only, through an SSH tunnel, in headless Chromium at 2x (and 4x for the phone rail).
  - **The count:** on the first view, 7 figures at 1280 px and 11 at 390 px were caught counting, keeping their decimals and separators (e.g. "$107.49" on its way to its final figure). There was no counting by 1.5 s. Calendar years didn't count.
  - **The story:** mid-way at 1.5 s, the desktop line stood at "Solar paid back" with its label up, and the rest of the track was grey. At 6 s the card matched the mockup: solid to 2025, on to Today, dashed to 2028, and the warranty mark. The phone told the same story down an unbroken grey track, ending with the dashed rail from Today to 2028.
  - **A range change** ('26 - '27 to '25 - '26) counted nothing and moved no story piece.
  - **Layout shift:** 0.0000 at 1280 and 390 px for the whole first view.
  - **Reduced motion:** nothing counted, and the story's pieces had `animation-name: none`.
  - **Console:** no error and no CSP violation, under the production build's CSP.
  - **Three fixes came from this check,** each test first (see Decisions):
    - counting only on the page's first view;
    - the phone's grey track behind the rails;
    - the bridge behind each dot.
  - **After the review's fixes,** on a rebuilt container:
    - with JavaScript off, the counting figures are transparent, so the tiles show an empty figure, not a zero;
    - the reduced-motion page logged no error;
    - the count, the story, the range change and a layout shift of 0 were as before.
- **Branch container after the rework (6 s, 900 ms, landing, month, starting in view), 2026-11-11, about 1:30 PM PST:**
  - **Waiting:** at 1280 × 900 and 390 × 844, 2.5 s after load with the card below the fold, the card's 31 story pieces were still waiting and its dots hidden.
  - **Desktop story,** after scrolling the card into view:
    - at 1.7 s the solid line was reaching 2025;
    - at 2.9 s Solar paid back had landed, its connector drawn up to the settled label;
    - by 9.5 s it was complete, with "Mar '25" under the label and the connector at 12 of its 28 px.
  - **Phone story:** mid-way, the 2028 step was landing with its ring; by the end, "Solar paid back · Mar '25".
  - **The month:** `/api/payback` answered solar's month, 2025-03.
  - **Layout shift:** 0.0000 at both widths.
  - **Without JavaScript:** the timeline and month show complete (opacity 1).
  - **Reduced motion:** complete before scrolling, with the connector at rest at 12/28.
  - **Console:** no error.
  - **The line still looked too fast on the branch** with the card in view at load. Sampling it frame by frame showed each stretch jumping in at its halfway point instead of drawing (see Decisions, "Each reveal ends at a shape"). The site's older `motion-uncover`, the savings and Patterns bars' reveal, does the same on teslasolar.report: 131 frames showed only `inset(0px 100% 0px 0px round 4px)`, then `none`.
- **Fixed, test first:** each stretch and `motion-uncover` now end at `inset(0 0 0 0)`, and solar's dot sits mid-month. Sampled again on the rebuilt container, the first stretch drew smoothly, 100% hidden down to 0% across its 1.9 s.

## Rollout

- **Released** as v2026.11.11.8 on 2026-11-11, about 1:55 PM PST, from the merge of PR #49. The `Deploy` run passed and teslasolar.report answered 200.
- **Checked on teslasolar.report** in headless Chromium, as on the branch container:
  - **The count:** on the first view, 7 figures at 1280 px and 11 at 390 px were caught counting, keeping their separators and decimals; none by mid-way. Reduced motion counted nothing.
  - **The story:** 2.5 s after load with the card below the fold, its 31 pieces were waiting and its dots hidden, at both widths. Scrolled into view, it played to the end, with "Mar '25" under the label on desktop and " · Mar '25" on the phone. Without JavaScript, and under reduced motion, the card showed complete, the connector at rest at 12/28.
  - **Solar's dot** sits at 30.3% of the track, mid-March 2025.
  - **A range change** after the story counted nothing and brought back no story piece. One taken while the story still played found its 3 stretches still running, as expected.
  - **The uncover:** the savings bar went through 27 clip values in 130 frames, where the last release showed 2; the forecast's fills uncovered straight to their shares.
  - **Impact,** from today to All time: the Home bar kept its element and grew over 25 steps while the offset rolled; R2D2's split moved from 1/0/99 to 8/29/63 with the car charging ring kept.
  - **Layout shift:** 0.0000 at 1280 and 390 px. **Console:** no error.
