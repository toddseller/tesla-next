// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/components/scene/images.test.js.
import { test, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type CarImage, ELEMENTS, NIGHT_LIGHTS, SOLAR_GLOW, SUNLIGHT, WALL_CONNECTOR, sceneLayers } from "@/components/scene/images";
import { CAR_CABLES } from "@/components/scene/layout";

const ASSETS = join(import.meta.dirname, "../../public/scene");
const cars: Record<string, CarImage> = { R2D2: { src: "r2d2.webp", path: [[0, 0], [1, 1]], plug: [[1, 1], [2, 2]] } };

test("no car shows the garage closed, with the shared elements and no Wall Connector", () => {
  const layers = sceneLayers(null, cars);

  expect(layers.house).toContain("house-closed");
  expect(layers.elements).toBe(ELEMENTS);
  expect(layers.solarGlow).toBe(SOLAR_GLOW);
  expect(layers.nightLights).toBe(NIGHT_LIGHTS);
  expect(layers.car).toBeNull();
  expect(layers.wallConnector).toBeUndefined();
});

test("a car without its own image shows the garage closed", () => {
  const layers = sceneLayers({ name: "Tesla Model Z" }, cars);

  expect(layers.house).toContain("house-closed");
  expect(layers.car).toBeNull();
  expect(layers.wallConnector).toBeUndefined();
});

test("a car with its own image shows in the open garage with the Wall Connector, its cable and plug", () => {
  const layers = sceneLayers({ name: "R2D2" }, cars);

  expect(layers.house).toContain("house-open");
  expect(layers.elements).toBe(ELEMENTS);
  expect(layers.wallConnector).toBe(WALL_CONNECTOR);
  expect(layers.solarGlow).toBe(SOLAR_GLOW);
  expect(layers.nightLights).toBe(NIGHT_LIGHTS);
  expect(layers.car).toEqual({ name: "car", ...cars.R2D2 });
});

test("R2D2 and Tesla T.I.E. Fighter have their own images, cables and plugs", () => {
  const [y, three] = [sceneLayers({ name: "R2D2" }).car!, sceneLayers({ name: "Tesla T.I.E. Fighter" }).car!];

  expect(y.src).toContain("model-y");
  expect(three.src).toContain("model-3");
  expect(y.path).toBe(CAR_CABLES.modelY.path);
  expect(three.plug).toBe(CAR_CABLES.model3.plug);
});

test("sunlight covers the south, east and west faces, and the east faces under the panels", () => {
  expect(SUNLIGHT.house.map((l) => [l.face, l.src])).toEqual([
    ["south", expect.stringContaining("sun-south")],
    ["east", expect.stringContaining("sun-east")],
    ["west", expect.stringContaining("sun-west")],
  ]);
  expect(SUNLIGHT.panels.map((l) => [l.face, l.src])).toEqual([["east", expect.stringContaining("sun-east-panels")]]);
});

// A lossy WebP with alpha starts with a VP8X chunk, which holds the canvas
// size less one, as 24 bit little-endian numbers at bytes 24 and 27.
const webpSize = (file: string) => {
  const bytes = readFileSync(join(ASSETS, file));
  const u24 = (at: number) => bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
  expect(bytes.toString("ascii", 12, 16)).toBe("VP8X");
  return [u24(24) + 1, u24(27) + 1];
};

test("every scene image is on the same 2400 x 1166 frame", () => {
  // The moon's map (NASA's, drawn onto its disc) isn't a layer of the scene.
  const files = readdirSync(ASSETS).filter((file) => file.endsWith(".webp") && !file.startsWith("moon"));

  expect(files).toHaveLength(15);
  files.forEach((file) => expect([file, ...webpSize(file)]).toEqual([file, 2400, 1166]));
});
