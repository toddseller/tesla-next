import { useEffect, useState } from "react";

const moonMap = "/scene/moon-map.webp";

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

// The map's pixels, read once through a canvas; after a failed load the next redraw tries again.
let mapPixels: Promise<ImageData> | undefined;
const loadMap = () => mapPixels ??= new Promise<ImageData>((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const canvas = Object.assign(document.createElement("canvas"), { width: image.width, height: image.height });
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    resolve(context.getImageData(0, 0, image.width, image.height));
  };
  image.onerror = (error) => {
    mapPixels = undefined;
    reject(error);
  };
  image.src = moonMap;
});

// About twice the disc's device pixels on a 2x screen.
const FACE_SIZE = 256;
// Libration drifts about a degree a day, so the face redraws a few times a day,
// and in fast replay no more than once per step.
const STEP = 0.2;

// The face for the libration as a data URL, or null until the map has loaded;
// the last face stays up while the next is drawn.
export const useMoonFace = (longitude: number, latitude: number) => {
  const [l, b] = [Math.round(longitude / STEP) * STEP, Math.round(latitude / STEP) * STEP];
  const [face, setFace] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    loadMap().then((map) => {
      if (!current) return;
      const canvas = Object.assign(document.createElement("canvas"), { width: FACE_SIZE, height: FACE_SIZE });
      canvas.getContext("2d")!.putImageData(new ImageData(projectMoon(map, l, b, FACE_SIZE), FACE_SIZE), 0, 0);
      setFace(canvas.toDataURL());
    }).catch(() => {});
    return () => { current = false; };
  }, [l, b]);
  return face;
};
