// A day's sky from its WMO weather code, as forecast or as it is now (solar-forecast spec, "The sky").
import { Cloud, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun } from "lucide-react";
import { expect, test } from "vitest";

import { skyOf } from "@/components/solar/sky";

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
