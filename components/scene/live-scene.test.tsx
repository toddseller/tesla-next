// @vitest-environment jsdom
// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/components/scene/LiveScene.test.jsx.
import { describe, it, test, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import {act, cleanup, render} from "@testing-library/react";

import LiveScene, {drawStars, driftVelocity, easeDrift, flowOffset, moonLitPath, moveFlows, PAUSED_AT, skyY, TIMING, vaneAxis, vaneShake} from "@/components/scene/live-scene";
import {CAR_CABLES, CHARGE_BAR, type LegName, EAVES, FLOW_COLORS, GLOW, HEADROOM, HORIZON, labelBox, LABELS, LANE_DROP, legPoints, LEGS, PANEL, PHONE_TEXT, RENDER, STAGE, VANE} from "@/components/scene/layout";
import {type LiveInput, type SceneOptions, sceneState, type Vehicle} from "@/lib/scene/live-scene";
import {twinkle} from "@/lib/scene/night-sky";
import {sunTimes} from "@/lib/scene/sun";

// Each test's render is removed after it, as anton's Vitest did with its globals.
afterEach(cleanup);

// jsdom has no WebGL; the clouds' renderer is a stand-in that records what it is asked to draw.
const cloudRenderer = vi.hoisted(() => ({ bake: vi.fn(), draw: vi.fn(), dispose: vi.fn() }));
vi.mock("@/components/scene/cloud-renderer", () => ({ createCloudRenderer: () => cloudRenderer }));
// jsdom has no 2D canvas to draw the moon's face on; it stands in as a fixed URL, or null before the map loads.
const moonFace = vi.hoisted(() => ({ url: "data:image/png;base64,FACE" as string | null }));
vi.mock("@/components/scene/moon-face", async (importOriginal) => ({ ...(await importOriginal()), useMoonFace: () => moonFace.url }));

const NOW = new Date("2026-10-17T22:10:00Z");
const { sunset: SUNSET } = sunTimes(new Date("2026-10-19T19:00:00Z"));
const r2d2Live: Vehicle = { name: "R2D2", color: "#C0C4C8", charging_power: 3, battery_level: 80, battery_level_at: "2026-10-17T22:01:59Z" };
const r2d2: Vehicle = { name: "R2D2", color: "#C0C4C8", charging_power: 0, battery_level: 80, battery_level_at: "2026-10-17T22:01:59Z" };
const midday: LiveInput = { liveReceived: true, solarPower: 6.1, homePower: 4.1, batteryPower: 0, battery: 100, gridPower: 2.0, vehicle: null };

const renderScene = (values: LiveInput) => render(<LiveScene state={sceneState(values, NOW)} />).container;
// Asserted present for typing only: a missing part is still null for the tests that check it.
const part = (container: Element, name: string) => container.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
const flows = (container: Element) => [...container.querySelectorAll<HTMLElement>("[data-link]")].map((g) => `${g.dataset.link}:${g.dataset.lane}`);

describe("scene", () => {
  test("the render, every line and every label are shown", () => {
    const scene = renderScene(midday);

    ["house", "lines", "leg-solar", "leg-home", "leg-powerwall", "leg-grid", "label-solar", "label-home", "label-powerwall", "label-grid"].forEach(
      (name) => expect(part(scene, name)).not.toBeNull()
    );
    expect(part(scene, "house").getAttribute("src")).toBeTruthy();
  });

  test("labels show the live values", () => {
    const scene = renderScene(midday);

    expect(part(scene, "label-solar").textContent).toBe("SOLAR6.1 kW");
    expect(part(scene, "label-home").textContent).toBe("HOME4.1 kW");
    expect(part(scene, "label-powerwall").textContent).toBe("POWERWALL0 kW · 100%");
    expect(part(scene, "label-grid").textContent).toBe("GRID2.0 kW");
  });

  test("the backdrop is a padded frame around a stage that keeps the stage's proportions", () => {
    const scene = renderScene(midday);
    const stage = part(scene, "stage");

    expect(stage.parentElement).toBe(part(scene, "scene"));
    expect(stage.style.aspectRatio).toBe(`${STAGE.width} / ${STAGE.height}`);
    expect(part(scene, "scene").style.aspectRatio).toBeFalsy();
    expect(stage.contains(part(scene, "house"))).toBe(true);
    expect(stage.contains(part(scene, "label-solar"))).toBe(true);
  });

  test("day and night follow the sun at the site, partway through twilight, with no switch", () => {
    const at = (date: Date) => part(render(<LiveScene state={sceneState(midday, date)} />).container, "scene");
    const day = (date: Date) => Number(at(date).style.getPropertyValue("--day"));

    expect(day(new Date("2026-10-17T22:10:00Z"))).toBe(1);
    expect(day(new Date("2026-10-18T05:00:00Z"))).toBe(0);
    expect(day(SUNSET)).toBeCloseTo(sceneState(midday, SUNSET).dusk, 5);
    expect(day(SUNSET)).toBeGreaterThan(0);
    expect(day(SUNSET)).toBeLessThan(1);
    expect(at(SUNSET).hasAttribute("data-sky")).toBe(false);
  });
});

describe("layers", () => {
  const order = (scene: Element) => [...part(scene, "stage").children].map((el) => (el as HTMLElement).dataset.part);

  test("with no car: the moon, the sun glow and the ground, the closed garage, the lines, then the elements, the solar glow and the night lights over them", () => {
    const scene = renderScene(midday);

    expect(order(scene).slice(0, 20)).toEqual(["moon", "sun-glow", "ground", "house", "shade-south", "sun-south", "shade-east", "sun-east", "shade-west", "sun-west", "lines", "solar-panels", "window", "meter", "powerwall", "shade-east-panels", "sun-east-panels", "solar-glow", "powerwall-charge", "night-lights"]);
    expect(part(scene, "house").getAttribute("src")).toContain("house-closed");
    ["car", "plug", "wall-connector"].forEach((name) => expect(part(scene, name)).toBeNull());
  });

  test("with a car: the open garage, then the car, its plug and the Wall Connector over the elements", () => {
    const scene = renderScene({ ...midday, vehicle: r2d2 });

    expect(order(scene).slice(0, 23)).toEqual(["moon", "sun-glow", "ground", "house", "shade-south", "sun-south", "shade-east", "sun-east", "shade-west", "sun-west", "lines", "solar-panels", "window", "meter", "powerwall", "shade-east-panels", "sun-east-panels", "solar-glow", "powerwall-charge", "night-lights", "car", "plug", "wall-connector"]);
    expect(part(scene, "house").getAttribute("src")).toContain("house-open");
    expect(part(scene, "car").getAttribute("src")).toContain("model-y");
  });

  test("a car without its own image keeps the garage closed", () => {
    const scene = renderScene({ ...midday, vehicle: { ...r2d2, name: "Tesla Model Z" } });

    expect(part(scene, "house").getAttribute("src")).toContain("house-closed");
    expect(part(scene, "car")).toBeNull();
  });

  test("every image but the night lights, and the plug, are dimmed with the house at night", () => {
    const scene = renderScene({ ...midday, solarPower: 0, vehicle: r2d2 });
    const images = [...scene.querySelectorAll<HTMLElement>("img")].filter((img) => img.dataset.part !== "night-lights" && !/^(sun|shade)-/.test(img.dataset.part!));

    expect(images).toHaveLength(8);
    images.forEach((img) => expect(img.classList.contains("scene-render")).toBe(true));
    expect(part(scene, "plug").classList.contains("scene-plug")).toBe(true);
  });

  test("the night lights are their own layer, never dimmed, off by day, on at night, switched at sunset rather than faded, from the first frame", () => {
    const lights = (date: Date) => part(render(<LiveScene state={sceneState(midday, date)} />).container, "night-lights");
    const [day, night] = [lights(new Date("2026-10-17T22:10:00Z")), lights(new Date("2026-10-18T05:00:00Z"))];
    const minutes = (n: number) => new Date(SUNSET.getTime() + n * 60_000);

    expect(night.getAttribute("src")).toContain("night-lights");
    expect(night.className).toBe("scene-lights");
    expect(Number(day.style.opacity)).toBe(0);
    expect(Number(night.style.opacity)).toBe(0.75);
    expect(Number(lights(minutes(-15)).style.opacity)).toBe(0);
    expect(Number(lights(SUNSET).style.opacity)).toBe(0.75);
    expect(Number(lights(minutes(15)).style.opacity)).toBe(0.75);
  });

  test("the sun lights and shades each face direction by the state's sunlight, from the first frame", () => {
    const scene = (iso: string) => render(<LiveScene state={sceneState(midday, new Date(iso))} />).container;
    const opacity = (container: Element, name: string) => Number(part(container, name).style.opacity);
    const morning = scene("2026-06-21T16:00:00Z"); // 9 AM, sun in the east
    const light = sceneState(midday, new Date("2026-06-21T16:00:00Z")).sunlight!;

    expect(part(morning, "sun-east").classList.contains("scene-sun")).toBe(true);
    expect(part(morning, "shade-east").classList.contains("scene-shade")).toBe(true);
    expect(part(morning, "sun-east").getAttribute("src")).toContain("sun-east");
    expect(opacity(morning, "sun-east")).toBeCloseTo(1);
    expect(opacity(morning, "shade-east")).toBeCloseTo(0);
    expect(opacity(morning, "sun-west")).toBe(0);
    expect(opacity(morning, "shade-west")).toBeCloseTo(0.3);
    expect(opacity(morning, "sun-south")).toBeCloseTo(light.south);
    expect(opacity(morning, "sun-east-panels")).toBeCloseTo(1);

    const early = scene("2026-06-21T14:00:00Z"); // 7 AM, sun 12 degrees up
    const dawn = sceneState(midday, new Date("2026-06-21T14:00:00Z")).sunlight!;
    expect(dawn.strength).toBeLessThan(0.5);
    expect(opacity(early, "sun-east")).toBeCloseTo(dawn.east * dawn.strength * dawn.peak);
    expect(opacity(early, "shade-west")).toBeCloseTo(0.3 * (1 - dawn.west) * dawn.strength);

    const winter = scene("2025-12-21T20:00:00Z"); // noon, the season's peak about half
    const low = sceneState(midday, new Date("2025-12-21T20:00:00Z")).sunlight!;
    expect(low.peak).toBeLessThan(0.6);
    (["south", "east", "west"] as const).forEach((face) => {
      expect(opacity(winter, `sun-${face}`)).toBeCloseTo(low[face] * low.strength * low.peak);
      expect(opacity(winter, `shade-${face}`)).toBeCloseTo(0.3 * (1 - low[face]) * low.strength);
    });

    const night = scene("2026-06-22T05:00:00Z");
    ["south", "east", "west", "east-panels"].forEach((face) => {
      expect(opacity(night, `sun-${face}`)).toBe(0);
      expect(opacity(night, `shade-${face}`)).toBe(0);
    });
  });

  test("the solar glow is blended over the panels, its opacity from the state, from the first frame", () => {
    const glow = (solarPower: number) => part(renderScene({ ...midday, solarPower }), "solar-glow");

    expect(glow(5).getAttribute("src")).toContain("solar-glow");
    expect(glow(5).classList.contains("scene-glow")).toBe(true);
    expect(glow(5).style.opacity).toBe("0.1");
    expect(glow(0).style.opacity).toBe("0");
  });

  test("the Powerwall's charge bar fills its side face from the bottom, in the Powerwall's green, never dimmed", () => {
    const bar = (battery: number) => part(renderScene({ ...midday, battery }), "powerwall-charge");
    const corners = (battery: number) => bar(battery).querySelector<HTMLElement>("polygon")!.getAttribute("points")!.split(" ").map((p) => p.split(",").map(Number));
    const { bottomLeft, topLeft, topRight, bottomRight } = CHARGE_BAR;
    const halfway = ([bx, by]: number[], [tx, ty]: number[]) => [(bx + tx) / 2, (by + ty) / 2];

    expect(corners(100)).toEqual([bottomLeft, topLeft, topRight, bottomRight]);
    const [, left, right] = corners(50);
    [[left, halfway(bottomLeft, topLeft)], [right, halfway(bottomRight, topRight)]].forEach(([[x, y], [hx, hy]]) => {
      expect(x).toBeCloseTo(hx);
      expect(y).toBeCloseTo(hy);
    });
    expect(corners(0)).toEqual([bottomLeft, bottomLeft, bottomRight, bottomRight]);
    expect(bar(100).querySelector<HTMLElement>("polygon")!.getAttribute("fill")).toBe(FLOW_COLORS.powerwall);
    ["scene-render", "scene-plug"].forEach((name) => expect(bar(100).classList.contains(name)).toBe(false));
  });

  test("no charge bar where replay has no battery reading", () => {
    const scene = render(<LiveScene state={sceneState({ ...midday, battery: null }, NOW, { replay: true })} />).container;
    expect(part(scene, "powerwall-charge")).toBeNull();
  });

  test("in replay the plugged-in car shows by name, as the Model 3 without its own image", () => {
    const replayed = (vehicle: Vehicle | null) => render(<LiveScene state={sceneState({ ...midday, vehicle }, NOW, { replay: true })} />).container;
    const r2d2 = replayed({ name: "R2D2", charging_power: 7.2 });
    const idle = replayed({ name: "Tesla T.I.E. Fighter", charging_power: 0 });
    const unknown = replayed({ name: "Vehicle", charging_power: 3 });

    expect(part(r2d2, "car").getAttribute("src")).toContain("model-y");
    expect(part(r2d2, "label-car").textContent).toBe("R2D27.2 kW");
    expect(part(idle, "house").getAttribute("src")).toContain("house-open");
    expect(flows(idle).filter((link) => link.includes("-car"))).toEqual([]);
    expect(part(unknown, "car").getAttribute("src")).toContain("model-3");
    expect(part(unknown, "label-car").textContent).toBe("Vehicle3.0 kW");
    expect(part(renderScene({ ...midday, vehicle: { ...r2d2Live, name: "Vehicle" } }), "car")).toBeNull();
  });

  test("no mask hides the flows: the panel image covers them", () => {
    expect(part(renderScene(midday), "lines").querySelector<HTMLElement>("mask")).toBeNull();
  });
});

describe("car", () => {
  test("plugged-in car gets a label", () => {
    expect(part(renderScene({ ...midday, vehicle: r2d2 }), "label-car").textContent).toBe("R2D20 kW · 80%");
  });

  test("a stale level's age shows on its own line", () => {
    const scene = renderScene({ ...midday, vehicle: { ...r2d2, battery_level_at: "2026-10-17T14:00:00Z" } });

    expect(part(scene, "label-car").querySelector<HTMLElement>(".scene-label-note")!.textContent).toBe("8 h ago");
  });

  test("no car label without a car", () => {
    expect(part(renderScene(midday), "label-car")).toBeNull();
  });
});

describe("flows", () => {
  test("nothing flowing: gray lines only", () => {
    const scene = renderScene({ ...midday, solarPower: 0, homePower: 0, gridPower: 0 });

    expect(flows(scene)).toEqual([]);
    expect(scene.querySelectorAll<HTMLElement>(".scene-line")).toHaveLength(4);
  });

  test("a gradient runs from the source, through the panel, to the destination", () => {
    const scene = renderScene({ ...midday, solarPower: 0, homePower: 1.2, batteryPower: 1.2, gridPower: 0 });
    const flow = scene.querySelector<HTMLElement>('[data-link="powerwall-home"]')!;

    expect(flows(scene)).toEqual(["powerwall-home:0"]);
    expect(flow.dataset.from).toBe(LEGS.powerwall[0].join(","));
    expect(flow.dataset.to).toBe(LEGS.home[0].join(","));
    expect(flow.querySelectorAll<HTMLElement>("[data-flow]").length).toBeGreaterThan(0);
  });

  test("exporting solar while charging the car", () => {
    const scene = renderScene({ ...midday, homePower: 0.9, gridPower: -2.0, vehicle: { ...r2d2, charging_power: 3.2 } });

    expect(flows(scene)).toEqual(["solar-home:0", "solar-car:0", "solar-grid:0"]);
  });

  test("a second source into the house gets its own lane", () => {
    const scene = renderScene({ ...midday, solarPower: 2.0, homePower: 3.5, gridPower: 1.5 });

    expect(flows(scene)).toEqual(["solar-home:0", "grid-home:1"]);
    expect(scene.querySelector<HTMLElement>('[data-link="grid-home"] .scene-line')).not.toBeNull();
  });

  test("the Powerwall keeps the straight line into the house; solar takes the lane below", () => {
    const scene = renderScene({ ...midday, solarPower: 1.0, homePower: 3.0, batteryPower: 2.0, gridPower: 0 });
    const lane = (link: string) => scene.querySelector<HTMLElement>(`[data-link="${link}"]`)!;
    const laneLine = lane("solar-home").querySelector<HTMLElement>(".scene-line")!.getAttribute("points")!.split(" ")[0].split(",").map(Number);

    expect(flows(scene)).toEqual(["solar-home:1", "powerwall-home:0"]);
    // Below the house line, which ends at the window.
    expect(laneLine[1]).toBeGreaterThan(LEGS.home[0][1]);
  });

  test("with solar, the Powerwall and the grid into the house, solar runs above the house line and the grid below", () => {
    const scene = renderScene({ ...midday, solarPower: 0.7, homePower: 1.5, batteryPower: 0.6, gridPower: 0.2 });
    const start = (link: string) => scene.querySelector<HTMLElement>(`[data-link="${link}"] .scene-line`)!.getAttribute("points")!.split(" ")[0].split(",").map(Number);

    expect(flows(scene)).toEqual(["solar-home:-1", "powerwall-home:0", "grid-home:1"]);
    expect(scene.querySelector<HTMLElement>('[data-link="powerwall-home"] .scene-line')).toBeNull();
    expect(start("solar-home")[1]).toBe(LEGS.home[0][1] - LANE_DROP);
    expect(start("grid-home")[1]).toBe(LEGS.home[0][1] + LANE_DROP);
  });

  test("two sources exporting share the grid line, in the color of the larger", () => {
    const scene = renderScene({ ...midday, solarPower: 6.0, homePower: 1.0, batteryPower: 3.0, gridPower: -8.0 });
    const gradients = (link: string) => scene.querySelector<HTMLElement>(`[data-link="${link}"]`)!.querySelectorAll<HTMLElement>("[data-flow]").length;

    expect(flows(scene)).toEqual(["solar-home:0", "solar-grid:0", "powerwall-grid:0"]);
    expect(gradients("solar-grid")).toBeGreaterThan(0);
    expect(gradients("powerwall-grid")).toBe(0);
    expect(scene.querySelector<HTMLElement>('[data-source="powerwall"]')!.querySelectorAll<HTMLElement>("[data-flow]").length).toBeGreaterThan(0);
    expect(scene.querySelectorAll<HTMLElement>(".scene-line")).toHaveLength(4);
  });

  test("a single source has no extra lane", () => {
    const scene = renderScene({ ...midday, solarPower: 4.1, gridPower: 0 });

    expect(flows(scene)).toEqual(["solar-home:0"]);
    expect(scene.querySelectorAll<HTMLElement>(".scene-line")).toHaveLength(4);
  });
});

describe("charging", () => {
  const charging = (name: string) => ({ ...midday, homePower: 0.9, gridPower: -2.0, vehicle: { ...r2d2, name, charging_power: 3.2 } });
  const pointsOf = (el: Element) => el.getAttribute("points")!.split(" ").map((p: string) => p.split(",").map(Number));

  test.each([
    ["R2D2", "model-y", CAR_CABLES.modelY],
    ["Tesla T.I.E. Fighter", "model-3", CAR_CABLES.model3],
  ])("%s shows its own image, with a gradient from the Wall Connector along its own cable to the plug", (name, image, { path, plug }) => {
    const scene = renderScene(charging(name));
    const flow = scene.querySelector<HTMLElement>('[data-link="solar-car"]')!;
    const start = flow.querySelector<HTMLElement>(".scene-flow")!;

    expect(part(scene, "car").getAttribute("src")).toContain(image);
    expect(flow.querySelectorAll<HTMLElement>("[data-flow]").length).toBeGreaterThan(0);
    expect([Number(start.getAttribute("x1")), Number(start.getAttribute("y1"))]).toEqual(path[0]);
    expect(flow.dataset.to).toBe(plug[0].join(","));
    expect(part(scene, "plug").querySelectorAll<HTMLElement>("[data-flow]")).toHaveLength(0);
  });

  test("plugged in at 0 kW: the cable and plug are shown with no gradient", () => {
    const scene = renderScene({ ...midday, vehicle: r2d2 });

    expect(pointsOf(part(scene, "cable"))).toEqual(CAR_CABLES.modelY.path.map(([x, y]) => [x, y]));
    expect(pointsOf(part(scene, "plug").querySelector<HTMLElement>("polyline")!)).toEqual(CAR_CABLES.modelY.plug);
    expect(scene.querySelector<HTMLElement>('[data-link$="-car"]')).toBeNull();
  });

  test("the two cars' cables come out of the Wall Connector and end at their own plug", () => {
    const [modelY, model3] = [CAR_CABLES.modelY, CAR_CABLES.model3];
    // The Wall Connector's layer covers 118 to 134 across and 505 to 537 down.
    const [x, y] = modelY.path[0];

    expect(x).toBeGreaterThan(118);
    expect(x).toBeLessThan(134);
    expect(y - 80).toBeGreaterThan(505);
    expect(y - 80).toBeLessThan(537);
    expect(model3.path[0]).toEqual(modelY.path[0]);
    [modelY, model3].forEach(({ path, plug }) => expect(path.at(-1)).toEqual(plug[0]));
    expect(modelY.plug[1]).not.toEqual(model3.plug[1]);
  });

  test("a car without its own image has no cable to flow along", () => {
    const flow = renderScene(charging("Tesla Model Z")).querySelector<HTMLElement>('[data-link="solar-car"]')!;

    expect(flow.querySelectorAll<HTMLElement>("[data-flow]")).toHaveLength(0);
  });
});

describe("flow animation", () => {
  // A destination-leg gradient: its stage starts as the source's reaches the panel.
  const keys = { begin: TIMING.leg / TIMING.cycle, end: (TIMING.leg * (2 + TIMING.tail)) / TIMING.cycle, rest: [-6, 0], to: [100, 0] };

  test("a gradient waits off its leg before its stage, slides during it, and waits past the end after", () => {
    expect(flowOffset(0.1, keys)).toEqual([-6, 0]);
    const [x, y] = flowOffset((keys.begin + keys.end) / 2, keys);
    expect(x).toBeCloseTo(47);
    expect(y).toBe(0);
    expect(flowOffset(0.95, keys)).toEqual([100, 0]);
  });

  test("each frame sets every flow gradient's transform for that moment in the cycle", () => {
    const scene = renderScene({ ...midday, solarPower: 0, homePower: 1.2, batteryPower: 1.2, gridPower: 0 });
    const gradients = [...scene.querySelectorAll<HTMLElement>("[data-flow]")];
    const before = gradients.map((g) => g.getAttribute("gradientTransform"));

    moveFlows(part(scene, "lines"), 0.4 * TIMING.cycle * 1000);

    expect(gradients.length).toBeGreaterThan(0);
    expect(gradients.map((g) => g.getAttribute("gradientTransform"))).not.toEqual(before);
  });

  test("paused, flows stand still partway along their legs; live and playing, they move", () => {
    // Drives the frame loop by hand: each call runs the next frame at `now` ms.
    let next: FrameRequestCallback = () => {};
    const request = vi.spyOn(window, "requestAnimationFrame").mockImplementation((tick) => { next = tick; return 1; });
    const onBattery = sceneState({ ...midday, solarPower: 0, homePower: 1.2, batteryPower: 1.2, gridPower: 0 }, NOW);
    const { container, rerender } = render(<LiveScene state={onBattery} paused />);
    const transforms = () => [...container.querySelectorAll<HTMLElement>("[data-flow]")].map((g) => g.getAttribute("gradientTransform"));

    next(1000);
    const still = transforms();
    next(1700);
    expect(transforms()).toEqual(still);
    moveFlows(part(container, "lines"), PAUSED_AT);
    expect(transforms()).toEqual(still);
    expect(still.some((t) => t !== "translate(-6 0)")).toBe(true);

    rerender(<LiveScene state={onBattery} />);
    next(1000);
    const moving = transforms();
    next(1300);
    expect(transforms()).not.toEqual(moving);
    request.mockRestore();
  });

  test("the scene runs one frame loop and stops it when removed", () => {
    const request = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 7);
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const { unmount } = render(<LiveScene state={sceneState(midday, NOW)} />);

    expect(request).toHaveBeenCalledTimes(1);
    unmount();
    expect(cancel).toHaveBeenCalledWith(7);
    request.mockRestore();
    cancel.mockRestore();
  });
});

describe("fits a phone", () => {
  test("labels with long values do not overlap on a 295 px wide stage", () => {
    // 375 px screen less the page card's margins and padding (327 px) and the scene's side padding.
    const { title, value } = PHONE_TEXT;
    const boxes = [
      labelBox(LABELS.car, [["Tesla T.I.E. Fighter", title], ["11.5 kW · 100%", value], ["23 h ago", title]], 295),
      labelBox(LABELS.solar, [["SOLAR", title], ["10.4 kW", value]], 295),
      labelBox(LABELS.home, [["HOME", title], ["10.4 kW", value]], 295),
      labelBox(LABELS.powerwall, [["POWERWALL", title], ["10.4 kW · 100%", value]], 295),
      labelBox(LABELS.grid, [["GRID", title], ["10.4 kW", value]], 295),
    ];
    const height = (295 * STAGE.height) / 1600;

    boxes.forEach((a, i) => {
      expect(a.left).toBeGreaterThanOrEqual(0);
      expect(a.right).toBeLessThanOrEqual(295);
      expect(a.top).toBeGreaterThanOrEqual(0);
      expect(a.bottom).toBeLessThanOrEqual(height);
      boxes.slice(i + 1).forEach((b) => {
        const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        expect(overlap).toBe(false);
      });
    });
  });
});

describe("lanes", () => {
  test.each([["home", 1], ["powerwall", 1], ["home", 2]])(
    "a %s lane %i is its line moved straight down, with no bends",
    (name, lane) => {
      const main = legPoints(name as LegName);
      const moved = legPoints(name as LegName, lane as number);

      expect(moved).toHaveLength(main.length);
      moved.forEach(([x, y], i) => {
        expect(x).toBe(main[i][0]);
        expect(y).toBe(main[i][1] + lane * LANE_DROP);
      });
    }
  );

  test("the lane's ends sit directly below the main line's ends", () => {
    const scene = renderScene({ ...midday, solarPower: 2.0, homePower: 3.5, gridPower: 1.5 });
    const ends = (polyline: Element) => {
      const pts = polyline.getAttribute("points")!.split(" ").map((p: string) => p.split(",").map(Number));
      return [pts[0], pts[pts.length - 1]];
    };
    const [mainStart, mainEnd] = ends(scene.querySelector<HTMLElement>('[data-part="leg-home"]')!);
    const [laneStart, laneEnd] = ends(scene.querySelector<HTMLElement>('[data-link="grid-home"] .scene-line')!);

    expect([laneStart[0], laneEnd[0]]).toEqual([mainStart[0], mainEnd[0]]);
    expect([laneStart[1] - mainStart[1], laneEnd[1] - mainEnd[1]]).toEqual([LANE_DROP, LANE_DROP]);
  });
});

describe("the electrical panel", () => {
  const centre = PANEL.y + PANEL.height / 2;

  test("the house line and its lane meet the panel's right edge either side of its centre", () => {
    const [mainEnd, laneEnd] = [legPoints("home").at(-1)!, legPoints("home", 1).at(-1)!];

    [mainEnd, laneEnd].forEach(([x, y]) => {
      expect(x).toBe(PANEL.x + PANEL.width);
      expect(y).toBeGreaterThan(PANEL.y);
      expect(y).toBeLessThan(PANEL.y + PANEL.height);
    });
    expect(mainEnd[1]).toBeLessThan(centre);
    expect(laneEnd[1]).toBeGreaterThan(centre);
  });

  test("the lane above the house line ends directly above its ends, under the window and on the panel", () => {
    const [main, above] = [legPoints("home"), legPoints("home", -1)];
    // The window's glass at the house line's end (x 1528) spans y 293 to 366 in render units.
    const windowTop = 293 + RENDER.y;

    [0, main.length - 1].forEach((i) => {
      expect(above[i][0]).toBe(main[i][0]);
      expect(main[i][1] - above[i][1]).toBe(LANE_DROP);
    });
    expect(above[0][1] - 3).toBeGreaterThan(windowTop);
    const [x, y] = above.at(-1)!;
    expect(x).toBe(PANEL.x + PANEL.width);
    expect(y).toBeGreaterThan(PANEL.y);
  });

  test("the Powerwall and house lines are one straight line through the panel", () => {
    const slope = ([[x1, y1], [x2, y2]]: number[][]) => (y2 - y1) / (x2 - x1);
    const [pw, home] = [LEGS.powerwall, LEGS.home];

    expect(slope(pw)).toBeCloseTo(slope(home), 1);
    // The Powerwall line, carried on across the panel, arrives where the house line leaves.
    expect(pw[1][1] + slope(pw) * (home[1][0] - pw[1][0])).toBeCloseTo(home[1][1], 0);
  });

  test("the solar line ends on the panel's top and the grid line leaves its bottom", () => {
    expect(LEGS.solar.at(-1)![1]).toBe(PANEL.y);
    expect(LEGS.grid.at(-1)![1]).toBe(PANEL.y + PANEL.height);
  });
});

describe("line ends under the elements", () => {
  // Each element's layer box in render units, and whether a stage point lies in it.
  const inside = ([x, y]: number[], [x0, y0, x1, y1]: number[]) => x > x0 && x < x1 && y - 80 > y0 && y - 80 < y1;
  const BOXES = { solarPanels: [1159, 69, 1574, 438], powerwall: [1361, 458, 1399, 569], window: [1521, 271, 1551, 372] };

  test("the solar and Powerwall lines start under their elements", () => {
    expect(inside(LEGS.solar[0], BOXES.solarPanels)).toBe(true);
    expect(inside(LEGS.powerwall[0], BOXES.powerwall)).toBe(true);
  });

  test("the house line and its lane end under the window", () => {
    expect(inside(legPoints("home")[0], BOXES.window)).toBe(true);
    expect(inside(legPoints("home", 1)[0], BOXES.window)).toBe(true);
  });
});

describe("weather", () => {
  const NOON = new Date("2026-10-21T19:00:00Z");
  const NIGHT = new Date("2026-10-22T05:00:00Z");
  const weatherScene = (cover: number | null | undefined, date = NOON) => render(<LiveScene state={sceneState(midday, date, { cover })} />).container;
  const opacity = (container: Element, name: string) => Number(part(container, name).style.opacity);

  const splitScene = (weather: SceneOptions, date = NOON) => render(<LiveScene state={sceneState(midday, date, { cover: 0.5, low: 0, mid: 0, cirrus: 0, ...weather })} />).container;

  // The gray follows the low cloud and half the mid: blue up to 0.4, so a partly cloudy
  // sky keeps its blue gaps, and fully gray from 0.9. High cloud never grays it.
  test.each([
    [{ low: 0.3 }, 0],
    [{ low: 0.4 }, 0],
    [{ low: 0.5 }, 0.2],
    [{ low: 0.4, mid: 0.4 }, 0.4],
    [{ cirrus: 0.9 }, 0],
    [{ low: 0.9 }, 1],
    [{ low: 1 }, 1],
  ])("the gray sky over the clear one with %o has opacity %d", (weather, gray) => {
    expect(opacity(splitScene(weather), "sky-gray")).toBeCloseTo(gray);
  });

  // Without the split the cover is drawn as low cloud.
  test.each([[0, 0], [0.4, 0], [0.65, 0.5], [1, 1]])("the gray sky at %d cover without the split has opacity %d", (cover, gray) => {
    expect(opacity(weatherScene(cover), "sky-gray")).toBeCloseTo(gray);
  });

  test("the scene carries the cover for the house's overcast look; none draws as clear", () => {
    expect(part(weatherScene(0.3), "scene").style.getPropertyValue("--cover")).toBe("0.3");
    expect(part(weatherScene(undefined), "scene").style.getPropertyValue("--cover")).toBe("0");
    expect(opacity(weatherScene(null), "sky-gray")).toBe(0);
  });

  // The clouds' canvas is handed each layer's amount: from the low, mid and high
  // shares, or without the split the cover as low cloud; the darker overcast cloud
  // from half the low cloud.
  const drawnShares = (weather: SceneOptions) => {
    let shares: Record<string, number> = {};
    withFrames(() => {
      render(<LiveScene state={sceneState(midday, NOON, weather)} />);
      act(() => vi.advanceTimersByTime(50));
      shares = lastDraw()[0].shares;
    });
    return shares;
  };

  test.each([
    [{ cover: 0.6, low: 0.5, cirrus: 0.9 }, { cirrus: 0.9, mid: 0, low: 0.5, dense: 0 }],
    [{ cover: 0.8, low: 0.7, mid: 0.2 }, { cirrus: 0, mid: 0.2, low: 0.7, dense: 0.4 }],
    [{ cover: 1, low: 1, cirrus: 0.5 }, { cirrus: 0.5, mid: 0, low: 1, dense: 1 }],
    [{ cover: 0.7 }, { cirrus: 0, mid: 0, low: 0.7, dense: 0.4 }],
    [{ cover: 0.7, low: null, mid: null, cirrus: null }, { cirrus: 0, mid: 0, low: 0.7, dense: 0.4 }],
    [{ cover: 0.2, cirrus: 0.8, low: 0, mid: 0 }, { cirrus: 0.8, mid: 0, low: 0, dense: 0 }],
  ])("with %o the clouds are drawn with %o", (weather, expected) => {
    const shares = drawnShares(weather);
    for (const [layer, share] of Object.entries(expected)) expect(shares[layer]).toBeCloseTo(share, 6);
  });

  test("an overcast code without the split covers the sky with low cloud", () => {
    const shares = drawnShares({ cover: 1 });
    expect(shares.low).toBe(1);
    expect(shares.dense).toBe(1);
  });

  test("the sun glow sits where the state puts it, dimmed and spread by cloud", () => {
    const afternoon = new Date("2026-10-21T21:00:00Z"); // 2 PM
    const { x, altitude } = sceneState(midday, afternoon).sunGlow!;
    const [clear, overcast] = [weatherScene(0, afternoon), weatherScene(1, afternoon)];
    const top = (container: Element) => parseFloat(part(container, "sun-glow").style.top);

    // jsdom 31 reads percentages back to 4 decimals.
    expect(parseFloat(part(clear, "sun-glow").style.left)).toBeCloseTo(x * 100, 4);
    expect(top(clear)).toBeCloseTo((skyY(altitude) / STAGE.height) * 100, 3);
    expect(opacity(clear, "sun-glow")).toBe(1);
    expect(opacity(overcast, "sun-glow")).toBeCloseTo(0.15);
    expect(parseFloat(part(overcast, "sun-glow").style.width)).toBeGreaterThan(parseFloat(part(clear, "sun-glow").style.width));
    expect(part(clear, "sun-glow").style.width).toBe("22%"); // a tight halo around a bright center
  });

  test("near the horizon the sun's core stays bright and turns warm while its haze dims", () => {
    const state = sceneState(midday, new Date("2026-10-21T21:00:00Z"));
    const at = (daylight: number, cover = 0) =>
      render(<LiveScene state={{ ...state, cover, sunGlow: { ...state.sunGlow!, daylight } }} />).container;
    const haze = (container: Element) => opacity(part(container, "sun-glow"), "sun-haze");

    expect(opacity(at(1), "sun-glow")).toBe(1);
    expect(opacity(at(1), "sun-glow-warm")).toBe(0);
    expect(haze(at(1))).toBe(1);
    expect(opacity(at(0.5), "sun-glow")).toBe(1);
    expect(opacity(at(0.5), "sun-glow-warm")).toBeCloseTo(0.5);
    expect(haze(at(0.5))).toBeCloseTo(0.675);
    expect(opacity(at(0), "sun-glow")).toBe(1);
    expect(opacity(at(0), "sun-glow-warm")).toBe(1);
    expect(haze(at(0))).toBeCloseTo(0.35);
    expect(opacity(at(0, 1), "sun-glow")).toBeCloseTo(0.15);
  });

  test("the sun glow fades over the sun's last degrees", () => {
    const state = sceneState(midday, new Date("2026-10-21T21:00:00Z"));
    const glow = (fade: number) => opacity(render(<LiveScene state={{ ...state, cover: 0, sunGlow: { ...state.sunGlow!, fade } }} />).container, "sun-glow");

    expect(glow(0.5)).toBeCloseTo(glow(1) * 0.5);
    expect(glow(0)).toBe(0);
  });

  test("there is no sun glow at night", () => {
    expect(part(weatherScene(0, NIGHT), "sun-glow")).toBeNull();
  });

  test("the sky and clouds sit behind the stage; the ground in it, over the sun glow and under the house", () => {
    const scene = weatherScene(0.5);
    const children = [...part(scene, "scene").children].map((el) => (el as HTMLElement).dataset.part ?? el.getAttribute("class"));

    expect(children.slice(0, 6)).toEqual(["sky-day", "stars", "twilight", "sky-gray", "clouds", "stage"]);
    expect(part(part(scene, "sky-gray"), "sky-gray-day")).not.toBeNull();
    expect(part(scene, "stars").tagName).toBe("CANVAS");
    expect(parseFloat(part(scene, "ground").style.top)).toBeCloseTo((EAVES / STAGE.height) * 100, 4);
  });

  describe("the stars canvas", () => {
    // jsdom lays nothing out and has no canvas: give the scene a size and record
    // the last frame drawn, as the alpha of each point.
    const framesOf = (state: Parameters<typeof LiveScene>[0]["state"], { paused = false, reduced = false } = {}) => {
      vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
      const original = window.matchMedia;
      if (reduced) window.matchMedia = ((query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" })) as unknown as typeof window.matchMedia;
      let frame: number[] = [];
      const context = { canvas: {}, globalAlpha: 1, setTransform: () => {}, clearRect: () => { frame = []; }, beginPath: () => {}, arc: () => {},
        fill: () => frame.push(context.globalAlpha) } as unknown as CanvasRenderingContext2D;
      const spies = [
        vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800),
        vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(600),
        vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(704),
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context),
      ];
      try {
        const scene = render(<LiveScene state={state} paused={paused} />).container;
        const frames = [100, 1000, 1000].map((ms) => { act(() => vi.advanceTimersByTime(ms)); return [...frame]; });
        return { scene, frames };
      } finally {
        spies.forEach((spy) => spy.mockRestore());
        window.matchMedia = original;
        vi.useRealTimers();
      }
    };

    test("a canvas in the stars' place, drawing every visible point of the night sky each frame", () => {
      const state = sceneState(midday, new Date("2026-11-09T07:00:00Z")); // 11 PM, new moon
      const { scene, frames } = framesOf(state);

      expect(part(scene, "stars").tagName).toBe("CANVAS");
      expect(state.stars.length).toBeGreaterThan(200);
      frames.forEach((alphas) => expect(alphas).toHaveLength(state.stars.length));
    });

    test("they twinkle from frame to frame", () => {
      const { frames } = framesOf(sceneState(midday, NIGHT));

      expect(frames[1]).not.toEqual(frames[2]);
    });

    test.each([["paused", { paused: true }], ["reduced motion", { reduced: true }]])("hold still when %s", (_, options) => {
      const { frames } = framesOf(sceneState(midday, NIGHT), options);

      expect(frames[1]).toEqual(frames[2]);
    });

    test("none by day", () => {
      expect(framesOf(sceneState(midday, NOON)).frames.flat()).toEqual([]);
    });
  });

  describe("drawing the stars", () => {
    // Records what is drawn, as jsdom has no canvas.
    const recorder = () => {
      const calls: unknown[][] = [];
      const context = { canvas: { width: 800, height: 600 }, clearRect: (...a: number[]) => calls.push(["clear", ...a]), beginPath: () => {},
        arc: (...a: number[]) => calls.push(["arc", ...a]), fill: () => calls.push(["fill", context.fillStyle, context.globalAlpha]) } as unknown as CanvasRenderingContext2D;
      return { context, calls };
    };
    const box = { left: 24, top: 270, width: 704, scale: 704 / 1600 };

    test("clears, then draws each point at its place on the stage, scaled, in its color and brightness", () => {
      const { context, calls } = recorder();
      drawStars(context, [{ x: 0.5, altitude: 42, radius: 2, opacity: 0.8, color: "rgb(255 250 244)" },
        { x: 0.9, altitude: 12, radius: 1, opacity: 0.4, color: "rgb(190 205 255)" }], box);

      expect(calls[0]).toEqual(["clear", 0, 0, 800, 600]);
      const arcs = calls.filter(([kind]) => kind === "arc");
      expect(arcs).toHaveLength(2);
      expect(arcs[0][1]).toBeCloseTo(24 + 0.5 * 704, 5);
      expect(arcs[0][2]).toBeCloseTo(270 + skyY(42) * box.scale, 5);
      expect(arcs[0][3]).toBeCloseTo(2 * box.scale, 5);
      expect(arcs[1][1]).toBeCloseTo(24 + 0.9 * 704, 5);
      expect(calls.filter(([kind]) => kind === "fill")).toEqual([["fill", "rgb(255 250 244)", 0.8], ["fill", "rgb(190 205 255)", 0.4]]);
    });

    test("given a time, each star's brightness is its twinkle at that time", () => {
      const { context, calls } = recorder();
      const star = { x: 0.5, altitude: 12, radius: 1, opacity: 0.8, color: "#fff", index: 3 };
      drawStars(context, [star, { ...star, index: undefined, planet: "mars" }], box, 4321);

      const alphas = calls.filter(([kind]) => kind === "fill").map(([, , alpha]) => alpha);
      expect(alphas[0]).toBeCloseTo(0.8 * twinkle(star, 4321), 5);
      expect(alphas[1]).toBe(0.8);
    });

    test("an empty sky is just cleared", () => {
      const { context, calls } = recorder();
      drawStars(context, [], box);

      expect(calls).toEqual([["clear", 0, 0, 800, 600]]);
    });
  });

  describe("moon", () => {
    // Real moments at the site (see sun.test.js).
    const EVENING = new Date("2026-10-25T04:00:00Z"); // 9 PM on 2026-10-24, waxing gibbous, east-southeast
    const AFTERNOON = new Date("2026-10-17T23:00:00Z"); // 4 PM on 2026-10-17, moon up by day
    // The lit part's path in a unit circle: the limb's half circle (sweep 0 through
    // the left, 1 through the right), then the terminator's half ellipse back. The
    // limb is always on the right; the mask turns it toward the sun.
    const parts = (d: string) => d.match(/^M0,-1 A1,1 0 0 ([01]) 0,1 A([\d.]+),1 0 0 ([01]) 0,-1Z$/)!.slice(1).map(Number);

    test.each([
      // phase, limb through the right?, terminator's width, terminator through the left?
      [0.11, 1, 0.77, 0], // waxing crescent: a thin sliver
      [0.5, 1, 1, 1], // full: terminator a full half circle back through the left
      [0.62, 1, 0.73, 1], // waning gibbous: the dark part a sliver on the left
      [0.89, 1, 0.77, 0], // waning crescent: the same sliver as waxing
    ])("phase %d: limb sweep %d, terminator %d wide, sweep %d", (phase, limb, width, terminator) => {
      const [l, w, t] = parts(moonLitPath(phase));

      expect(l).toBe(limb);
      expect(w).toBeCloseTo(width, 1);
      expect(t).toBe(terminator);
    });

    test("at night: placed on the sky's scale, bright, with a glow and its dark side; cloud dims it", () => {
      const { x, altitude } = sceneState(midday, EVENING).moon!;
      const [clear, overcast] = [weatherScene(0, EVENING), weatherScene(1, EVENING)];
      const moon = part(clear, "moon");

      expect(parseFloat(moon.style.left)).toBeCloseTo(x * 100, 4);
      expect(parseFloat(moon.style.top)).toBeCloseTo((skyY(altitude) / STAGE.height) * 100, 3);
      expect(opacity(clear, "moon")).toBe(1);
      expect(opacity(overcast, "moon")).toBeCloseTo(0.15);
      expect(opacity(clear, "moon-glow")).toBe(1);
      expect(part(clear, "moon-night").getAttribute("opacity")).toBe("1");
      expect(part(part(clear, "moon-night"), "moon-dark")).not.toBeNull();
    });

    test("through dusk: its glow and dark side partway, as the scene is", () => {
      const scene = weatherScene(0, SUNSET);
      const { night } = sceneState(midday, SUNSET).moon!;

      expect(opacity(scene, "moon-glow")).toBeCloseTo(night, 5);
      expect(Number(part(scene, "moon-night").getAttribute("opacity"))).toBeCloseTo(night, 5);
    });

    test("by day: fainter the higher the sun, without a glow or dark side", () => {
      const state = sceneState(midday, AFTERNOON);
      const at = (daylight: number, cover = 0) =>
        render(<LiveScene state={{ ...state, cover, moon: { ...state.moon!, daylight } }} />).container;

      expect(opacity(at(1), "moon")).toBeCloseTo(0.15); // sun high
      expect(opacity(at(0.5), "moon")).toBeCloseTo(0.575);
      expect(opacity(at(0), "moon")).toBeCloseTo(1); // sun on the horizon
      expect(opacity(at(1, 1), "moon")).toBeCloseTo(0.15 * 0.15);
      expect(opacity(at(1), "moon-glow")).toBe(0);
      expect(part(at(1), "moon-night").getAttribute("opacity")).toBe("0");
    });

    test("shows the moon's real face, mirrored and turned as in the sky, lit from the sun's side, its terminator softened", () => {
      const scene = weatherScene(0, EVENING);
      const { phase, axis, brightLimb } = sceneState(midday, EVENING).moon!;
      const face = part(scene, "moon-face");
      const maskId = face.getAttribute("mask")!.match(/url\(#(.+)\)/)![1];
      const image = face.querySelector<HTMLElement>("image")!;

      // The lit part at five phases around the real one, a fifth each, so the light fades across the terminator.
      expect([...scene.querySelectorAll<HTMLElement>(`mask#${maskId} path`)].map((path) => [path.getAttribute("d"), path.getAttribute("fill-opacity")]))
        .toEqual([-2, -1, 0, 1, 2].map((step) => [moonLitPath(phase + step * 0.012), "0.2"]));
      // The mirrored sky turns the real sky's counterclockwise angles clockwise; the limb starts on the right.
      expect(scene.querySelector<HTMLElement>(`mask#${maskId} g`)!.getAttribute("transform")).toBe(`rotate(${brightLimb - 90})`);
      expect(image.getAttribute("href")).toBe(moonFace.url);
      expect([image.getAttribute("x"), image.getAttribute("y"), image.getAttribute("width"), image.getAttribute("height")]).toEqual(["-1", "-1", "2", "2"]);
      expect(image.getAttribute("transform")).toBe(`rotate(${axis}) scale(-1 1)`);
      expect(scene.querySelector<HTMLElement>('[data-part="moon-sea"]')).toBeNull();
    });

    test("until its face is drawn, no face shows, only its dark disc and glow", () => {
      moonFace.url = null;
      try {
        const scene = weatherScene(0, EVENING);

        expect(part(scene, "moon-face").querySelector<HTMLElement>("image")).toBeNull();
        expect(part(scene, "moon-earthshine")).toBeNull();
        expect(part(scene, "moon-dark")).not.toBeNull();
      } finally {
        moonFace.url = "data:image/png;base64,FACE";
      }
    });

    test("earthshine: at night the dark part shows the moon's surface faintly; not by day", () => {
      const earthshine = (date: Date) => part(weatherScene(0, date), "moon-earthshine");

      expect(earthshine(EVENING).getAttribute("opacity")).toBe("0.15");
      expect(earthshine(EVENING).getAttribute("href")).toBe(moonFace.url);
      expect(earthshine(EVENING).getAttribute("transform")).toBe(`rotate(${sceneState(midday, EVENING).moon!.axis}) scale(-1 1)`);
      // The face is transparent outside the disc, so it needs no clip.
      expect(earthshine(EVENING).getAttribute("clip-path")).toBeNull();
      expect(part(part(weatherScene(0, AFTERNOON), "moon-night"), "moon-earthshine")).not.toBeNull();
      expect(part(weatherScene(0, AFTERNOON), "moon-night").getAttribute("opacity")).toBe("0");
    });

    test("the sky's height scale: overhead near the top, 10 degrees at the eaves, the horizon below the solid ground", () => {
      expect(skyY(90)).toBeCloseTo(-HEADROOM + GLOW.top, 5);
      expect(skyY(10)).toBeCloseTo(EAVES, 5);
      expect(skyY(0)).toBeCloseTo(HORIZON, 5);
      expect(skyY(50)).toBeCloseTo((skyY(90) + skyY(10)) / 2, 5);
      expect(skyY(5)).toBeCloseTo((EAVES + HORIZON) / 2, 5);
      expect(HORIZON).toBeGreaterThan(470 + 36); // below the solid ground by more than the moon's radius
      // At 2 degrees, where it has faded out, the moon's disc is behind the solid ground.
      expect(skyY(2) - 36).toBeGreaterThan(430);
    });

    test("sets behind the ground: drawn at its altitude on the sky's scale", () => {
      const state = sceneState(midday, EVENING);
      const top = (altitude: number) => parseFloat(part(render(<LiveScene state={{ ...state, moon: { ...state.moon!, altitude } }} />).container, "moon").style.top);

      [42, 10, 1].forEach((altitude) => expect(top(altitude)).toBeCloseTo((skyY(altitude) / STAGE.height) * 100, 3));
    });

    test("fades over its last degrees: opacity times its fade", () => {
      const state = sceneState(midday, EVENING);
      const moon = (fade: number) => opacity(render(<LiveScene state={{ ...state, cover: 0, moon: { ...state.moon!, fade } }} />).container, "moon");

      expect(moon(1)).toBe(1);
      expect(moon(0.5)).toBeCloseTo(0.5);
      expect(moon(0)).toBe(0);
    });

    describe("lingering as it sets", () => {
      beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }));
      afterEach(() => vi.useRealTimers());
      const state = sceneState(midday, EVENING);
      const scene = (moon: typeof state.moon) => <LiveScene state={{ ...state, moon }} />;

      test("stays at its last place, fading to nothing, for 1.5 seconds before it is removed", () => {
        const { container, rerender } = render(scene(state.moon));
        const top = part(container, "moon").style.top;

        rerender(scene(null));
        expect(part(container, "moon").style.top).toBe(top);
        expect(opacity(container, "moon")).toBe(0);
        act(() => vi.advanceTimersByTime(1400));
        expect(part(container, "moon")).not.toBeNull();
        act(() => vi.advanceTimersByTime(200));
        expect(part(container, "moon")).toBeNull();
      });

      test("coming back sooner shows its new state", () => {
        const { container, rerender } = render(scene(state.moon));
        rerender(scene(null));
        act(() => vi.advanceTimersByTime(500));
        rerender(scene({ ...state.moon!, fade: 0.5 }));
        act(() => vi.advanceTimersByTime(2000));

        expect(opacity(container, "moon")).toBeCloseTo(0.5);
      });

      test("the sun glow lingers the same way", () => {
        const day = sceneState(midday, new Date("2026-10-21T21:00:00Z"));
        const { container, rerender } = render(<LiveScene state={day} />);
        rerender(<LiveScene state={{ ...day, sunGlow: null }} />);

        expect(opacity(container, "sun-glow")).toBe(0);
        act(() => vi.advanceTimersByTime(1600));
        expect(part(container, "sun-glow")).toBeNull();
      });
    });

    test("low, it is dimmer and warmer; high, unchanged", () => {
      const state = sceneState(midday, EVENING);
      const filter = (low: number) => part(render(<LiveScene state={{ ...state, moon: { ...state.moon!, low } }} />).container, "moon").style.filter;

      expect(filter(0)).toBe("sepia(0) saturate(1) brightness(1)");
      expect(filter(1)).toBe("sepia(0.6) saturate(2) brightness(0.65)");
    });

    test("no moon below the horizon", () => {
      expect(part(weatherScene(0, new Date("2026-10-21T21:00:00Z")), "moon")).toBeNull();
    });
  });

  test.each([[0.2, 0.87, 0.48], [0.8, 0.48, 0.87]])("the twilight runs across the whole scene, fading from the sun's side at %d", (x, left, right) => {
    const state = sceneState(midday, NOON);
    const twilight = part(render(<LiveScene state={{ ...state, twilight: { strength: 1, x } }} />).container, "twilight");

    expect(twilight.style.backgroundImage).toMatch(/^radial-gradient\(.*\), linear-gradient\(/);
    expect(twilight.style.maskImage).toBe(`linear-gradient(to right, rgba(0, 0, 0, ${left}) 0%, rgb(0, 0, 0) ${x * 100}%, rgba(0, 0, 0, ${right}) 100%)`);
  });

  test("the twilight glow is as strong as the state's twilight, centered on the sun's side", () => {
    const state = sceneState(midday, NOON);
    const scene = render(<LiveScene state={{ ...state, twilight: { strength: 0.6, x: 0.2 } }} />).container;

    expect(opacity(scene, "twilight")).toBeCloseTo(0.6);
    expect(part(scene, "twilight").style.backgroundImage).toContain("at 20% ");
    expect(opacity(weatherScene(0, NOON), "twilight")).toBe(0);
  });

  test("the clouds take the day's shapes from the state's seed, baked once for the day", () => {
    cloudRenderer.bake.mockClear();
    const state = sceneState(midday, NOON, { cover: 0.9 });
    const { rerender } = render(<LiveScene state={{ ...state, cloudSeed: 20747 }} />);
    expect(cloudRenderer.bake).toHaveBeenLastCalledWith(20747, expect.any(Number));

    rerender(<LiveScene state={{ ...sceneState(midday, NOON, { cover: 0.5 }), cloudSeed: 20747 }} />);
    expect(cloudRenderer.bake).toHaveBeenCalledTimes(1);
  });

  // Scene widths a second: a band's wind across the scene over its height, at one pace.
  test.each([
    [20, "low", 1 / (18 * 60)], // across in about 18 minutes
    [40, "mid", 1 / (18 * 60)], // the same pace twice as high
    [74, "high", 1 / 1829], // about 30 minutes
    [-10, "low", -1 / (36 * 60)], // a northeast wind: right to left in about 36 minutes
    [7, "low", 7 / 21600], // a light breeze: about 51 minutes
    [60, "low", 1 / 360], // a winter storm: about 6 minutes, uncapped
    [0, "low", 1 / 3600], // calm: low and mid creep right, across in an hour
    [0, "mid", 1 / 3600],
    [undefined, "low", 1 / 3600],
    [null, "mid", 1 / 3600],
    [-2, "low", -1 / 3600], // a breath of wind sets the creep's way
    [0, "high", 0], // cirrus stands still
    [null, "high", 0],
  ])("%s km/h across the scene drifts the %s cloud %d scene widths a second", (wind, band, velocity) => {
    expect(driftVelocity(wind, band as "low" | "mid" | "high")).toBeCloseTo(velocity, 6);
  });

  test("a turning wind slows the clouds through a stop, not a jump", () => {
    let v = -1 / 120;
    const seen = [];
    for (let frame = 0; frame < 200; frame++) seen.push((v = easeDrift(v, 1 / 100, 16)));

    expect(Math.min(...seen.map(Math.abs))).toBeLessThan(0.0005);
    expect(seen[0]).toBeLessThan(0);
    expect(seen.at(-1)).toBeCloseTo(1 / 100, 4);
  });

  const lastDraw = () => cloudRenderer.draw.mock.calls.at(-1)!;
  const withFrames = (run: () => void) => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
    cloudRenderer.draw.mockClear();
    try { run(); } finally { vi.useRealTimers(); }
  };

  test("the clouds' canvas sits over the gray sky and behind the stage", () => {
    const scene = weatherScene(0.5);
    const canvas = part(scene, "clouds");
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas.previousElementSibling).toBe(part(scene, "sky-gray"));
    expect(canvas.nextElementSibling).toBe(part(scene, "stage"));
  });

  // How far each layer drifted between two draws, in scene widths, across the wrap at 1.
  const drifted = (before: number[], after: number[]) => before.map((b, i) => ((after[i] - b + 1.5) % 1) - 0.5);
  const sheared = { cover: 0.5, low: 0.4, mid: 0.4, cirrus: 0.4, windLow: -10, windMid: 0, windHigh: 60 };

  test("each band drifts by its own height's wind: low and dense one way, cirrus the other", () => withFrames(() => {
    render(<LiveScene state={sceneState(midday, NOON, sheared)} />);
    act(() => vi.advanceTimersByTime(3000));
    const before = lastDraw()[1];
    act(() => vi.advanceTimersByTime(60000));
    const [cirrus, mid, low, dense] = drifted(before, lastDraw()[1]);
    expect(low).toBeCloseTo(-60 / 2160, 4);
    expect(dense).toBe(low);
    expect(mid).toBeCloseTo(60 / 3600, 4);
    expect(cirrus).toBeCloseTo((60 * 60) / 9.4 / 14400, 4);
  }));

  test("a turning wind slows its band through a stop while the others keep their drift", () => withFrames(() => {
    const { rerender } = render(<LiveScene state={sceneState(midday, NOON, sheared)} />);
    act(() => vi.advanceTimersByTime(3000));
    rerender(<LiveScene state={sceneState(midday, NOON, { ...sheared, windLow: 10 })} />);
    const steps = [];
    let last = lastDraw()[1];
    for (let frame = 0; frame < 120; frame++) {
      act(() => vi.advanceTimersByTime(16));
      steps.push(drifted(last, lastDraw()[1]));
      last = lastDraw()[1];
    }
    const lows = steps.map((step) => step[2]);
    expect(lows[0]).toBeLessThan(0);
    expect(Math.min(...lows.map(Math.abs))).toBeLessThan(2e-7);
    expect(lows.at(-1)).toBeGreaterThan(0);
    for (const step of steps) expect(step[0]).toBeCloseTo((0.016 * 60) / 9.4 / 14400, 7);
  }));

  test("under reduced motion the clouds stay put", () => withFrames(() => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" })) as unknown as typeof window.matchMedia;
    try {
      render(<LiveScene state={sceneState(midday, NOON, sheared)} />);
      act(() => vi.advanceTimersByTime(3000));
      expect(lastDraw()[1]).toEqual([0, 0, 0, 0]);
    } finally {
      window.matchMedia = original;
    }
  }));

  test("while a replay is paused the clouds stay put", () => withFrames(() => {
    render(<LiveScene state={sceneState(midday, NOON, { ...sheared, replay: true })} paused />);
    act(() => vi.advanceTimersByTime(3000));
    expect(lastDraw()[1]).toEqual([0, 0, 0, 0]);
  }));

  // The live weather arrives already walked to each reading (pages/Distribution.jsx),
  // so the scene draws what it is given.
  describe("the clouds' look follows the rain as it arrives", () => {
    const heavy = { low: 0.9, mid: 0.5, cirrus: 0.5, cover: 1 };
    const storm = () => lastDraw()[0].weights.find((w: { name: string; weight: number }) => w.name === "storm")?.weight ?? 0;

    test("live", () => withFrames(() => {
      const { rerender } = render(<LiveScene state={sceneState(midday, NOON, { ...heavy, rain: 0 })} />);
      act(() => vi.advanceTimersByTime(100));
      rerender(<LiveScene state={sceneState(midday, NOON, { ...heavy, rain: 0.7 })} />);
      act(() => vi.advanceTimersByTime(50));
      expect(storm()).toBeGreaterThan(0.6);
    }));

    test("in replay at once", () => withFrames(() => {
      const { rerender } = render(<LiveScene state={sceneState(midday, NOON, { ...heavy, rain: 0, replay: true })} />);
      act(() => vi.advanceTimersByTime(100));
      rerender(<LiveScene state={sceneState(midday, NOON, { ...heavy, rain: 0.7, replay: true })} />);
      act(() => vi.advanceTimersByTime(50));
      expect(storm()).toBeGreaterThan(0.6);
    }));
  });

  test("under reduced motion the clouds stand still and the rain shows as still streaks", () => {
    const still = (container: Element) => part(container, "scene").classList.contains("scene-still");
    expect(still(weatherScene(1))).toBe(false);

    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" })) as unknown as typeof window.matchMedia;
    try {
      const scene = render(<LiveScene state={sceneState(midday, NOON, { cover: 1, rain: 0.7 })} />).container;

      expect(still(scene)).toBe(true);
      expect(opacity(scene, "rain-far")).toBe(1);
    } finally {
      window.matchMedia = original;
    }
  });

  describe("rain", () => {
    const rainy = (rain: number | null | undefined, date = NOON) => render(<LiveScene state={sceneState({ ...midday, vehicle: r2d2 }, date, { cover: 1, rain })} />).container;

    test("falls over the house and the car, under the labels", () => {
      const order = [...part(rainy(0.7), "stage").children].map((el) => (el as HTMLElement).dataset.part);

      expect(order.indexOf("rain")).toBe(order.indexOf("wall-connector") + 1);
      expect(order.indexOf("rain")).toBeLessThan(order.indexOf("label-solar"));
    });

    test.each([
      [0, NOON, 0, 0],
      [0.2, NOON, 0.61, 0], // drizzle: clearly visible, though light
      [0.7, NOON, 1, 0.4 / 0.7],
      [1, NOON, 1, 1],
      [1, NIGHT, 0.6, 0.6],
      [1, SUNSET, 1 - 0.4 * (1 - sceneState(midday, SUNSET).dusk), 1 - 0.4 * (1 - sceneState(midday, SUNSET).dusk)],
    ])("rain %d: far and near layers' opacities", (rain, date, far, near) => {
      const scene = rainy(rain, date);

      expect(opacity(scene, "rain-far")).toBeCloseTo(far);
      expect(opacity(scene, "rain-near")).toBeCloseTo(near);
    });

    test.each([[-10, -12], [0, 0], [40, 30], [-40, -30], [undefined, 0]])("leans with %d km/h of wind across the scene: %d degrees", (wind, degrees) => {
      const scene = render(<LiveScene state={sceneState(midday, NOON, { cover: 1, rain: 0.7, wind })} />).container;

      expect(part(scene, "rain-tilt").style.transform).toBe(`skewX(${degrees}deg)`);
    });

    test("no reading is dry", () => {
      expect(opacity(rainy(undefined), "rain-far")).toBe(0);
      expect(opacity(rainy(null), "rain-near")).toBe(0);
    });
  });

  test("there is sky above the stage, HEADROOM tall", () => {
    expect(part(weatherScene(0), "stage").style.marginTop).toBe(`${(HEADROOM / STAGE.width) * 100}%`);
  });

  describe("easing", () => {
    // Faked frames too, so the test controls when a frame has been painted.
    beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "Date"] }));
    afterEach(() => vi.useRealTimers());
    const eased = (container: Element) => part(container, "scene").classList.contains("scene-eased");

    test("the first known weather is drawn at once; changes after it ease", () => {
      const { container, rerender } = render(<LiveScene state={sceneState(midday, NOON)} />);
      expect(eased(container)).toBe(false);

      rerender(<LiveScene state={sceneState(midday, NOON, { cover: 0.85 })} />);
      expect(eased(container)).toBe(false);

      act(() => vi.advanceTimersByTime(20));
      expect(eased(container)).toBe(true);
    });

    test("no reading counts as known weather", () => {
      const { container } = render(<LiveScene state={sceneState(midday, NOON, { cover: null })} />);

      act(() => vi.advanceTimersByTime(20));
      expect(eased(container)).toBe(true);
    });

    const lowDrawn = () => cloudRenderer.draw.mock.calls.at(-1)![0].shares.low;
    const liveAt = (cover: number) => <LiveScene state={sceneState(midday, NOON, { cover })} />;
    // One more frame, so the draw sees the walk's latest step.
    const frame = () => act(() => vi.advanceTimersByTime(20));

    // Live weather arrives already walked to each reading (pages/Distribution.jsx).
    test("live, the clouds take a new cover as it arrives", () => {
      const { rerender } = render(liveAt(0.3));
      frame();
      expect(lowDrawn()).toBeCloseTo(0.3, 6);

      rerender(liveAt(0.6));
      frame();
      expect(lowDrawn()).toBeCloseTo(0.6, 6);
    });

    test("the first weather after the page opens sets the clouds at once", () => {
      const { rerender } = render(<LiveScene state={sceneState(midday, NOON)} />);

      rerender(liveAt(0.6));
      frame();
      expect(lowDrawn()).toBeCloseTo(0.6, 6);
    });

    test("in replay the clouds follow the blended cover at once", () => {
      const replayAt = (cover: number) => <LiveScene state={sceneState(midday, NOON, { cover, replay: true })} />;
      const { rerender } = render(replayAt(0.3));
      frame();

      rerender(replayAt(0.6));
      frame();
      expect(lowDrawn()).toBeCloseTo(0.6, 6);
    });

    test("under reduced motion a new reading sets the clouds at once", () => {
      const original = window.matchMedia;
      window.matchMedia = ((query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" })) as unknown as typeof window.matchMedia;
      try {
        const { rerender } = render(liveAt(0.3));
        frame();

        rerender(liveAt(0.6));
        frame();
        expect(lowDrawn()).toBeCloseTo(0.6, 6);
      } finally {
        window.matchMedia = original;
      }
    });

    test("without any weather, the scene eases after a few seconds, so sunset still fades", () => {
      const { container } = render(<LiveScene state={sceneState(midday, NOON)} />);

      act(() => vi.advanceTimersByTime(4000));
      expect(eased(container)).toBe(false);
      act(() => vi.advanceTimersByTime(1000));
      expect(eased(container)).toBe(true);
    });
  });
});

describe("weather vane motion", () => {
  test.each([
    [3, 20, 0], // under 5 km/h it holds still
    [30, 32, 4], // a steady breeze wavers a few degrees
    [30, 60, 18], // the same wind, gusty, swings well to either side
    [100, 200, 25], // capped
    [20, null, 7], // without gusts, as for gusts half again the wind: 30
  ])("%s km/h with gusts of %s shakes %s degrees either way", (speed, gusts, amplitude) => {
    expect(vaneShake(speed, gusts).amplitude).toBeCloseTo(amplitude, 6);
  });

  test("a stronger wind shakes it faster", () => {
    expect(vaneShake(40, 60).frequency).toBeGreaterThan(vaneShake(10, 30).frequency);
  });

  test("no wind reading, no shake", () => {
    expect(vaneShake(null, null).amplitude).toBe(0);
  });

  test("east and west wind point it side-on, right and left", () => {
    const [ex, ey] = vaneAxis(90);
    const [wx, wy] = vaneAxis(270);
    expect(ex).toBeGreaterThan(0.9);
    expect(Math.abs(ey)).toBeLessThan(0.3);
    expect([wx, wy]).toEqual([-ex, -ey].map((v) => expect.closeTo(v, 12)));
  });

  test("north points it away, up into the picture, and south toward the viewer, down", () => {
    const [nx, ny] = vaneAxis(0);
    const [sx, sy] = vaneAxis(180);
    expect(ny).toBeLessThan(-0.3);
    expect(sy).toBeGreaterThan(0.3);
    expect(Math.hypot(nx, ny)).toBeLessThan(Math.hypot(...vaneAxis(90))); // foreshortened
  });
});

describe("weather vane", () => {
  const gale = { windSpeed: 29, windGusts: 56, windDirection: 225 };
  const vane = (options: SceneOptions) => <LiveScene state={sceneState(midday, NOW, options)} />;
  const transform = (container: Element) => part(container, "vane-arrow").getAttribute("transform");
  const posed = (degrees: number) => {
    const [dx, dy] = vaneAxis(degrees);
    return `matrix(${dx} ${dy} 0 1 ${VANE.foot[0]} ${VANE.foot[1] - VANE.arrow})`;
  };
  // The compass direction a drawn arrow points, from its matrix: inverts vaneAxis.
  const pointing = (container: Element) => {
    const [dx, dy] = transform(container)!.slice(7).split(" ").map(Number);
    const [e, n] = [vaneAxis(90), vaneAxis(0)];
    const det = e[0] * n[1] - e[1] * n[0];
    const [sin, cos] = [(dx * n[1] - dy * n[0]) / det, (e[0] * dy - e[1] * dx) / det];
    return ((Math.atan2(sin, cos) * 180) / Math.PI + 360) % 360;
  };
  const reduced = (run: () => void) => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" })) as unknown as typeof window.matchMedia;
    try { run(); } finally { window.matchMedia = original; }
  };
  const withFrames = (run: () => void) => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "Date", "setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
    try { run(); } finally { vi.useRealTimers(); }
  };

  test("stands on the roof, in the stage, and names the wind", () => {
    const scene = render(vane(gale)).container;
    expect(part(scene, "stage").contains(part(scene, "vane-art"))).toBe(true);
    expect(part(scene, "vane").tagName).toBe("BUTTON");
    expect(part(scene, "vane").getAttribute("aria-label")).toBe("Wind: 18 mph, gusts 35 mph, from SW");
  });

  test("without a wind reading it says so", () => {
    expect(part(render(vane({})).container, "vane").getAttribute("aria-label")).toBe("Wind: No wind reading");
  });

  test("under reduced motion it points straight into the wind", () => reduced(() => {
    expect(transform(render(vane(gale)).container)).toBe(posed(225));
  }));

  test("below 2 mph it keeps its last direction", () => withFrames(() => reduced(() => {
    const { container, rerender } = render(vane(gale));
    rerender(vane({ windSpeed: 3, windGusts: 5, windDirection: 90 }));
    act(() => vi.advanceTimersByTime(50));
    expect(transform(container)).toBe(posed(225));
    rerender(vane({ windSpeed: 20, windGusts: 25, windDirection: 90 }));
    act(() => vi.advanceTimersByTime(50));
    expect(transform(container)).toBe(posed(90));
  })));

  test("swings the shorter way to a new direction, overshoots once and settles within about 3 seconds", () => withFrames(() => {
    const light = { windSpeed: 4, windGusts: 4 }; // 2.5 mph: turns, too light to shake
    const { container, rerender } = render(vane({ ...light, windDirection: 350 }));
    act(() => vi.advanceTimersByTime(1000));
    expect(pointing(container)).toBeCloseTo(350, 3);
    rerender(vane({ ...light, windDirection: 20 }));
    const path: number[] = [];
    for (let i = 0; i < 40; i++) {
      act(() => vi.advanceTimersByTime(100));
      path.push((pointing(container) + 180) % 360 - 180); // -180..180, so north is 0
    }
    expect(Math.min(...path)).toBeGreaterThan(-15); // through north, never round the long way
    expect(Math.max(...path)).toBeGreaterThan(22); // past 20 once
    expect(path.slice(30).every((angle) => Math.abs(angle - 20) < 1)).toBe(true);
  }));

  test("reduced motion turned on mid-shake sets it straight on its direction", () => withFrames(() => {
    const original = window.matchMedia;
    const { container } = render(vane({ windSpeed: 30, windGusts: 60, windDirection: 270 }));
    act(() => vi.advanceTimersByTime(3000));
    try {
      window.matchMedia = ((query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" })) as unknown as typeof window.matchMedia;
      act(() => vi.advanceTimersByTime(100));
      expect(transform(container)).toBe(posed(270));
    } finally {
      window.matchMedia = original;
    }
  }));

  test("a stronger shake comes on gradually, not in a jump", () => withFrames(() => {
    const swing = (container: Element, ms: number) => {
      const angles: number[] = [];
      for (let i = 0; i < ms / 20; i++) {
        act(() => vi.advanceTimersByTime(20));
        angles.push(pointing(container));
      }
      return Math.max(...angles) - Math.min(...angles);
    };
    const { container, rerender } = render(vane({ windSpeed: 4, windGusts: 4, windDirection: 270 }));
    act(() => vi.advanceTimersByTime(1000));
    rerender(vane({ windSpeed: 30, windGusts: 60, windDirection: 270 }));
    const first = swing(container, 200);
    act(() => vi.advanceTimersByTime(3000));
    expect(first).toBeLessThan(swing(container, 2000) / 3);
  }));

  test("shakes in a gusty wind and holds still in a steady one", () => withFrames(() => {
    const spread = (options: SceneOptions) => {
      const { container, unmount } = render(vane(options));
      act(() => vi.advanceTimersByTime(4000));
      const angles: number[] = [];
      for (let i = 0; i < 60; i++) {
        act(() => vi.advanceTimersByTime(50));
        angles.push(pointing(container));
      }
      unmount();
      return Math.max(...angles) - Math.min(...angles);
    };
    const gusty = spread({ windSpeed: 30, windGusts: 60, windDirection: 270 });
    expect(gusty).toBeGreaterThan(15);
    expect(spread({ windSpeed: 30, windGusts: 32, windDirection: 270 })).toBeLessThan(gusty / 3);
    expect(spread({ windSpeed: 4, windGusts: 4, windDirection: 270 })).toBeLessThan(0.01);
  }));
});
