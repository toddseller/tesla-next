// PG&E's statements as anton-tesla-api-ws's tests type them (test/fixtures), read into the admin form's rows.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Row, Total } from "@/lib/admin/sums";

export const fixture = (year: number) => readFileSync(join(__dirname, `fixtures/true-up-${year}.csv`), "utf8");

// A typed table as the form sends it: its cycle rows, blank minimum delivery where the table has none, and its TOTAL.
export const table = (text: string): [Row[], Total] => {
  const [header, ...lines] = text.trim().split("\n");
  const columns = header.split(",");
  const rows = lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(["end_date", "peak_kwh", "off_peak_kwh", "net_kwh", "nem_charges", "minimum_delivery"]
      .map((column) => [column, values[columns.indexOf(column)] ?? ""])) as Row;
  });
  const { end_date: _, ...total } = rows.find((row) => row.end_date === "TOTAL")!;
  return [rows.filter((row) => row.end_date !== "TOTAL"), total];
};

export const monthly = (rows: string[], total: string) =>
  table(`end_date,peak_kwh,off_peak_kwh,net_kwh,nem_charges\n${rows.join("\n")}\nTOTAL,${total}`);
