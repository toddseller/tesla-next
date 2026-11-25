// @vitest-environment jsdom
// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/components/scene/moonFace.test.js.
import { describe, test, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { BRIGHTNESS, DEATH_STAR_LIGHTS, DEATH_STAR_MAP, MOON_MAP, projectMoon, sphereShade, useMoonFace } from "@/components/scene/moon-face";

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
    const { result, rerender } = renderHook(({ longitude }) => useMoonFace(longitude, 0, MOON_MAP), { initialProps: { longitude: 0 } });
    await settle();
    rerender({ longitude: 1 });
    await settle();

    expect(loads).toHaveLength(2);
    expect(result.current).toBeNull();
  } finally {
    vi.unstubAllGlobals();
  }
});

test("each map is read once, whichever face is asked for, and none for no map", async () => {
  const loads: string[] = [];
  // Never settles, as a slow network would leave it.
  vi.stubGlobal("Image", class {
    set src(url: string) {
      loads.push(url);
    }
  });
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  try {
    const { rerender } = renderHook(({ map }) => useMoonFace(0, 0, map), { initialProps: { map: null as string | null } });
    await settle();
    expect(loads).toEqual([]);
    for (const map of [MOON_MAP, DEATH_STAR_MAP, DEATH_STAR_LIGHTS, MOON_MAP, DEATH_STAR_MAP]) {
      rerender({ map });
      await settle();
    }

    expect(loads).toEqual([MOON_MAP, DEATH_STAR_MAP, DEATH_STAR_LIGHTS]);
  } finally {
    vi.unstubAllGlobals();
  }
});

describe("the Death Star's sphere shading, lit from the right", () => {
  // Its darkening at x, y across the disc, from 0 (clear) to 1 (black).
  const shadeAt = (phase: number, x: number, y: number) => pixel(sphereShade(phase, SIZE), x, y)[3] / 255;

  test("clear where the sun is overhead, darkest at and past the terminator", () => {
    expect(shadeAt(0.5, 0, 0)).toBe(0);
    expect(shadeAt(0.25, 0.95, 0)).toBe(0);
    expect(shadeAt(0.25, 0, 0.5)).toBeCloseTo(0.8, 1); // the pixel's center is half a pixel sunward of the terminator
    expect(shadeAt(0.25, -0.5, 0)).toBeCloseTo(0.8, 2);
  });

  test("full, its center is clearer than its edge", () => {
    expect(shadeAt(0.5, 0, 0)).toBeLessThan(shadeAt(0.5, 0.95, 0));
    expect(shadeAt(0.5, 0.5, 0)).toBeLessThan(shadeAt(0.5, 0.95, 0));
  });

  test("a thin crescent is shaded only lightly, the shading growing to full strength by half", () => {
    // 10% lit: a fifth of the strength. Mid-crescent, matte light alone would leave it 41% dark.
    expect(shadeAt(0.1, 0.9, 0)).toBeLessThan(0.15);
    expect(shadeAt(0.1, -0.5, 0)).toBeCloseTo(0.8 * 0.19, 1);
    expect(shadeAt(0.2, -0.5, 0)).toBeCloseTo(0.8 * 0.69, 1);
  });

  test("gibbous and half phases shade as before", () => {
    // At 0.38 the sun is 43 degrees from the viewer: the point under it, (sin 43, 0), is clear.
    expect(shadeAt(0.38, Math.sin((0.24 * Math.PI)), 0)).toBe(0);
    expect(shadeAt(0.38, -0.9, 0)).toBeCloseTo(0.8, 1);
  });

  test("waxing and waning alike, since the mask turns it to the sun's side", () => {
    expect(sphereShade(0.75, SIZE)).toEqual(sphereShade(0.25, SIZE));
    expect(sphereShade(0.6, SIZE)).toEqual(sphereShade(0.4, SIZE));
  });
});
