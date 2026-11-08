// @vitest-environment jsdom
// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/components/scene/CloudCanvas.test.jsx.
import { describe, test, expect, vi, beforeEach, type Mock, afterEach } from "vitest";
import {createRef} from "react";
import {act, cleanup, render} from "@testing-library/react";

import CloudCanvas, {type CloudHandle} from "@/components/scene/cloud-canvas";
import type {cloudInputs} from "@/components/scene/cloud-inputs";
import {type CloudRenderer, createCloudRenderer} from "@/components/scene/cloud-renderer";

// Each test's render is removed after it, as anton's Vitest did with its globals.
afterEach(cleanup);

vi.mock("@/components/scene/cloud-renderer", () => ({ createCloudRenderer: vi.fn() }));

// Only what the canvas reads; it hands the rest to the renderer untouched.
const inputs = (low: number) => ({ weights: [{ name: "fairPuffs", weight: 1 }], shares: { low }, light: { sky: 0.44 } }) as unknown as ReturnType<typeof cloudInputs>;
// The canvas passes the offsets through, so any value stands in for them.
const OFFSET = 0.25 as unknown as number[];
const OTHER_OFFSET = 0.1 as unknown as number[];

describe("cloud canvas", () => {
  let renderer: { bake: Mock; draw: Mock; dispose: Mock };
  beforeEach(() => {
    renderer = { bake: vi.fn(), draw: vi.fn(), dispose: vi.fn() };
    vi.mocked(createCloudRenderer).mockReset().mockReturnValue(renderer as unknown as CloudRenderer);
  });

  test("a canvas in the clouds' place, hidden from assistive technology", () => {
    const { container } = render(<CloudCanvas inputs={inputs(0.3)} seed={20000} />);
    const canvas = container.querySelector('canvas[data-part="clouds"]')!;
    expect(canvas).not.toBeNull();
    expect(canvas.getAttribute("aria-hidden")).toBe("true");
  });

  test("bakes the day's shapes once on mount, again for a new day, not for a new reading", () => {
    const { rerender } = render(<CloudCanvas inputs={inputs(0.3)} seed={20000} />);
    expect(renderer.bake).toHaveBeenCalledTimes(1);
    expect(renderer.bake).toHaveBeenLastCalledWith(20000, 0.44);

    rerender(<CloudCanvas inputs={inputs(0.6)} seed={20000} />);
    expect(renderer.bake).toHaveBeenCalledTimes(1);

    rerender(<CloudCanvas inputs={inputs(0.6)} seed={20001} />);
    expect(renderer.bake).toHaveBeenCalledTimes(2);
    expect(renderer.bake).toHaveBeenLastCalledWith(20001, 0.44);
  });

  test("draws the latest inputs at the offset it is given", () => {
    const ref = createRef<CloudHandle>();
    const { rerender } = render(<CloudCanvas ref={ref} inputs={inputs(0.3)} seed={20000} />);
    rerender(<CloudCanvas ref={ref} inputs={inputs(0.6)} seed={20000} />);

    ref.current!.draw(OFFSET);
    expect(renderer.draw).toHaveBeenCalledWith(inputs(0.6), 0.25);
  });

  test("without WebGL2 it renders without error and draws nothing", () => {
    vi.mocked(createCloudRenderer).mockReturnValue(null);
    const ref = createRef<CloudHandle>();
    render(<CloudCanvas ref={ref} inputs={inputs(0.3)} seed={20000} />);

    expect(() => ref.current!.draw(OTHER_OFFSET)).not.toThrow();
  });

  test("resizes the canvas on every change, but bakes again only for a new shape", () => {
    let resized = () => {};
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class { constructor(callback: () => void) { resized = callback; } observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
    try {
      const { container } = render(<CloudCanvas inputs={inputs(0.3)} seed={20000} />);
      const canvas = container.querySelector("canvas")!;
      const resize = (width: number, height: number) => {
        Object.defineProperty(canvas, "clientWidth", { value: width, configurable: true });
        Object.defineProperty(canvas, "clientHeight", { value: height, configurable: true });
        act(() => resized());
      };
      resize(1000, 700);
      const bakes = renderer.bake.mock.calls.length;

      resize(1010, 700);
      expect(canvas.width).toBe(Math.round(1010 * (window.devicePixelRatio || 1) * 0.5));
      expect(renderer.bake).toHaveBeenCalledTimes(bakes);

      resize(1100, 700);
      expect(renderer.bake).toHaveBeenCalledTimes(bakes + 1);
    } finally {
      globalThis.ResizeObserver = original;
    }
  });

  test("lets go of the renderer when removed", () => {
    const { unmount } = render(<CloudCanvas inputs={inputs(0.3)} seed={20000} />);
    unmount();
    expect(renderer.dispose).toHaveBeenCalled();
  });
});
