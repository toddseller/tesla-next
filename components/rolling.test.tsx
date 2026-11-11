// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Rolling } from "./rolling";

beforeEach(() => vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const format = (n: number) => n.toFixed(1);

test("at rest, one plain figure", () => {
  const { container } = render(<Rolling value={25.7} format={format} />);
  expect(container.innerHTML).toBe("<span>25.7</span>");
});

test("while it rolls, the moving figure is hidden from screen readers, which get the new one at once", () => {
  const { container, rerender } = render(<Rolling value={25.7} format={format} />);
  rerender(<Rolling value={36.4} format={format} />);
  expect(container.querySelector("[aria-hidden=true]")!.textContent).toBe("25.7");
  expect(container.querySelector(".sr-only")!.textContent).toBe("36.4");
  act(() => vi.advanceTimersByTime(200));
  const midway = Number(container.querySelector("[aria-hidden=true]")!.textContent);
  expect(midway).toBeGreaterThan(25.7);
  expect(midway).toBeLessThan(36.4);
  act(() => vi.advanceTimersByTime(250));
  expect(container.innerHTML).toBe("<span>36.4</span>");
});
