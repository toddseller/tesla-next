// A day's sky from its WMO weather code, as forecast or as it is now (solar-forecast spec, "The sky").
import { Cloud, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun } from "lucide-react";
import { expect, test } from "vitest";

import { outsideSky, skyOf } from "@/components/solar/sky";

test.each([
  [[0], "Sunny", Sun],
  [[1, 2], "Partly cloudy", CloudSun],
  [[3, 4, 99_9], "Cloudy", Cloud],
  [[45, 48], "Fog likely", CloudFog],
  [[51, 61, 67, 80, 82], "Rain", CloudRain],
  [[71, 77, 85, 86], "Snow", CloudSnow],
  [[95, 96, 99], "Thunderstorms", CloudLightning],
])("codes %j read %s", (codes, label, icon) => {
  for (const code of codes) expect(skyOf(code)).toEqual({ label, icon });
});

test.each([
  [0, "now", "Sunny now", Sun],
  [45, "now", "Fog now", CloudFog],
  [3, "now", "Cloudy now", Cloud],
  [0, "night", "Clear now", Moon],
  [2, "night", "Partly cloudy now", CloudMoon],
  [61, "night", "Rain now", CloudRain],
] as const)("code %d %s reads %s", (code, when, label, icon) => {
  expect(skyOf(code, when)).toEqual({ label, icon });
});

// The Outside band's word: as the Today tile says it, without "now", and fog only as the scene draws it (scene-weather spec).
const morning = new Date("2026-11-27T10:19:00-08:00");
const night = new Date("2026-11-27T21:40:00-08:00");

test.each([
  ["an overcast morning", { code: 3, cover: 0.85 }, morning, "Cloudy", Cloud],
  ["a clear night", { code: 0, cover: 0 }, night, "Clear", Moon],
  ["fog without the airport's report", { code: 45, cover: 1, low: 1 }, morning, "Fog", CloudFog],
  ["fog the airport sees", { code: 48, cover: 0.9, low: 1 }, morning, "Fog", CloudFog],
  ["fog the airport doesn't see", { code: 45, cover: 0.2, low: 0.19 }, morning, "Sunny", Sun],
  ["fog the airport half sees", { code: 45, cover: 0.5, low: 0.5 }, morning, "Partly cloudy", CloudSun],
  ["fog with no cover, which the scene draws clear", { code: 45 }, morning, "Sunny", Sun],
])("%s", (_, weather, at, label, icon) => {
  expect(outsideSky(weather, at)).toEqual({ label, icon });
});

test("no code, no word", () => {
  expect(outsideSky({ cover: 0.4 }, morning)).toBeNull();
});
