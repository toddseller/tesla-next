// What the bill form's sums are checked against, shared by the save (lib/admin/statement.ts) and the form's live sums,
// so the form never marks a sum the save would take or misses one it would refuse. No database here: the form imports it.

export const FIGURES = ["peak_kwh", "off_peak_kwh", "net_kwh", "nem_charges", "minimum_delivery"] as const;
export type Figure = (typeof FIGURES)[number];

// As typed, so a refused table comes back exactly as it was.
export type Total = Record<Figure, string>;
export type Row = Total & { end_date: string };

export const NAMES: Record<Figure, string> = {
  peak_kwh: "peak kWh", off_peak_kwh: "off-peak kWh", net_kwh: "net kWh", nem_charges: "NEM charges", minimum_delivery: "minimum delivery",
};

// PG&E prints whole kWh: a cycle's peak and off-peak may round to a kWh off its net.
export const KWH_TOLERANCE = 1;
const CENT = 0.01;

// The sums a save checks against the TOTAL row, each allowed its tolerance once per row added. A monthly bill prints
// no minimum delivery, so it has no such sum.
export const CHECKED: [Figure, string, number][] = [
  ["nem_charges", "NEM charges", CENT], ["minimum_delivery", "minimum delivery charges", CENT], ["net_kwh", "net kWh", KWH_TOLERANCE],
];

export const isBlank = (value: string) => value.trim() === "";

export const sumMisses = (added: number, total: number, rows: number, tolerance: number) => Math.abs(added - total) > tolerance * rows + 1e-9;

// What the typed rows add up to so far: a figure that isn't a number yet counts as nothing.
export const addUp = (rows: Row[], figure: Figure) => rows.reduce((sum, row) => sum + (Number(row[figure]) || 0), 0);

// A sum as the bill prints it: dollars to the cent, kWh as they come.
export const shown = (figure: Figure, value: number) =>
  figure === "nem_charges" || figure === "minimum_delivery" ? value.toFixed(2) : String(Number(value.toFixed(3)));

type Stored = { end_read: string; net_peak_kwh: number; net_off_peak_kwh: number; net_kwh: number; nem_charges: number; minimum_delivery: number };

// A year's stored cycles as the form's rows, to correct and save again: each read as MM/DD/YYYY, which the save takes
// as a meter read, and the TOTAL as the rows' sums. Minimum delivery only with the year's statement, as PG&E prints
// it only there; a monthly bill's was worked out, not typed.
export function loaded(cycles: Stored[], withMinimum: boolean): { rows: Row[]; total: Total } {
  const rows = cycles.map((cycle) => {
    const [year, month, day] = cycle.end_read.split("-");
    return {
      end_date: `${month}/${day}/${year}`, peak_kwh: String(cycle.net_peak_kwh), off_peak_kwh: String(cycle.net_off_peak_kwh),
      net_kwh: String(cycle.net_kwh), nem_charges: String(cycle.nem_charges), minimum_delivery: withMinimum ? String(cycle.minimum_delivery) : "",
    };
  });
  const total = Object.fromEntries(FIGURES.map((figure) =>
    [figure, figure === "minimum_delivery" && !withMinimum ? "" : shown(figure, addUp(rows, figure))])) as Total;
  return { rows, total };
}

// The form's rows and TOTAL as posted: always 12 rows, blank where nothing was typed.
export function fromForm(form: FormData): { rows: Row[]; total: Total } {
  const column = (name: string) => form.getAll(name).map(String);
  const figures = Object.fromEntries(FIGURES.map((figure) => [figure, column(figure)]));
  const rows = column("end_date").map((end_date, i) => ({ end_date, ...Object.fromEntries(FIGURES.map((figure) => [figure, figures[figure][i] ?? ""])) }) as Row);
  const total = Object.fromEntries(FIGURES.map((figure) => [figure, String(form.get(`total_${figure}`) ?? "")])) as Total;
  return { rows, total };
}

// The rows a save reads: rows left wholly blank are left out.
export const filled = (rows: Row[]) => rows.filter((row) => ![row.end_date, ...FIGURES.map((figure) => row[figure])].every(isBlank));

// A monthly bill: minimum delivery blank throughout, the TOTAL's included.
export const isMonthly = (rows: Row[], total: Total) => [...rows, total].every((row) => isBlank(row.minimum_delivery));

// Whether a sum misses the typed TOTAL by more than a save allows; never where a save doesn't check it.
export function misses(rows: Row[], total: Total, figure: Figure) {
  const typed = filled(rows);
  const tolerance = CHECKED.find(([checked]) => checked === figure)?.[2];
  const typedTotal = Number(total[figure]);
  if (tolerance == null || isBlank(total[figure]) || !Number.isFinite(typedTotal) || (figure === "minimum_delivery" && isMonthly(typed, total))) return false;
  return sumMisses(addUp(typed, figure), typedTotal, typed.length, tolerance);
}
