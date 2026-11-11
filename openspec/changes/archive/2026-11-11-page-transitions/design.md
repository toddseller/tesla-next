# Design

## Context

See proposal.md for why and the delta spec for the behavior. What shapes the approach:

- **The top bar.** `TopBar` (`components/top-bar.tsx`) is rendered by the root layout, so it stays mounted across page changes. Each tab is a `Link`. The current one, from `usePathname`, gets `bg-secondary` and a red inset underline.
- **Next and React.** Next 16.4.5 bundles React `19.3.0-canary-278794d7-20261002`, which exports `ViewTransition`. Its `Link` takes `transitionTypes` and `onNavigate`, and `useLinkStatus` reports a link's pending navigation. React DOM wraps a transition that changes a `ViewTransition` in `document.startViewTransition`.
- **From `subtle-motion`:**
  - `app/motion.css`, with the `slide-next` and `slide-previous` view-transition classes (150 ms out, 250 ms in, 24 px) and the root's transition turned off.
  - The day view's `ViewTransition`, which answers only to the `day-*` types.
  - Task 1.1 of that change, which checks View Transitions in a production build under the CSP.

## Goals / Non-Goals

**Goals:**
- One View Transition per tab change that moves the highlight and the content together.

**Non-Goals:**
- Prefetching to shorten the wait. Pages are rendered per request (force-dynamic), and Next's default prefetch for dynamic pages already applies.
- Motion for range, day or in-page links.

## Decisions

### The direction in a small store, not in transition types

The tabs first passed Next's `transitionTypes`, and the page's `ViewTransition` mapped `page-next` and `page-previous` to the slide classes. On the branch container, every change to Patterns arrived with `types: null` (5 out of 5), while every other page kept its type (13 out of 13). Patterns is the only page with no client component. Its change made the one page request, and Next adds the type when the click starts, so the type is lost inside React or Next when that commit happens.

So the direction lives in `components/page-slide.tsx`:
- Each tab's `Link` calls `slidePage("next" | "previous")` from `onNavigate`, by its position in `pages` against the current path's. The current tab's link calls nothing.
- `PageSlide`, a client wrapper around the page content in `app/layout.tsx`, reads the direction with `useSyncExternalStore`. It renders `<ViewTransition default={slide-next | slide-previous | "none"}>`.
- The click updates the store before the navigation's transition starts, so the wrapper already carries the slide when the new page commits, with or without types.
- An effect clears the direction once the path changes, so range changes, day steps and links inside a page, which never set it, leave the page still.

The day view's own `ViewTransition` still answers only to `day-*` types, which work on the Solar page, so it holds still inside a page slide.

Alternative: keep the types and accept that changes to Patterns don't slide. The store is about twenty lines and covers every page the same way.

### The highlight is a shared element

The red underline and its background move into a `span` inside the current link, wrapped in `<ViewTransition name="nav-highlight">`. The old page's span and the new page's share the name, so the browser morphs the group's position and width from the old link to the new one. Its timing is set in `motion.css` (`::view-transition-group(nav-highlight)`, 250 ms, the site's ease-out).

The link's own classes keep the text color. Before hydration, the server's HTML already has the span inside the current link, so the right tab is marked with no script.

Alternative: one absolutely placed highlight under the tabs, moved by measuring the links. That needs layout reads, and it breaks when the nav wraps on a phone. The shared element morphs between wherever the two links are, rows included.

### The pending tab

A small `PendingName` child of each `Link` reads `useLinkStatus()` and brightens the text while `pending`. `aria-current` stays on the old link until the path changes, so assistive technology isn't told about a page that hasn't arrived.

### The top bar stays live

The top bar isn't inside a named `ViewTransition`, and the root's animation is `none` (from `subtle-motion`), so the new root shows at once. The browser's new view is live, so the live status keeps updating during the 250 ms. Only the content and the highlight are captured and animated.

## Risks / Trade-offs

- [A page that errors mid-navigation leaves the clicked tab bright] → `useLinkStatus` drops `pending` when the navigation settles either way. The error boundary then shows on the old page with its tab still current.
- [On a phone the nav wraps, so the highlight can glide diagonally between rows] → It's a morph of 250 ms between two places a viewer can see. The browser check at 375 pixels looks at it; if it reads badly, a follow-up fades it across rows instead.
- [Shared-element morphs scale the snapshot, so the underline's 2 px can stretch mid-glide when the links differ in width] → The links differ by at most about 40 px; the check at both widths looks for it.

## Results

- **Branch container (task 4.2), 2026-11-11:** onyx, reading production read-only, through an SSH tunnel in Chrome at 1280 pixels.
  - With transition types, the clicked tab brightened while the old tab kept the underline and `aria-current`, and the highlight glided, but every change to Patterns lost its type and didn't slide (see the decision above).
  - With the store, 9 changes in a row (Impact to Patterns, to Top Ten, to Patterns, to Solar, to Patterns, to Impact, to True-Up, to Distribution, to Solar) each slid the right way (`motion-in-right` and `motion-out-left` going right, the mirror going left) with the highlight's group animating. There was no CSP violation.
  - Picking "This year" on the Solar page started no view transition. A day step started one, typed `day-next`, which slid only the day's content.
  - Not checked: the 375-pixel width (the browser window wouldn't shrink below its screen's width), reduced motion in a browser (the stylesheet test covers it), the live status updating during a change (the top bar isn't in a named transition, and the root's new view is live), and Safari.
  - It was then gone through in a second browser through the same tunnel, and found right.

## Migration Plan

Release after `subtle-motion` (ask first). Rollback is the previous release.

## Rollout

Released as v2026.11.11.1 on 2026-11-11. Its Deploy run passed; onyx runs the tag and teslasolar.report answered 200.

- **The live site:** five tab changes in a row (Impact to Patterns, to Solar, to Patterns, to Impact, to True-Up) each slid the right way, `motion-in-right` and `motion-out-left` going right and the mirror going left, with the highlight's group animating, and no CSP violation.
