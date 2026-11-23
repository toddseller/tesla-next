import { impactFigures } from "@/lib/impact";
import { type Cycle, startedCycles } from "@/lib/true-up/text";

// Solar's share of the house's use over the started billing cycles' own days, the days the true-up net beside it counts;
// null before any house use is saved, which would otherwise read as 0%.
export async function cyclesShare(rows: Pick<Cycle, "first_day" | "through" | "net">[]) {
  const started = startedCycles(rows);
  if (!started.length) return null;
  const figures = await impactFigures(started[0].first_day, started.at(-1)!.through, "corrected");
  return figures.total_house ? figures.total_solar_percentage : null;
}
