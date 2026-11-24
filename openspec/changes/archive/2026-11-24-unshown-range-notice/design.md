# Design

## Context

Solar, Impact and True-Up all refuse an unshowable range through one function, `dropUnshown` in `lib/solar/ranges.ts`, which redirects (307) to the address without the bad parameters. The redirect keeps the address honest, but it is also the only place that knows a range was refused, and it hands nothing on to the page it redirects to. Each page's browser tab title already names its range with `rangeTitle`.

The year chapter (`components/home/year.tsx`) is a two-column grid on `md` and up: the heatmap, about 900 pixels tall at its 34rem cap, and a side column holding the description, the readout card and the shares. The top bar doesn't stick, so nothing covers the top of the screen.

## Goals / Non-Goals

**Goals:**
- Carry "a range was refused" across the redirect without a cookie, middleware or server state.
- One notice, built once, used by all three pages.

**Non-Goals:**
- Naming the refused range in the notice. A malformed value like `start=nope` can't be named usefully, and one sentence covers every case.
- Notices for other dropped parameters (`readings`, `backup`) or for a valid range in the future, which the pages already show as empty.
- Any change to the phone layout of the year chapter.

## Decisions

**A query marker, `unshown=1`, added by `dropUnshown`.** The redirect's target address is the only thing the next request sees, so the fact has to travel in it. The alternatives were dropping the redirect and leaving the bad address in place, which breaks the specs' rule that the address names what's shown, and a flash cookie, which a server component can't set while rendering, so it would need middleware. `dropUnshown` also leaves out any `unshown` already in the address before adding its own, so a refused address that already carries the marker doesn't end up with it twice.

**The marker leaves the address once the notice shows.** A small client component (`components/unshown-notice.tsx`) renders the line and, in an effect, removes `unshown` from `window.location.search` with `window.history.replaceState`, as Home's records and year chapters already do for their own parameters. Next 16 keeps its router in step with native `replaceState`. The notice reads its flag from the server-rendered prop rather than the address, so it stays on screen after the marker is gone. Moving to another range renders the page again without the prop, and the notice goes with it.

**Each server page reads `params.unshown === "1"`** and passes `unshown` to its client page. Each client page renders `<UnshownNotice range={...} />` as a full-width line between the title row and the lead, saying "That link asked for dates the site doesn't have, so this shows {rangeTitle(range)}." It uses `role="status"` and `text-sm text-muted-foreground`, like the year chapter's loading line. Solar's day view returns `DayPanel` before the range header, so it never renders the line, but it still has to remove the marker. The component therefore renders nothing there and only cleans the address.

**The year chapter's side column sticks: `md:sticky md:top-6 md:self-start`.** Sticking the readout card alone would make the shares block below it scroll under it, so the whole column sticks. The column is about 450 pixels tall, which fits any screen wide enough for `md`. `self-start` is needed because a grid item stretches to its row's height by default, and a full-height item has nowhere to stick.

## Risks / Trade-offs

- [A hand-typed `?unshown=1` on a valid address shows the notice once] → It's harmless and removes itself; refusing it would need the server to verify a claim that only matters for one render.
- [jsdom can't check that a sticky column stays in view] → The unit test checks the classes. The spec's laptop scenario is checked in a browser at 1280 and 1440 during the visual pass.
- [A short laptop window (under about 500 pixels tall) can't fit the whole sticky column] → The column then scrolls with the page as it does today, which is no worse than now.
