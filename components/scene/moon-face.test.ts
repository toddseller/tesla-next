// @vitest-environment jsdom
// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/components/scene/moonFace.test.js.
import { test, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { BRIGHTNESS, projectMoon, useMoonFace } from "@/components/scene/moon-face";

// A black 1-degree map, lit around each given longitude and latitude.
const mapWith = (...spots: [number, number][]) => {
  const [width, height] = [360, 180];
  const data = new Uint8ClampedArray(width * height * 4).fill(0);
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  spots.forEach(([lon, lat]) => {
    const [u, v] = [Math.floor(lon + 180), Math.floor(90 - lat)];
    for (let dv = -1; dv <= 1; dv += 1) for (let du = -1; du <= 1; du += 1) {
      const at = ((v + dv) * width + ((u + du + width) % width)) * 4;
      data.fill(100, at, at + 3);
    }
  });
  return { data, width, height };
};

const SIZE = 64;
// The face's pixel at x, y from -1 to 1 across the disc, y up.
const pixel = (face: Uint8ClampedArray, x: number, y: number) => {
  const [i, j] = [Math.min(SIZE - 1, Math.floor(((x + 1) / 2) * SIZE)), Math.min(SIZE - 1, Math.floor(((1 - y) / 2) * SIZE))];
  return Array.from(face.slice((j * SIZE + i) * 4, (j * SIZE + i) * 4 + 4));
};
const lit = (face: Uint8ClampedArray, x: number, y: number) => pixel(face, x, y)[0] > 0;

test("facing straight on, the disc's center is the map's longitude 0, latitude 0", () => {
  expect(lit(projectMoon(mapWith([0, 0]), 0, 0, SIZE), 0, 0)).toBe(true);
  expect(lit(projectMoon(mapWith([20, 0]), 0, 0, SIZE), 0, 0)).toBe(false);
});

test("turned by libration, the center is the point facing Earth", () => {
  expect(lit(projectMoon(mapWith([5, 0]), 5, 0, SIZE), 0, 0)).toBe(true);
  expect(lit(projectMoon(mapWith([0, 0]), 5, 0, SIZE), 0, 0)).toBe(false);
  expect(lit(projectMoon(mapWith([0, 5]), 0, 5, SIZE), 0, 0)).toBe(true);
});

test("north at the top, east (positive longitude) on the right", () => {
  const face = projectMoon(mapWith([0, 60], [60, 0]), 0, 0, SIZE);

  expect(lit(face, 0, Math.sin(Math.PI / 3))).toBe(true);
  expect(lit(face, Math.sin(Math.PI / 3), 0)).toBe(true);
  expect(lit(face, 0, -Math.sin(Math.PI / 3))).toBe(false);
  expect(lit(face, -Math.sin(Math.PI / 3), 0)).toBe(false);
});

test("tipped north toward us, more of the north shows", () => {
  // A ring at latitude 86: near the pole a pixel's longitude swings widely.
  const polar = mapWith(...Array.from({ length: 120 }, (_, k): [number, number] => [k * 3 - 180, 86]));

  expect(lit(projectMoon(polar, 0, 0, SIZE), 0, 0.995)).toBe(false);
  expect(lit(projectMoon(polar, 0, 6, SIZE), 0, 0.995)).toBe(true);
});

test("transparent outside the disc, opaque within it", () => {
  const face = projectMoon(mapWith(), 0, 0, SIZE);

  expect(pixel(face, -0.99, 0.99)[3]).toBe(0);
  expect(pixel(face, 0, 0)[3]).toBe(255);
});

test("brightened by a constant", () => {
  expect(pixel(projectMoon(mapWith([0, 0]), 0, 0, SIZE), 0, 0).slice(0, 3)).toEqual(Array(3).fill(Math.min(255, Math.round(100 * BRIGHTNESS))));
});

test("a map that fails to load is tried again at the next redraw, without an unhandled error", async () => {
  const loads: string[] = [];
  vi.stubGlobal("Image", class {
    onerror: (event: Event) => void = () => {};
    set src(url: string) {
      loads.push(url);
      queueMicrotask(() => this.onerror(new Event("error")));
    }
  });
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  try {
    const { result, rerender } = renderHook(({ longitude }) => useMoonFace(longitude, 0), { initialProps: { longitude: 0 } });
    await settle();
    rerender({ longitude: 1 });
    await settle();

    expect(loads).toHaveLength(2);
    expect(result.current).toBeNull();
  } finally {
    vi.unstubAllGlobals();
  }
});
