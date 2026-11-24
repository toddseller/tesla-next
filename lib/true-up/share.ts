import { impactFigures } from "@/lib/impact";
import { FIRST_DAY } from "@/lib/scene/replay";
import { type Cycle, startedCycles } from "@/lib/true-up/text";

// Solar's share of the house's use over the started billing cycles' own days, the days the true-up net beside it counts,
// with those days, from no earlier than the first day of data; null before any house use is saved, which would otherwise
// read as 0%.
export async function cyclesShare(rows: Pick<Cycle, "first_day" | "through" | "net">[]) {
  const started = startedCycles(rows);
  if (!started.length) return null;
  const [start, end] = [started[0].first_day < FIRST_DAY ? FIRST_DAY : started[0].first_day, started.at(-1)!.through];
  const figures = await impactFigures(start, end, "corrected");
  return figures.total_house ? { share: figures.total_solar_percentage, start, end } : null;
}
