// @vitest-environment jsdom
// The line a page shows after refusing a link's dates (solar-range-chart, "Default and invalid ranges").
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { UnshownNotice } from "./unshown-notice";

afterEach(cleanup);

test("it names the range shown instead, then drops the marker from the address, staying on screen", () => {
  window.history.replaceState(null, "", "/solar?readings=reported&unshown=1");
  render(<UnshownNotice range={{ start: "2026-11-01", end: "2026-11-30" }} />);
  expect(screen.getByRole("status").textContent).toBe("That link asked for dates the site doesn't have, so this shows November 2026.");
  expect(window.location.pathname + window.location.search).toBe("/solar?readings=reported");
});

test("an address left with nothing else loses its question mark too", () => {
  window.history.replaceState(null, "", "/true-up?unshown=1");
  render(<UnshownNotice range={{ start: "2026-10-01", end: "2027-09-30" }} />);
  expect(screen.getByRole("status").textContent).toContain("so this shows '26\u00a0-\u00a0'27.");
  expect(window.location.pathname + window.location.search).toBe("/true-up");
});

test("without a range, as in Solar's day view, it shows nothing and still drops the marker", () => {
  window.history.replaceState(null, "", "/solar?day=2026-10-14&unshown=1");
  const { container } = render(<UnshownNotice />);
  expect(container.innerHTML).toBe("");
  expect(window.location.pathname + window.location.search).toBe("/solar?day=2026-10-14");
});
