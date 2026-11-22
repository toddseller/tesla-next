// What a term a newcomer won't know means, once, for every page that hints it. `term` is the words a page hints.
export const TERMS = {
  "true-up": {
    term: "True-Up",
    definition:
      "PG&E bills this house's grid energy once a year. Its twelve billing cycles of imports and exports are netted, and the balance is settled at the true-up. A true-up year runs from the October meter read, so '25 - '26 is October 2025 to September 2026.",
  },
  peak: {
    term: "Peak (4 to 9 p.m.)",
    definition: "PG&E's peak hours, every day, when importing energy costs the most and sending it earns the most.",
  },
  nem: {
    term: "NEM",
    definition:
      "Net Energy Metering: PG&E credits the energy the house sends against what it imports, at each hour's rate. These are the energy charges, before taxes and fixed fees.",
  },
  nem2: {
    term: "NEM2",
    definition: "NEM 2.0, the PG&E solar plan this house is on: energy sent to the grid earns about what the same energy costs to import at that time of day.",
  },
  nsc: {
    term: "Net Surplus Compensation",
    definition: "When a true-up year ends having sent more than it imported, PG&E pays for the surplus at a wholesale rate, well below what imports cost.",
  },
  vpp: {
    term: "VPP",
    definition:
      "Tesla's Virtual Power Plant: from May to October, Tesla sends the Powerwalls' energy to the grid during PG&E's peak events and pays $2 a kWh, apart from PG&E's bill.",
  },
  westlight: {
    term: "WestLight",
    definition: "WestLight Energy, Peninsula Clean Energy until 2026, supplies the house's electricity; PG&E delivers it and bills for both.",
  },
  "storm-watch": {
    term: "Storm watch",
    definition: "Before severe weather that could cut the power, the Powerwalls charge to full and hold it, so the house is ready for an outage.",
  },
} as const;

export type TermName = keyof typeof TERMS;
