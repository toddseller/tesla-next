// Now in a sentence (home-story spec, "Now in a sentence").
import { expect, test } from "vitest";

import type { Vehicle } from "@/lib/scene/live-scene";

import { balance } from "./balance";
import { nowSentence } from "./now-sentence";

// Site time is PST in November; sunset on November 21 is about 4:52 PM.
const EVENING = new Date("2026-11-22T01:24:00Z");
const DAWN = new Date("2026-11-21T13:00:00Z");
const NOON = new Date("2026-11-21T20:00:00Z");
type Input = Parameters<typeof balance>[0] & { homePower: number; vehicle: Vehicle | null };
const live = (over: Partial<Input> = {}): Input => ({ solarPower: 0, homePower: 0, batteryPower: 0, gridPower: 0, vehicle: null, ...over });
// A figure and its unit never split across lines, so the sentence joins them with a no-break space.
const nb = (text: string) => text.replace(/ (kW|%)/g, "\u00a0$1");
const sentence = (input: ReturnType<typeof live>, battery: number | undefined, now: Date) => nowSentence(balance(input), { battery, vehicle: input.vehicle }, now);

test("after sunset, all from the grid, the Powerwalls idle and the car not charging", () => {
  const input = live({ homePower: 1, gridPower: 1, vehicle: { name: "Tesla", charging_power: 0, battery_level: 50 } });
  expect(sentence(input, 100, EVENING)).toBe("The grid supplies the house; solar is at 0 after sunset. The Powerwalls are idle at 100%, and the car is at 50%.");
});

test("midday, solar charging the Powerwalls and the car", () => {
  const input = live({ homePower: 1.1, solarPower: 9.3, batteryPower: -3.1, vehicle: { name: "Tesla", charging_power: 5.1, battery_level: 62 } });
  expect(sentence(input, 86, NOON)).toBe(nb("Solar supplies the house. The Powerwalls are charging at 3.1 kW, 86% full, and the car is charging at 5.1 kW."));
});

test("the house's supply largest first; the Powerwalls supplying; no car when the status has none", () => {
  expect(sentence(live({ homePower: 2, solarPower: 0.4, batteryPower: 1.6 }), 64, NOON)).toBe(nb("The Powerwalls and solar supply the house. The Powerwalls are supplying 1.6 kW, 64% full."));
  expect(sentence(live({ homePower: 2.4, gridPower: 2.4 }), 20, DAWN)).toBe("The grid supplies the house; solar is at 0 before sunrise. The Powerwalls are idle at 20%.");
});

// The scene shows the export only as a moving wire, so the sentence says it.
test("sending to PG&E joins the first clause; drawing from it doesn't add one", () => {
  expect(sentence(live({ homePower: 0.8, solarPower: 2.0, gridPower: -1.2 }), 100, NOON)).toBe(nb("Solar supplies the house and sends 1.2 kW to PG&E. The Powerwalls are idle at 100%."));
  expect(sentence(live({ homePower: 1.0, solarPower: 0.7, gridPower: 0.3 }), 100, NOON)).toBe("Solar and the grid supply the house. The Powerwalls are idle at 100%.");
  expect(sentence(live({ homePower: 1.0, solarPower: 1.03, gridPower: -0.03 }), 100, NOON)).toBe("Solar supplies the house. The Powerwalls are idle at 100%.");
});

// "The Powerwalls" is plural, so both verbs agree with it, as on a VPP evening.
test("the Powerwalls alone supply the house and send the rest to PG&E", () => {
  expect(sentence(live({ homePower: 1.0, batteryPower: 6.0, gridPower: -5.0 }), 80, EVENING)).toBe(nb("The Powerwalls supply the house and send 5.0 kW to PG&E; solar is at 0 after sunset. The Powerwalls are supplying 6.0 kW, 80% full."));
});

// Meter noise can read a little export with nothing counted as supplying; "Nothing ... sends" would contradict itself.
test("no export clause when nothing supplies the house", () => {
  expect(sentence(live({ homePower: 0, gridPower: -0.06 }), 100, EVENING)).toBe("Nothing supplies the house; solar is at 0 after sunset. The Powerwalls are idle at 100%.");
});
