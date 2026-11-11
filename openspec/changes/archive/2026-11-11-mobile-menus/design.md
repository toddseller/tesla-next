# Design

## Context

- **Mockups:** https://claude.ai/artifact/CPvmMcKaLWuUFt5Lts9V1j. The phone boards were chosen on November 11, 2026:
  - "Proposed: Impact" for the presets menu beside the dates button (B, over A's one menu holding the presets and the dates);
  - "Proposed: page menu" for the hamburger and its open and close motion (playable);
  - "Proposed: True-Up presets open" for the Earlier years joining the menu.
- The hamburger was chosen over a button naming the page: the page's own title already says where the viewer is, and a fixed 44 px square doesn't change width from page to page. It also fits beside the name at 320 px, where "Distribution ▾" wouldn't.
- `components/top-bar.tsx` renders the links in one `nav`. `components/solar/range-controls.tsx` holds `PresetGroup`, which Solar, Impact, True-Up and Backup share, and `EarlierMenu`, a Popover of `menuitemradio`s. The Popover (`components/ui/popover.tsx`) already fades and zooms in on open and out on close (tw-animate-css, 150 ms), and Radix keeps it mounted until the closing animation ends.
- `app/motion.css` holds the site's ease-out (`--motion-ease`) and the reduced-motion block. Popovers aren't in that block today.

## Goals / Non-Goals

**Goals:**
- One switch point, 640 px (Tailwind's `sm`), the one `range-controls` already uses.

**Non-Goals:**
- No change from 640 px up.
- The two-choice switches (readings, VPP) and the Solar day view's controls stay as they are.

## Decisions

**Both layouts are rendered and CSS picks one.** The wide-screen links and buttons get `max-sm:hidden` and the phone menus `sm:hidden`. The pages are server-rendered per request, so a JavaScript width check would render one layout on the server and switch after hydration, which flashes and mismatches. The repo already lays phones out with `max-sm:` classes. An element hidden with `display: none` is out of the accessibility tree, so a viewer only meets one of them.

**The page menu is a Popover of links in `top-bar.tsx`.** The trigger is the hamburger, inside its own `<nav aria-label="Pages">` with `sm:hidden`. The menu holds the same six `Link`s with the same `onNavigate` page slide and `aria-current`. Its open state is controlled, so choosing a link closes it. They stay plain links, not ARIA menu items: this is navigation, and a link list keeps "current page" and opening in a new tab working. The menu marks the current page with the red underline but not with the `nav-highlight` view transition: two elements with one transition name abort the transition. The hidden wide-screen highlight is `display: none` and takes no part. Radix portals the menu out of the `nav`. The landmark still holds the button that opens it, which is what the spec's phone scenario asks for.

**The bars animate from the trigger's `data-state`.** Radix sets `data-state="open"` on the Popover trigger, so three `span`s with a `.motion-burger` rule in `app/motion.css` turn into the X with CSS alone. Each bar transitions its transform (and the middle one its opacity) in 200 ms on `--motion-ease`, and the transition runs back on its own when the state flips to closed. No React state drives the icon.

**The menus reuse the Popover's motion.** The fade and grow from the trigger's side (`origin-(--radix-popover-content-transform-origin)`) in 150 ms, in and out, is the motion the mockup plays. The `popover-content` slot joins the reduced-motion block in `app/motion.css`, with `.motion-burger`. That also stops the Earlier menu and the dates picker animating under reduced motion, which the `site-motion` spec's intent already called for.

**`EarlierMenu` becomes `PresetMenu`, used twice.** It takes the items, the range, `onRange` and the label it shows when none is picked:
- Wide screens keep it as the Earlier menu ("Earlier").
- Phones get one `PresetMenu` holding every preset, with the earlier years spliced in before the last, All time. It shows "Custom" when nothing is picked.

Generalizing the one menu the repo has beats adding a second one. The phone trigger is named "Preset ranges: This month" (the group's label plus the choice) for assistive technology. That keeps it apart from the wide-screen "This month" button, which jsdom renders too, so the existing tests' `getByRole("button", { name: "This month" })` stays unique.

**Phone layout of the controls.** `RangeControls` lays the menu trigger and the dates button out as a wrapping flex row, each `max-sm:flex-1` with `whitespace-nowrap`. They share the row when both fit (Impact's "Nov 1 – 30, 2026") and wrap when they don't (True-Up's "Oct 1, 2026 – Sep 30, 2027"), with no width rule per page.

## Risks / Trade-offs

- [Both layouts are in the DOM] → A few extra elements per page. Tests have to name the phone controls apart (above).
- [jsdom doesn't apply Tailwind, so tests can't see which layout shows] → Tests check the `max-sm:hidden` and `sm:hidden` classes and the behavior of each control. The layout itself is checked in the browser at 320, 390 and 640 px.
- [The reduced-motion rule for popovers changes the Earlier menu and the dates picker on wide screens] → Under reduced motion they appear at once, which is the site's rule for motion anyway.

## Migration Plan

Ships with a release, like any change. Rolling back is releasing the previous tag.

## Results

- **Branch container (task 4.2), 2026-11-11:** onyx, reading production read-only, through an SSH tunnel. The phone widths were checked in Playwright's headless Chromium, because Chrome's window doesn't shrink to 390 px.
  - **The bar:** at 320 and 390 px on `/`, `/impact` and `/true-up`, the name and the 44 × 44 Pages button share a row, no page links show and nothing scrolls sideways. At 640 and 1280 px the links and preset buttons show as before, with no Pages button.
  - **The page menu:** opening it lists the six pages, each 44 px tall, with Impact `aria-current="page"`. 60 ms into opening, the top bar was part way through its turn and the menu at 0.74 opacity. Once open, the bars were at ±45° and the middle one at opacity 0 and scale 0. 60 ms after Escape, the menu was still mounted in its closed state at 0.42 opacity with the bar turning back; after 300 ms it was gone and the bars were back at ∓6 px. Choosing Patterns went to `/patterns` and closed the menu.
  - **The presets:**
    - Impact's menu sits beside the dates button and lists its six presets with Today checked; choosing This year went to `?start=2026-01-01&end=2026-12-31` and renamed the button.
    - True-Up's dates sit under its menu, which lists This year, '25 - '26 to '21 - '22 and All time.
    - At 320 px the Solar page's dates wrap under its menu too, as the spec allows.
    - Backup's year is a "Backup years: This year" menu.

    The first build centred the presets button's label; it now sits at the left with the arrow at the right, as in the mockup.
  - **Reduced motion:** with reduced motion emulated, the bars were at ±45° and the menu at full opacity the moment it opened, and the menu was gone 20 ms after Escape.
  - **CSP:** no console error and no CSP violation at any width; the container is the production build, under the production CSP.
  - **Safari:** WebKit opened the menu with the bars crossed and the six links, and choosing Solar went to `/`.
