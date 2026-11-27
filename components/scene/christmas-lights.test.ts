// live-flow-scene, "Christmas lights twinkle" and "Christmas lights on a phone": the stylesheet's part.
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

import { STAGE } from "./layout";

const css = readFileSync(new URL("./scene.css", import.meta.url), "utf8");
const rule = (selector: string) => css.match(new RegExp(`${selector.replace(/[.()]/g, "\\$&")}\\s*{([^}]*)}`))?.[1] ?? "";

test("three twinkle groups on one 2.6 s cycle, each a third of it apart, dimming the bulbs to 30%", () => {
  expect(css).toMatch(/@keyframes scene-twinkle\s*{\s*0%,\s*100%\s*{\s*opacity:\s*1;?\s*}\s*50%\s*{\s*opacity:\s*0?\.3;?\s*}\s*}/);
  const delays = [0, 1, 2].map((group) => rule(`.scene-bulb-${group}`).match(/scene-twinkle 2\.6s ease-in-out (-?[\d.]+)s infinite/)?.[1]);
  expect(delays.map(Number)).toEqual([0, -0.87, -1.73]);
});

test("the twinkle stops for reduced motion and holds while a replay is paused", () => {
  expect(rule(".scene-still .scene-bulb")).toMatch(/animation:\s*none/);
  expect(rule(".scene-paused .scene-bulb")).toMatch(/animation-play-state:\s*paused/);
});

// The bulb is 15 stage units tall; the stage is the scene's width less its side padding: 322 px on a 390 px phone, 1184
// px in a 1440 px window. The shape is drawn with its socket at (0, 0), so scaling the shape keeps each bulb in its place.
const BULB_UNITS = 15;
const tall = (stagePx: number) => (BULB_UNITS * stagePx * (stagePx <= 480 ? 1 : 0.75)) / STAGE.width;

test("the bulb shape is 0.75 of its size, and unscaled on a phone-sized stage", () => {
  expect(css).not.toMatch(/\.scene-bulb\s*{[^}]*transform/);
  expect(rule(".scene-bulb-shape")).toMatch(/transform:\s*scale\(0\.75\)/);
  expect(css).toMatch(/@container \(max-width: 480px\)\s*{\s*\.scene-bulb-shape\s*{\s*transform:\s*none/);
  expect(css).not.toMatch(/max-width: 640px|scale\(1\.5\)|scale\(2\)/);
  expect(tall(1184)).toBeCloseTo(8.3, 1);
  expect(tall(322)).toBeCloseTo(3, 1);
});
