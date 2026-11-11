// Tesla's grid readings were about half of PG&E's meter until a service visit on METER_FIX_DATE. Days before it with
// a PG&E reading are corrected from the meter; PG&E's readings reach back only to FIRST_METER_DAY, and earlier days
// stay as Tesla reported them.
export const FIRST_METER_DAY = "2023-10-06";
export const METER_FIX_DATE = "2026-04-27";

// "tesla" shows Tesla's figures as stored; the site corrects by default.
export type Readings = "corrected" | "tesla";

// The address's `readings` value, from a page's search params or a route's.
export const readingsOf = (value: string | string[] | null | undefined): Readings => (value === "tesla" ? "tesla" : "corrected");

// Whether days from `start` to `end` include a corrected one, so the choice of readings changes anything.
export const reachesCorrected = (start: string, end: string) => start < METER_FIX_DATE && end >= FIRST_METER_DAY;

// An address in the given view: Tesla's readings add `readings=tesla`, the corrected default adds nothing.
export const withReadings = (address: string, readings: Readings) =>
  readings === "tesla" ? `${address}${address.includes("?") ? "&" : "?"}readings=tesla` : address;
