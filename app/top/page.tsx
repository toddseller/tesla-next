import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SolarChart } from "./solar-chart";

const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const kwh = new Intl.NumberFormat("en", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default async function TopTen() {
  // Same order as the API's get_solar_top_ten, NULLs first included, so the two lists match row for row.
  const { rows } = await db.query<{ date: string; solar: number | null }>(
    "SELECT date, solar_generated AS solar FROM data ORDER BY solar_generated DESC LIMIT 10",
  );
  const days = rows.map((r) => ({ date: day.format(new Date(`${r.date}T00:00:00Z`)), solar: r.solar }));

  return (
    <main className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total Solar Generation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {days.map((d) => (
            <TableRow key={d.date}>
              <TableCell>{d.date}</TableCell>
              <TableCell className="text-right">{d.solar === null ? "" : `${kwh.format(d.solar)} kWh`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <SolarChart days={days} />
    </main>
  );
}
