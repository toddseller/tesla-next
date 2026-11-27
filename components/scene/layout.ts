// The stage is the house render (1600 x 777 units, whatever the images' pixel
// size) with a band above it for the SOLAR and car labels and one below for
// POWERWALL and GRID. Lines are written in render units and offset into the
// stage, so they stay on the same spot of the house at every screen size.

// A point in stage units.
export type Point = [number, number];

export const RENDER = { y: 80, width: 1600, height: 777 };
export const STAGE = { width: 1600, height: 930 };

// The sky (openspec/specs/scene-weather), in stage units: HEADROOM of sky above
// the stage, and the eaves' line, below which the sky fades into the ground,
// solid by 470 (scene.css). Heights in the sky run from GLOW.top below the
// scene's top overhead down to HORIZON (skyY). The sun glow is
// GLOW.size wide when clear and wider under cloud.
export const HEADROOM = 0.16 * STAGE.width;
export const EAVES = 270;
// Where the sun glow, the moon and the stars set: below the solid ground (470) by more than
// the moon's radius, so each sinks fully behind the ground before it is removed.
export const HORIZON = 520;
export const GLOW = { top: 60, size: 0.22, cloudSize: 0.12 };
// The moon's disc, as a share of the stage's width.
export const MOON = { size: 0.045 };
// The May night's Star Destroyer, as a share of the scene's width.
export const SHIP = { size: 0.09 };
// Christmas Eve's sleigh (the scene-weather spec). Width is a share of the stage's, and each pass runs from `near` at
// depth 0 to `far` at 1, seen three-quarter on below `towardBelow`. `sky` is the band it flies in, in stage units from
// the scene's top (-HEADROOM) to above the roof's peak and its vane, so it never covers the house or a label. Each view's
// frame is `aspect` tall for its width, Rudolph's nose at `nose` as a share of the frame (the render script's log). Each
// pass climbs by `climb` of its height as it crosses.
export const SANTA = {
  near: { width: 0.33, seconds: 35 },
  climb: 0.1,
  far: { width: 0.1, seconds: 80 },
  towardBelow: 0.4,
  sky: { top: -HEADROOM, bottom: 50 },
  views: {
    side: { aspect: 274 / 960, nose: [0.013, 0.167] as Point },
    toward: { aspect: 410 / 800, nose: [0.024, 0.122] as Point },
  },
};

// Where a body `altitude` degrees up sits in the stage, top to bottom: overhead
// at GLOW.top below the scene's top, LOW_ALTITUDE at the eaves, evenly between,
// so star patterns keep close to their shape; then steeply down to HORIZON,
// below the solid ground, so a setting body sinks fully behind it.
const LOW_ALTITUDE = 10;
export const skyY = (altitude: number) => {
  const top = -HEADROOM + GLOW.top;
  return altitude >= LOW_ALTITUDE
    ? EAVES - ((altitude - LOW_ALTITUDE) / (90 - LOW_ALTITUDE)) * (EAVES - top)
    : HORIZON - (Math.max(0, altitude) / LOW_ALTITUDE) * (HORIZON - EAVES);
};


const at = (x: number, y: number): Point => [x, y + RENDER.y];

// The electrical panel's outline in its layer (meter.webp). Lines end on it and
// the panel, drawn over them, hides where they meet, as if wired inside.
export const PANEL = { x: 1460, y: 372 + RENDER.y, width: 20, height: 52 };

// The weather vane: its foot on the main roof's hip apex (the render's pixel
// 1720, 92 of 2400), against open sky clear of SOLAR and the car label, and the
// heights of its post, compass arms and arrow above the foot, in stage units.
export const VANE = { foot: [1146.7, 141.3] as Point, post: 70, arms: 40, arrow: 60 };

// The Christmas bulbs' sockets under the roof's edges (the live-flow-scene spec), taken from the mockup's board B. Runs
// follow the string, the recess slope from the bottom up, so red and green alternate along it as on the board.
export const CHRISTMAS_LIGHTS: Record<"garageFront" | "garageEast" | "recessSlope" | "recessEave" | "bayFront" | "powerwallSide", Point[]> = {
  garageFront: [[5.4, 508.9], [36.5, 519.7], [68.9, 530.5], [100, 541.3], [132.4, 552.1], [163.5, 562.9], [195.9, 573.7], [227, 584.5], [258.1, 595.4], [290.5, 606.2], [321.6, 617], [354.1, 627.8], [385.1, 638.6], [417.6, 649.4], [448.6, 660.2]],
  garageEast: [[478.4, 645.4], [506.8, 629.1], [536.5, 614.3], [566.2, 598.1], [594.6, 583.2], [624.3, 568.3], [654.1, 552.1], [682.4, 537.2], [712.2, 521], [741.9, 506.2], [770.3, 489.9], [800, 475.1]],
  recessSlope: [[709.5, 431.8], [732.4, 402.1], [755.4, 372.4], [778.4, 341.3], [801.4, 311.6], [824.3, 281.8]],
  recessEave: [[851.4, 254.8], [883.8, 260.2], [914.9, 267], [945.9, 272.4], [978.4, 277.8], [1010.8, 284.5], [1041.9, 289.9]],
  bayFront: [[951.4, 454.8], [982.4, 462.9], [1013.5, 469.7], [1045.9, 477.8], [1077, 484.5], [1108.1, 492.6], [1139.2, 500.8], [1170.3, 507.5], [1201.4, 515.6], [1232.4, 522.4], [1264.9, 530.5], [1295.9, 537.2], [1327, 545.4]],
  powerwallSide: [[1356.8, 530.5], [1379.7, 508.9], [1402.7, 487.2], [1425.7, 465.6], [1448.6, 444], [1470.3, 422.4], [1493.2, 400.8], [1516.2, 379.1], [1539.2, 357.5], [1562.2, 337.2], [1585.1, 315.6]],
};

// Each element's leg runs from the element to the electrical panel (the small
// gray box on the right wall), along the isometric axes of the roof, walls and
// ground. Solar runs down the roof slope, over the eave and down the wall; the
// Powerwall and home legs are one straight line through the panel. Legs start
// a few units under their element (solar panels, Powerwall, window), which is
// drawn over them, so they come out from beneath it.
export type LegName = "solar" | "home" | "powerwall" | "grid";
export const LEGS: Record<LegName, Point[]> = {
  solar: [at(1438, 304), at(1473, 331), at(1473, 372)],
  home: [at(1528, 351), at(1480, 396.8)],
  powerwall: [at(1393, 479.8), at(1460, 415.9)],
  grid: [at(1497, 560), at(1553, 500), at(1473, 477), at(1473, 424)],
};

// A car's charging cable and plug. The cable comes out from under the Wall
// Connector on the garage's left wall, hangs down the wall and sags toward the
// floor before rising into the plug: a short handle from its end into the
// charge port, at the top of the car's left taillight. The cable is the car's
// leg; it isn't joined to the panel.
const WALL_CONNECTOR: Point = [125.5, 532];
const curve = ([p0, p1, p2, p3]: Point[], steps = 24) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const [a, b, c, d] = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3];
    return at(a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]);
  });
const plugged = ([px, py]: Point) => {
  const [hx, hy] = [px - 6, py + 3.5];
  return { path: curve([WALL_CONNECTOR, [126, 590], [hx - 16, hy + 14], [hx, hy]]), plug: [at(hx, hy), at(px, py)] };
};
export const CAR_CABLES = {
  modelY: plugged([178.5, 580.7]),
  model3: plugged([180.9, 594.1]),
  starDestroyer: plugged([178.3, 590.7]),
};

// The Powerwall's charge bar at 100%, on the lower piece of its dark side face:
// the middle 40% of the face, leaning with it, with equal gaps below the
// separation and above the base. Measured from powerwall_v2.png; a new
// Powerwall drawing needs them measured again.
export const CHARGE_BAR: Record<"bottomLeft" | "topLeft" | "topRight" | "bottomRight", Point> = {
  bottomLeft: [1371.6, 626.1],
  topLeft: [1370.2, 571.9],
  topRight: [1373.1, 572.9],
  bottomRight: [1374.3, 627.2],
};

export const chargeBarPoints = (percent: number) => {
  const { bottomLeft, topLeft, topRight, bottomRight } = CHARGE_BAR;
  const up = ([bx, by]: Point, [tx, ty]: Point): Point => [bx + ((tx - bx) * percent) / 100, by + ((ty - by) * percent) / 100];
  return [bottomLeft, up(bottomLeft, topLeft), up(bottomRight, topRight), bottomRight];
};

// Bends are rounded to this radius, as in the app.
const BEND = 9;

// Lanes for extra sources into a destination: the leg moved straight down by
// this much per lane, so a lane is straight and its ends sit directly below the
// leg's. The home and Powerwall legs, the only ones with lanes, run at about 45
// degrees, so lines end up about 0.7 of this apart: a thin gap between them.
export const LANE_DROP = 11;

// The source whose leg runs straight on through the panel into a destination:
// the Powerwall and home legs are one line, so that flow keeps the main line.
export const STRAIGHT_THROUGH: Partial<Record<string, string>> = { home: "powerwall", powerwall: "home" };

// Each label sits beside its element. `align` says which edge of the text is at
// x; `valign` whether y is the label's top or bottom.
export type Label = { title?: string; x: number; y: number; align: "start" | "middle" | "end"; valign: "top" | "bottom" };
export const LABELS: Record<"solar" | "home" | "powerwall" | "grid" | "car", Label> = {
  solar: { title: "SOLAR", x: 1590, y: 215, align: "end", valign: "bottom" },
  home: { title: "HOME", x: 885, y: 520, align: "middle", valign: "top" },
  powerwall: { title: "POWERWALL", x: 1265, y: 745, align: "end", valign: "top" },
  grid: { title: "GRID", x: 1595, y: 655, align: "end", valign: "top" },
  // Just above the garage roof, as in the Tesla app, by its bottom edge so a
  // note line grows upward; below the garage would crowd POWERWALL on a phone.
  car: { x: 110, y: 315, align: "start", valign: "bottom" },
};

// Gradient colors, as in the app: solar yellow, Powerwall green, grid gray.
export const FLOW_COLORS: Record<"solar" | "powerwall" | "grid", string> = { solar: "#f7c948", powerwall: "#3ddc84", grid: "#b4bfcc" };

// Label type sizes in px on a phone, where they are smallest.
export const PHONE_TEXT = { title: 11, value: 14 };

// Approximate label box in px on a stage `stageWidth` px wide, for overlap checks.
export const labelBox = (label: Label, lines: [string, number][], stageWidth: number) => {
  const px = stageWidth / STAGE.width;
  const width = Math.max(...lines.map(([text, size]) => text.length * size * 0.58));
  const height = lines.reduce((sum, [, size]) => sum + size * 1.25, 0);
  const x = label.x * px;
  const left = label.align === "start" ? x : label.align === "end" ? x - width : x - width / 2;
  const top = label.valign === "top" ? label.y * px : label.y * px - height;
  return { left, right: left + width, top, bottom: top + height };
};

export const roundCorners = (points: Point[], radius = BEND) => {
  const out: Point[] = [points[0]];
  points.slice(1, -1).forEach(([x, y], i) => {
    const [px, py] = points[i];
    const [nx, ny] = points[i + 2];
    const r = Math.min(radius, Math.hypot(x - px, y - py) / 2, Math.hypot(nx - x, ny - y) / 2);
    const a = [x + ((px - x) * r) / Math.hypot(px - x, py - y), y + ((py - y) * r) / Math.hypot(px - x, py - y)];
    const b = [x + ((nx - x) * r) / Math.hypot(nx - x, ny - y), y + ((ny - y) * r) / Math.hypot(nx - x, ny - y)];
    for (let k = 0; k <= 6; k += 1) {
      const t = k / 6;
      out.push([
        (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * x + t ** 2 * b[0],
        (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * y + t ** 2 * b[1],
      ]);
    }
  });
  out.push(points[points.length - 1]);
  return out;
};

export const legPoints = (name: LegName, lane = 0) => roundCorners(LEGS[name].map(([x, y]): Point => [x, y + lane * LANE_DROP]));

export const pathLength = (points: Point[]) =>
  points.slice(1).reduce((sum, [x, y], i) => sum + Math.hypot(x - points[i][0], y - points[i][1]), 0);
