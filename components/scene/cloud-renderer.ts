import type { cloudInputs } from "@/components/scene/cloud-inputs";
import {LAYERS, PRESETS} from "@/components/scene/cloud-looks";

// The clouds in WebGL2 (anton-tesla-api-ws's webgl-clouds design). A bake pass
// writes each look's cloud shapes into a texture, one channel per layer (cirrus,
// mid, low, dense), periodic across one scene width so the drift never shows a
// seam. It runs once per day's shapes and canvas size, never per frame and never
// for a change of weather. Each frame the draw pass only looks the shapes up.

const LOOKS = Object.keys(PRESETS).filter((name) => PRESETS[name].look);
const TEXTURE_WIDTH = 1024;

const VERTEX = `#version 300 es
in vec2 p;
out vec2 uv;
void main() { uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0, 1); }`;

export const BAKE = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 o;
uniform float seed, aspect, lowPer, midPer, warp, stretch;
vec2 h2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1. + 2. * fract(sin(p + seed * .6180339) * 43758.5453);
}
// Gradient noise periodic in x with period per, so one scene width tiles.
float gn(vec2 p, float per) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  float x0 = mod(i.x, per), x1 = mod(i.x + 1., per);
  return mix(mix(dot(h2(vec2(x0, i.y)), f), dot(h2(vec2(x1, i.y)), f - vec2(1, 0)), u.x),
             mix(dot(h2(vec2(x0, i.y + 1.)), f - vec2(0, 1)), dot(h2(vec2(x1, i.y + 1.)), f - vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p, float per, int oct) {
  float s = 0., a = .5;
  for (int k = 0; k < 7; k++) { if (k >= oct) break; s += a * gn(p, per); p = p * 2. + vec2(0., 17.3); per *= 2.; a *= .5; }
  return s;
}
float warped(vec2 p, float per, int oct, float w) {
  vec2 q = vec2(fbm(p, per, 4), fbm(p + vec2(per * .37, 5.2), per, 4));
  return fbm(p + w * q, per, oct);
}
void main() {
  vec2 base = vec2(uv.x, uv.y / aspect);
  float low = warped(base * lowPer + vec2(0., 3.), lowPer, 7, warp);
  float mid = warped(base * midPer + vec2(0., 11.), midPer, 6, warp * .7);
  // Cirrus: streaks long across the wind, kept in coarse patches; four octaves, as
  // finer ones stretched this far became one-pixel lines that read as scratches.
  float cirPer = 3.;
  float streak = fbm(vec2(uv.x * cirPer, uv.y / aspect * cirPer * stretch) + vec2(0., 31.), cirPer, 4);
  // A whole number of patches across the scene, like every noise here, or the wrap shows a seam.
  float patches = fbm(base * 5. + vec2(0., 47.), 5., 3);
  // The overcast deck: finer than the other layers' shapes, so a deck that covers the
  // whole sky still shows the structure its thickness shades.
  float dense = warped(base * 4. + vec2(0., 71.), 4., 7, .8);
  o = vec4(streak * .8 + patches * .9, mid, low, dense) * .9 + .5;
}`;

const DRAW = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 o;
uniform sampler2D dens0, dens1;
uniform float weight1, aspect, sky, horizon, deck;
// Each layer's drift, in scene widths: the bands drift at their own heights' winds.
uniform vec4 off;
uniform float shading, sunlight, coreDark, sunEdge, softness, march;
uniform vec4 share, opacity, thresh0, thresh1;
uniform vec2 light;
uniform vec3 color[4];
uniform vec3 ambient;
// Each layer's band, as shares of the sky above the eaves: high, mid, low, everywhere.
const vec2 BAND[4] = vec2[4](vec2(-9., .3), vec2(.3, .6), vec2(.6, 9.), vec2(-9., 9.));
// The brightest a cloud gets: never full white.
const float BRIGHTEST = .92;
// Under a deck, how far past covering the sky a cloud's thickness keeps growing: a deck
// covers everywhere, so without it the whole deck reads equally thick and shapeless.
const float DEPTH = .45;
float pick(vec4 d, int i) { return i == 0 ? d.r : i == 1 ? d.g : i == 2 ? d.b : d.a; }
float thickness(float a, float raw, float t) { return mix(a, smoothstep(t, t + softness + DEPTH, raw), deck); }
// How much cloud layer i has at a point, and how thick it is there: densest in its band,
// thinning with distance from it over half the sky, and spreading over the whole sky
// from 0.6 to 0.9 of its share.
vec2 layer(int i, vec2 at) {
  vec2 t = vec2(at.x - off[i], at.y);
  float y = at.y / sky;
  float fade = max(0., 1. - max(max(BAND[i].x - y, y - BAND[i].y), 0.) / .5);
  float reach = clamp((share[i] - .6) / .3, 0., 1.);
  float thin = .2 * (1. - (fade + (1. - fade) * reach));
  float raw0 = pick(texture(dens0, t), i), t0 = thresh0[i] + thin;
  float a0 = smoothstep(t0, t0 + softness, raw0);
  vec2 c = vec2(a0, thickness(a0, raw0, t0));
  if (weight1 > 0.) {
    float raw1 = pick(texture(dens1, t), i), t1 = thresh1[i] + thin;
    float a1 = smoothstep(t1, t1 + softness, raw1);
    c = mix(c, vec2(a1, thickness(a1, raw1, t1)), weight1);
  }
  return c * smoothstep(0., .04, share[i]);
}
void main() {
  vec4 acc = vec4(0.);
  vec2 toLight = (light - uv) * vec2(aspect, 1.);
  float dist = length(toLight);
  vec2 dir = toLight / max(dist, 1e-4);
  float near = exp(-dist * 3.5);
  // Under a deck the low sun's color reaches only its lower edge near the horizon and its
  // thin parts; elsewhere its light stays a dim neutral, as an overcast sky stays gray at sunset.
  float warmReach = smoothstep(horizon - .32, horizon - .04, uv.y);
  for (int i = 0; i < 4; i++) {
    vec2 here = layer(i, uv);
    float cover = here.x, d = here.y;
    if (cover <= .001) continue;
    // March toward the light through this layer: thick cloud in the way shades this point.
    float block = 0.;
    for (int k = 1; k <= 6; k++) block += layer(i, uv + dir * (march * float(k)) / vec2(aspect, 1.)).y;
    float lit = exp(-block * shading);
    vec3 neutral = vec3(dot(color[i], vec3(.3, .5, .2))) * .55;
    vec3 sun = mix(color[i], mix(neutral, color[i], warmReach * (.45 + .55 * (1. - d))), deck);
    vec3 c = min(ambient * (1. - coreDark * d) + sun * (lit * sunlight + near * (1. - d) * sunEdge), vec3(BRIGHTEST));
    float a = cover * opacity[i];
    acc = vec4(c * a, a) + acc * (1. - a);
  }
  o = acc;
}`;

// Each layer's band in the sky above the eaves, for calibrating its cover.
const BANDS = [[-9, 0.3], [0.3, 0.6], [0.6, 9], [-9, 9]];
const QUANTILES = 100;

// Per layer, the baked values inside its band at each percentile, so a share maps
// to the threshold that covers that share of the band.
const coverTables = (pixels: Uint8Array, width: number, height: number, sky: number) =>
  BANDS.map(([top, bottom], channel) => {
    const values: number[] = [];
    for (let row = 0; row < height; row += 2) {
      // Row 0 of the read-back is texture coordinate 0, which the draw samples at the frame's top.
      const y = (row + 0.5) / height / sky;
      if (y < 0 || y > 1 || y < top || y > bottom) continue;
      for (let col = 0; col < width; col += 2) values.push(pixels[(row * width + col) * 4 + channel] / 255);
    }
    values.sort((a, b) => a - b);
    return Float32Array.from({ length: QUANTILES + 1 }, (_, k) => values[Math.min(values.length - 1, Math.floor((k / QUANTILES) * (values.length - 1)))] ?? 1);
  });

const thresholdFor = (table: Float32Array, share: number, softness: number) => {
  const k = Math.min(QUANTILES, Math.max(0, (1 - share) * QUANTILES));
  const i = Math.floor(k), f = k - i;
  const value = table[i] + ((table[Math.min(QUANTILES, i + 1)] ?? table[i]) - table[i]) * f;
  return value - softness / 2;
};

type Compiled = { program: WebGLProgram; locate: (name: string) => WebGLUniformLocation | null };

export const createCloudRenderer = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true });
  if (!gl) return null;

  let programs: { bake: Compiled; draw: Compiled };
  let textures: Record<string, WebGLTexture> = {};
  let tables: Record<string, Float32Array[]> = {};
  let baked: { seed: number; sky: number } | null = null;
  let lost = false;

  const compile = (fragment: string): Compiled => {
    const program = gl.createProgram();
    for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, fragment]] as [number, string][]) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(gl.getShaderInfoLog(shader) as string);
      gl.attachShader(program, shader);
    }
    gl.bindAttribLocation(program, 0, "p");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(gl.getProgramInfoLog(program) as string);
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const locate = (name: string) => (uniforms[name] ??= gl.getUniformLocation(program, name));
    return { program, locate };
  };

  const setup = () => {
    programs = { bake: compile(BAKE), draw: compile(DRAW) };
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    textures = {};
    tables = {};
  };

  const bakeLook = (name: string, seed: number, aspect: number, sky: number, width: number, height: number) => {
    const look = PRESETS[name].look!;
    const texture = textures[name] ?? gl.createTexture();
    textures[name] = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, width, height);
    const { program, locate } = programs.bake;
    gl.useProgram(program);
    gl.uniform1f(locate("seed"), seed % 1000);
    gl.uniform1f(locate("aspect"), aspect);
    // The noise repeats a whole number of times across the scene, or the drift would show a seam.
    gl.uniform1f(locate("lowPer"), Math.round(look.lowScale));
    gl.uniform1f(locate("midPer"), Math.round(look.midScale));
    gl.uniform1f(locate("warp"), look.warp);
    gl.uniform1f(locate("stretch"), look.cirrusStretch);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
    tables[name] = coverTables(pixels, width, height, sky);
  };

  const bake = (seed: number, sky: number) => {
    baked = { seed, sky };
    if (lost) return;
    const aspect = canvas.width / canvas.height;
    const height = Math.max(1, Math.round(TEXTURE_WIDTH / aspect));
    for (const name of LOOKS) bakeLook(name, seed, aspect, sky, TEXTURE_WIDTH, height);
  };

  const draw = (inputs: ReturnType<typeof cloudInputs>, offsets: number[]) => {
    if (lost || !baked) return;
    const { weights, look, shares, opacity, light } = inputs;
    const [first, second] = weights;
    const { program, locate } = programs.draw;
    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[first.name]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures[(second ?? first).name]);
    gl.uniform1i(locate("dens0"), 0);
    gl.uniform1i(locate("dens1"), 1);
    gl.uniform1f(locate("weight1"), second?.weight ?? 0);
    const thresholds = (name: string) => LAYERS.map((layer, i) => thresholdFor(tables[name][i], shares[layer], look.softness));
    gl.uniform4fv(locate("thresh0"), thresholds(first.name));
    gl.uniform4fv(locate("thresh1"), thresholds((second ?? first).name));
    gl.uniform4fv(locate("share"), LAYERS.map((layer) => shares[layer]));
    gl.uniform4fv(locate("opacity"), LAYERS.map((layer) => opacity[layer]));
    for (const key of ["shading", "sunlight", "coreDark", "sunEdge", "softness", "march"] as const) gl.uniform1f(locate(key), look[key]);
    gl.uniform4fv(locate("off"), offsets);
    gl.uniform1f(locate("aspect"), canvas.width / canvas.height);
    gl.uniform1f(locate("sky"), light.sky);
    gl.uniform1f(locate("horizon"), light.horizon);
    gl.uniform1f(locate("deck"), light.deck);
    gl.uniform2fv(locate("light"), light.position);
    gl.uniform3fv(locate("color"), LAYERS.flatMap((layer) => light.color[layer]));
    gl.uniform3fv(locate("ambient"), light.ambient);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // The browser can drop the context (a GPU reset, too many contexts); preventing
  // the default asks it to restore it, and then everything is rebuilt and re-baked.
  const onLost = (event: Event) => { event.preventDefault(); lost = true; };
  const onRestored = () => {
    lost = false;
    setup();
    if (baked) bake(baked.seed, baked.sky);
  };
  // A driver that rejects the shaders leaves the scene without clouds, as a browser
  // without WebGL2 does; the app has no error boundary, so a throw would blank the page.
  try {
    setup();
  } catch {
    return null;
  }
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  return {
    bake,
    draw,
    dispose: () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    },
  };
};

export type CloudRenderer = NonNullable<ReturnType<typeof createCloudRenderer>>;
