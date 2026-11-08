// The scene's images: the house with no elements, and each element as its own
// layer on top of the lines. Every layer is exported on the same 2400 x 1166
// frame (sharp at the scene's largest size on a 2x screen), so they line up
// with each other and with the lines in layout.ts.
import { CAR_CABLES, type Point } from "@/components/scene/layout";
import type { Vehicle } from "@/lib/scene/live-scene";

// Served from public/scene, so the URL is the same under Next.js and the tests.
const houseClosed = "/scene/house-closed.webp";
const houseOpen = "/scene/house-open.webp";
const meter = "/scene/meter.webp";
const model3 = "/scene/model-3.webp";
const modelY = "/scene/model-y.webp";
const nightLights = "/scene/night-lights.webp";
const powerwall = "/scene/powerwall.webp";
const solarGlow = "/scene/solar-glow.webp";
const solarPanels = "/scene/solar-panels.webp";
const sunEast = "/scene/sun-east.webp";
const sunEastPanels = "/scene/sun-east-panels.webp";
const sunSouth = "/scene/sun-south.webp";
const sunWest = "/scene/sun-west.webp";
const wallConnector = "/scene/wall-connector.webp";
const windowFrame = "/scene/window.webp";

export const ELEMENTS = [
  { name: "solar-panels", src: solarPanels },
  { name: "window", src: windowFrame },
  { name: "meter", src: meter },
  { name: "powerwall", src: powerwall },
];

export const WALL_CONNECTOR = { name: "wall-connector", src: wallConnector };

// The lit window glass, shown at night over the elements (the window layer's
// own glass is opaque) and under the car.
export const NIGHT_LIGHTS = { name: "night-lights", src: nightLights };

export const SOLAR_GLOW = { name: "solar-glow", src: solarGlow };

// The faces of the house by the way they face, for the sun's light and shade:
// over the house (with the garage open or closed), and over the solar panels
// element, which covers part of the east faces.
export const SUNLIGHT: Record<"house" | "panels", { face: "south" | "east" | "west"; src: string }[]> = {
  house: [
    { face: "south", src: sunSouth },
    { face: "east", src: sunEast },
    { face: "west", src: sunWest },
  ],
  panels: [{ face: "east", src: sunEastPanels }],
};

// A plugged-in car's image and its cable and plug, by the vehicle's name:
// R2D2 is a Model Y, Tesla T.I.E. Fighter a Model 3.
export type CarImage = { src: string; path: Point[]; plug: Point[] };
const MODEL_3: CarImage = { src: model3, ...CAR_CABLES.model3 };
const CARS: Record<string, CarImage> = {
  R2D2: { src: modelY, ...CAR_CABLES.modelY },
  "Tesla T.I.E. Fighter": MODEL_3,
};

// The house, shared elements and car for a plugged-in vehicle. A car with its
// own image shows in the open garage with the Wall Connector; no car, or a car
// without one, shows the garage closed, where the Wall Connector would sit on
// the door. In replay a car without its own image shows as the Model 3, since
// its label still names it.
type Image = { name: string; src: string };
export type Layers = { house: string; elements: Image[]; solarGlow: Image; nightLights: Image; car: (Image & CarImage) | null; wallConnector?: Image };

export const sceneLayers = (vehicle: Pick<Vehicle, "name"> | null | undefined, cars: Record<string, CarImage> = CARS, replay = false): Layers => {
  const car = (vehicle && (cars[vehicle.name] || (replay ? MODEL_3 : null))) || null;
  if (!car) return { house: houseClosed, elements: ELEMENTS, solarGlow: SOLAR_GLOW, nightLights: NIGHT_LIGHTS, car: null };
  return { house: houseOpen, elements: ELEMENTS, solarGlow: SOLAR_GLOW, nightLights: NIGHT_LIGHTS, car: { name: "car", ...car }, wallConnector: WALL_CONNECTOR };
};
