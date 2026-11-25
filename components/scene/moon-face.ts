import { useEffect, useState } from "react";

export const MOON_MAP = "/scene/moon-map.webp";
// May's face and its window lights (the scene-weather spec), laid out like the moon's map.
export const DEATH_STAR_MAP = "/scene/death-star-map.webp";
export const DEATH_STAR_LIGHTS = "/scene/death-star-map-lights.webp";

const RAD = Math.PI / 180;

// The map is surface brightness alone, darker than the sunlit full moon the
// scene showed before, so its face is lifted to match.
export const BRIGHTNESS = 1.25;

// The moon's face, `size` pixels square (RGBA, transparent outside the disc),
// seen straight on from Earth with the point at `longitude` and `latitude`
// (degrees, its libration) at the center: north up and east on the right, as
// in NASA's views. `map` is the whole moon as RGBA pixels, longitude -180 to
// 180 across and north at the top.
export const projectMoon = (map: Pick<ImageData, "data" | "width" | "height">, longitude: number, latitude: number, size: number) => {
  const [sl, cl, sb, cb] = [Math.sin(longitude * RAD), Math.cos(longitude * RAD), Math.sin(latitude * RAD), Math.cos(latitude * RAD)];
  const face = new Uint8ClampedArray(size * size * 4);
  for (let j = 0; j < size; j += 1) {
    const y = 1 - ((j + 0.5) / size) * 2;
    for (let i = 0; i < size; i += 1) {
      const x = ((i + 0.5) / size) * 2 - 1;
      const zz = 1 - x * x - y * y;
      if (zz < 0) continue;
      const z = Math.sqrt(zz);
      const px = -x * sl - y * sb * cl + z * cb * cl;
      const py = x * cl - y * sb * sl + z * cb * sl;
      const pz = y * cb + z * sb;
      const u = Math.floor((Math.atan2(py, px) / (2 * Math.PI) + 0.5) * map.width) % map.width;
      const v = Math.min(map.height - 1, Math.floor((0.5 - Math.asin(Math.min(1, pz)) / Math.PI) * map.height));
      const [from, to] = [(v * map.width + u) * 4, (j * size + i) * 4];
      for (let c = 0; c < 3; c += 1) face[to + c] = map.data[from + c] * BRIGHTNESS;
      face[to + 3] = 255;
    }
  }
  return face;
};

// Each map's pixels, read once through a canvas; after a failed load the next redraw tries again.
const mapPixels = new Map<string, Promise<ImageData>>();
const loadMap = (src: string) => mapPixels.get(src) ?? mapPixels.set(src, new Promise<ImageData>((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const canvas = Object.assign(document.createElement("canvas"), { width: image.width, height: image.height });
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    resolve(context.getImageData(0, 0, image.width, image.height));
  };
  image.onerror = (error) => {
    mapPixels.delete(src);
    reject(error);
  };
  image.src = src;
})).get(src)!;

// About twice the disc's device pixels on a 2x screen.
const FACE_SIZE = 256;
// Libration drifts about a degree a day, so the face redraws a few times a day,
// and in fast replay no more than once per step.
const STEP = 0.2;

// The face drawn from `map` for the libration as a data URL, or null until the map has loaded
// (or with no map); the last face stays up while the next is drawn.
export const useMoonFace = (longitude: number, latitude: number, map: string | null) => {
  const [l, b] = [Math.round(longitude / STEP) * STEP, Math.round(latitude / STEP) * STEP];
  const [face, setFace] = useState<string | null>(null);
  useEffect(() => {
    if (!map) return;
    let current = true;
    loadMap(map).then((pixels) => {
      if (!current) return;
      const canvas = Object.assign(document.createElement("canvas"), { width: FACE_SIZE, height: FACE_SIZE });
      canvas.getContext("2d")!.putImageData(new ImageData(projectMoon(pixels, l, b, FACE_SIZE), FACE_SIZE), 0, 0);
      setFace(canvas.toDataURL());
    }).catch(() => {});
    return () => { current = false; };
  }, [l, b, map]);
  return map ? face : null;
};

// The Death Star's lit part is shaded as a matte sphere (the scene-weather spec), the real moon isn't.
// Black, its alpha up to 0.8 where a matte surface gets no light; 1.15 lets the middle stay clear.
// Lit from the right, as the phase mask is, the sun `phase` of a turn from the viewer either way. Matte light leaves a
// crescent nearly dark, so the shading weakens as less of the disc is lit, reaching full strength by half.
export const sphereShade = (phase: number, size: number) => {
  const away = Math.PI * Math.abs(1 - 2 * phase);
  const [toSide, toViewer] = [Math.sin(away), Math.cos(away)];
  const strength = 0.8 * Math.min(1, 1 - Math.cos(2 * Math.PI * phase));
  const shade = new Uint8ClampedArray(size * size * 4);
  for (let j = 0; j < size; j += 1) {
    const y = 1 - ((j + 0.5) / size) * 2;
    for (let i = 0; i < size; i += 1) {
      const x = ((i + 0.5) / size) * 2 - 1;
      const zz = 1 - x * x - y * y;
      if (zz < 0) continue;
      const light = Math.max(0, x * toSide + Math.sqrt(zz) * toViewer);
      shade[(j * size + i) * 4 + 3] = 255 * strength * (1 - Math.min(1, 1.15 * light));
    }
  }
  return shade;
};

const SHADE_SIZE = 128;
// The phase moves about 0.034 a day, so the shading redraws a few times a day.
const PHASE_STEP = 0.005;

// The shading as a data URL while `on`, else null.
export const useSphereShade = (phase: number, on: boolean) => {
  const step = Math.round(phase / PHASE_STEP) * PHASE_STEP;
  const [shade, setShade] = useState<string | null>(null);
  useEffect(() => {
    if (!on) return;
    const canvas = Object.assign(document.createElement("canvas"), { width: SHADE_SIZE, height: SHADE_SIZE });
    canvas.getContext("2d")!.putImageData(new ImageData(sphereShade(step, SHADE_SIZE), SHADE_SIZE), 0, 0);
    setShade(canvas.toDataURL());
  }, [step, on]);
  return on ? shade : null;
};
