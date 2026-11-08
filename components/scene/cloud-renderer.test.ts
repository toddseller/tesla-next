// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/components/scene/cloudRenderer.test.js.
import { describe, test, expect } from "vitest";
import {BAKE, createCloudRenderer} from "@/components/scene/cloud-renderer";

// A stand-in canvas: only getContext and addEventListener are called before the renderer gives up.
const fakeCanvas = (getContext: (kind: string) => unknown) => ({ getContext, addEventListener: () => {} }) as unknown as HTMLCanvasElement;

describe("cloud renderer", () => {
  test("without WebGL2 there is no renderer", () => {
    const canvas = fakeCanvas((kind) => (kind === "webgl2" ? null : {}));
    expect(createCloudRenderer(canvas)).toBeNull();
  });
});

// Any other WebGL call does nothing; only the shader's compile result matters here.
const failingContext = () => new Proxy({ getShaderParameter: () => false, getShaderInfoLog: () => "ERROR: syntax", isContextLost: () => false }, {
  get: (target, name) => target[name as keyof typeof target] ?? (() => null),
});

test("a shader that fails to compile gives no renderer, so the scene shows no clouds rather than failing", () => {
  const gl = failingContext();
  const canvas = fakeCanvas((kind) => (kind === "webgl2" ? gl : null));
  expect(() => createCloudRenderer(canvas)).not.toThrow();
  expect(createCloudRenderer(canvas)).toBeNull();
});

// The drifting texture wraps once per scene width, so every noise in the bake must
// repeat a whole number of times across it: the scale across the scene and the
// period must be the same whole number. A period of 4.8 once showed as a seam.
const seamless = (source: string) => {
  const main = source.slice(source.indexOf("void main()"));
  const literal = (name: string) => Number(main.match(new RegExp(`float[^;]*\\b${name} = ([\\d.]+)`))?.[1] ?? name);
  // lowPer and midPer are uniforms the renderer rounds to whole numbers.
  const whole = (term: string) => /^(lowPer|midPer)$/.test(term) || Number.isInteger(literal(term));
  // A call's arguments, split at the commas outside any parentheses.
  const args = (from: number) => {
    const out = [""];
    for (let i = from, depth = 0; depth >= 0; i++) {
      const c = main[i];
      if (c === "(") depth++;
      if (c === ")") depth--;
      if (depth < 0) break;
      if (c === "," && depth === 0) out.push("");
      else out[out.length - 1] += c;
    }
    return out.map((a) => a.trim());
  };
  return [...main.matchAll(/\b(?:fbm|warped)\(/g)].map((m) => {
    const [first, period] = args(m.index + m[0].length);
    const scale = first.match(/(?:base|uv\.x)\s*\*\s*([\w.]+)/)?.[1];
    return { call: first, ok: scale === period && whole(period) };
  });
};

test("every noise in the bake repeats a whole number of times across the scene", () => {
  const calls = seamless(BAKE);
  expect(calls.length).toBeGreaterThanOrEqual(5);
  expect(calls.filter((c) => !c.ok)).toEqual([]);
});

test("the seam check catches a period that isn't whole", () => {
  expect(seamless(BAKE.replace("base * 5. + vec2(0., 47.), 5.", "base * 4.8 + vec2(0., 47.), 4.8")).some((c) => !c.ok)).toBe(true);
});
