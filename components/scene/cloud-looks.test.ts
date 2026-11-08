// Ported from anton-tesla-api-ws tesla-api-frontend/client/src/components/scene/cloudLooks.test.js.
import { describe, test, expect } from "vitest";
import {CUTOFF, LOOK_KEYS, PRESETS, SUNSET_RAMP} from "@/components/scene/cloud-looks";

describe("cloud looks", () => {
  test("every preset but sunny has every look key", () => {
    for (const [name, preset] of Object.entries(PRESETS)) {
      if (name === "sunny") expect(preset.look).toBeNull();
      else expect(Object.keys(preset.look!).sort()).toEqual([...LOOK_KEYS].sort());
    }
  });

  test("each anchor's shares and rain are between 0 and 1", () => {
    for (const { weather } of Object.values(PRESETS)) {
      for (const key of ["low", "mid", "cirrus", "rain"] as const) {
        expect(weather[key]).toBeGreaterThanOrEqual(0);
        expect(weather[key]).toBeLessThanOrEqual(1);
      }
    }
  });

  test("sunny is no cloud", () => {
    expect(PRESETS.sunny.weather).toEqual({ low: 0, mid: 0, cirrus: 0, rain: 0 });
  });

  test("the sunset ramp runs from high to low, and the layers lose the light from low to high", () => {
    const altitudes = SUNSET_RAMP.map(([altitude]) => altitude);
    expect(altitudes).toEqual([...altitudes].sort((a, b) => b - a));
    expect(CUTOFF.low).toBeGreaterThan(CUTOFF.mid);
    expect(CUTOFF.mid).toBeGreaterThan(CUTOFF.cirrus);
  });
});
