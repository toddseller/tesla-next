// @vitest-environment jsdom
// site-motion, "True-Up's figures count up when first seen".
import { act, cleanup, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CountUp, FirstView } from "./count-up";

beforeEach(() => vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const counting = (container: HTMLElement) => container.querySelector("[data-part=counting]")?.textContent;

test("counts up from zero to the figure in 400 ms, then shows it plainly", () => {
  const { container } = render(<CountUp text="$410" />);
  expect(counting(container)).toBe("$0");
  act(() => vi.advanceTimersByTime(500));
  expect(container.innerHTML).toBe("<span>$410</span>");
});

test("keeps the figure's separators, decimals and the text around it while counting", () => {
  const { container: kwh } = render(<CountUp text="1,840" />);
  const { container: share } = render(<CountUp text="12.5%" />);
  act(() => vi.advanceTimersByTime(150));
  expect(counting(kwh)).toMatch(/^(\d{1,3},)?\d{1,3}$/);
  expect(counting(share)).toMatch(/^\d+\.\d%$/);
});

test("one span keeps the width and gives a screen reader the final figure at once; only the counting copy is hidden from it", () => {
  const { container } = render(<CountUp text="$410" />);
  const kept = container.querySelector("[data-part=final]")!;
  expect(kept.textContent).toBe("$410");
  expect(kept.className).toContain("text-transparent");
  expect(kept.hasAttribute("aria-hidden")).toBe(false);
  expect(container.querySelector("[data-part=counting]")!.getAttribute("aria-hidden")).toBe("true");
  expect(container.querySelectorAll("*").length).toBe(3);
});

test("a new figure after the first count shows at once, without counting", () => {
  const { container, rerender } = render(<CountUp text="$410" />);
  act(() => vi.advanceTimersByTime(500));
  rerender(<CountUp text="$455" />);
  expect(container.innerHTML).toBe("<span>$455</span>");
});

test("text with no figure shows as it is", () => {
  const { container } = render(<CountUp text="—" />);
  expect(container.innerHTML).toBe("<span>—</span>");
});

test("under reduced motion the figure shows at once", () => {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
  const { container } = render(<CountUp text="$410" />);
  expect(container.innerHTML).toBe("<span>$410</span>");
});

test("a figure first shown after the page's first view, as on a new range, shows at once", () => {
  const { container } = render(<FirstView value={false}><CountUp text="$410" /></FirstView>);
  expect(container.innerHTML).toBe("<span>$410</span>");
});

// Until the page's JavaScript runs the count can't start, so the figure is blank rather than a zero that isn't true.
test("the server's HTML has a blank figure, not a zero", () => {
  const html = renderToString(<CountUp text="$410" />);
  const box = document.createElement("div");
  box.innerHTML = html;
  expect(box.querySelector("[data-part=counting]")!.className).toContain("text-transparent");
  expect(box.querySelector("[data-part=final]")!.className).toContain("text-transparent");
});

test("under reduced motion the page takes over the server's HTML without a mismatch, then shows the figure", () => {
  // A server knows nothing of the viewer's settings, so its HTML is the counting one.
  const box = document.createElement("div");
  box.innerHTML = renderToString(<CountUp text="$410" />);
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  document.body.append(box);
  act(() => { hydrateRoot(box, <CountUp text="$410" />, { onRecoverableError: (error) => console.error(error) }); });
  expect(errors).not.toHaveBeenCalled();
  expect(box.innerHTML).toBe("<span>$410</span>");
  errors.mockRestore();
  box.remove();
});
