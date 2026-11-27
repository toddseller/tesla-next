// @vitest-environment jsdom
// scene-weather, "The Outside band": the moment the scene shows, in words and figures.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { UnitsProvider } from "@/components/units";
import { Outside } from "./outside";

afterEach(cleanup);

const MORNING = Date.parse("2026-11-27T10:19:00-08:00");
const CLOUDY = { temperature: 16.7, code: 3, cover: 0.85, windSpeed: 2, windGusts: 9, windDirection: 254 };
const band = () => screen.getByRole("region", { name: /^Outside/ }).textContent;

test("live, a cloudy and calm morning in °F and mph", () => {
  render(<Outside weather={CLOUDY} at={MORNING} replay={false} />);
  expect(band()).toBe("Outside now62°FCloudy·CalmSunrise 7:03 AM·Sunset 4:54 PM");
});

test("the same reading in °C and km/h", () => {
  render(<UnitsProvider value={{ temperature: "C", wind: "km/h" }}><Outside weather={CLOUDY} at={MORNING} replay={false} /></UnitsProvider>);
  expect(band()).toContain("17°C");
  expect(band()).toContain("Calm");
});

test("in replay, the storm at noon on 2024-02-04 and that day's sun", () => {
  const storm = { temperature: 13.4, code: 3, cover: 1, windSpeed: 42, windGusts: 86, windDirection: 168 };
  render(<Outside weather={storm} at={Date.parse("2024-02-04T12:00:00-08:00")} replay />);
  expect(band()).toBe("Outside at 12:00 PM56°FCloudy·26 mph, gusts 53 mph, from SSunrise 7:12 AM·Sunset 5:37 PM");
});

test("without a reading, only the sun", () => {
  render(<Outside weather={{}} at={MORNING} replay={false} />);
  expect(band()).toBe("Outside nowSunrise 7:03 AM·Sunset 4:54 PM");
});

test("with wind but no temperature or code, the wind and the sun", () => {
  render(<Outside weather={{ cover: 0.4, windSpeed: 29, windDirection: 225 }} at={MORNING} replay={false} />);
  expect(band()).toBe("Outside now18 mph from SWSunrise 7:03 AM·Sunset 4:54 PM");
});
