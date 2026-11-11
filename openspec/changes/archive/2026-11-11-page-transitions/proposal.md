# Proposal

## Why

Moving between the top bar's pages is a hard cut. The red-underlined highlight jumps to the new tab and the page content swaps at once. Each page also takes 0.2 to 0.4 s to arrive from the server, during which the click gives no sign that it was taken. On the prototype (https://claude.ai/artifact/JmyaCrFweA1QgW57o5VJA9), the chosen behavior shows the click at once and then, when the page arrives, moves the highlight and the page together.

## What Changes

- **On the click:** the clicked tab brightens at once, while the page loads.
- **When the page arrives:** the highlight glides from the old tab to the new one, and the page content slides 24 px the way the tabs go, in the same 250 ms pass. The old content leaves in 150 ms and the new comes in over 250 ms.
  - Going right along the tabs (Solar to Patterns), the content leaves left and the new page comes in from the right; going left is the mirror.
- **What stays still:** the top bar, with its live status, which keeps updating during the pass.
- **Reduce motion:** under the viewer's "reduce motion" setting, the page changes at once, as today.
- **Older browsers:** browsers without View Transitions also change at once.
- **Other navigation:** none of this applies to range changes, day steps or links inside a page.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `dashboard-shell`: navigation among the pages gains the pending tab and the joined highlight and page movement.

## Impact

- **Code:**
  - `components/top-bar.tsx`: the pending state, each tab recording which way it goes, and the named highlight.
  - `components/page-slide.tsx` (new): the direction of the last tab change, and the `ViewTransition` around the page content that slides that way.
  - `app/layout.tsx`: the page content in that wrapper.
  - `app/motion.css`: the page slide reuses the day slide's classes from `subtle-motion`.
  - Tests for each.
- **Depends on `subtle-motion`:** it needs that change's motion stylesheet, its root-transition setting and its check that View Transitions work in this Next. Ship it after `subtle-motion`.
- **No experimental setting:** the request named `experimental.viewTransition`, but Next 16.4.5 has no such setting. Its bundled React exports `ViewTransition`, so nothing in `next.config.ts` changes.
- **No data or server change.**
