// @vitest-environment jsdom
// The tappable term (term-hints spec, "A tappable term"): part of its sentence, a button that opens its definition.
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { TERMS } from "@/lib/terms";
import { Term, WithTerm } from "./term";

afterEach(cleanup);

test("a button named by the term as written opens its definition, and Escape closes it, focus back on the term", async () => {
  render(<p>Tesla <Term name="vpp">VPP</Term> credit</p>);
  const term = screen.getByRole("button", { name: "VPP" });
  expect(term.getAttribute("type")).toBe("button");
  expect(term.closest("a")).toBeNull();
  // As a keyboard user does: focused, then activated (Enter on a button is a click).
  term.focus();
  fireEvent.click(term);
  expect(screen.getByRole("dialog").textContent).toBe(TERMS.vpp.definition);
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  // Radix hands focus back a tick after the popover closes.
  await waitFor(() => expect(document.activeElement).toBe(term));
});

test("a term inside a line of text hints its first match and leaves the words as they were", () => {
  const { container } = render(<p><WithTerm text="NEM charges for 2 cycles, before taxes." terms={["nem", "nsc"]} /></p>);
  expect(container.textContent).toBe("NEM charges for 2 cycles, before taxes.");
  expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["NEM"]);
});

test("a line without the term reads as it is, with no hint", () => {
  const { container } = render(<p><WithTerm text="No PG&E bill in yet." terms={["nem"]} /></p>);
  expect(container.textContent).toBe("No PG&E bill in yet.");
  expect(screen.queryByRole("button")).toBeNull();
});

test("a line can hint more than one term, each at its first match, in the order they appear", () => {
  const { container } = render(<p><WithTerm text="Under NEM2, storing it pays; Net Surplus Compensation is small." terms={["nsc", "nem2"]} /></p>);
  expect(container.textContent).toBe("Under NEM2, storing it pays; Net Surplus Compensation is small.");
  expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["NEM2", "Net Surplus Compensation"]);
});
