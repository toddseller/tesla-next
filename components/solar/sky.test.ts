// A forecast day's sky from its WMO weather code (solar-forecast spec, "The sky").
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from "lucide-react";
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
