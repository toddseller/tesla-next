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

// The bulb is 15 stage units tall; the stage is the scene's width less its side padding, 322 px on a 390 px phone.
const BULB_UNITS = 15;
const tall = (stagePx: number) => {
  const scale = stagePx <= 480 ? 2 : stagePx <= 640 ? 1.5 : 1;
  return (BULB_UNITS * stagePx * scale) / STAGE.width;
};

// The shape is drawn with its socket at (0, 0), so scaling the shape grows each bulb down from its socket and leaves its
// place alone; scaling the placed bulbs instead moved them, as bulbs in <defs> have no box to scale around.
test("on a narrow stage the bulb shape grows from its socket, so each is at least 6 px tall", () => {
  expect(css).not.toMatch(/\.scene-bulb\s*{[^}]*transform/);
  expect(css).toMatch(/@container \(max-width: 640px\)\s*{\s*\.scene-bulb-shape\s*{\s*transform:\s*scale\(1\.5\)/);
  expect(css).toMatch(/@container \(max-width: 480px\)\s*{\s*\.scene-bulb-shape\s*{\s*transform:\s*scale\(2\)/);
  for (const width of [322, 480, 481, 640, 641, 1184]) expect(tall(width), `${width}px`).toBeGreaterThanOrEqual(6);
});
