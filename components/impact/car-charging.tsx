import type { CSSProperties } from "react";

import { Legend, Ring, sourceShares } from "@/components/impact/sections";
import type { CarCharging } from "@/lib/car-charging";
import { datesLabel, type Range } from "@/lib/solar/ranges";

const kwh = (value: number) => value.toLocaleString("en-US");
const day = (date: string, month: "long" | "short") => datesLabel({ start: date, end: date }, month);

function Message({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

export function CarChargingSection({ charging, range }: { charging: CarCharging; range: Range }) {
  const shares = sourceShares(charging.solar_percentage, charging.powerwall_percentage, charging.grid_percentage);
  const before = charging.since !== null && range.end < charging.since;
  return (
    <section aria-labelledby="car-charging" className="flex flex-col gap-5 rounded-[10px] border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 id="car-charging" className="text-sm font-medium tracking-[0.06em] text-muted-foreground uppercase">Home car charging</h2>
          <p className="text-sm text-muted-foreground">Wall Connector charging met by solar and Powerwall</p>
        </div>
        {charging.since && !before && <span className="text-[13px] text-muted-foreground">Since {day(charging.since, "short")}, the oldest charging Tesla kept</span>}
      </div>
      {before ? (
        <Message text={`No charging data before ${day(charging.since!, "short")}`} />
      ) : charging.total_kwh === 0 ? (
        <div className="flex flex-wrap items-center gap-8">
          <Ring name="Car charging" shares={shares} middle={0} caption="off the grid" />
          <Message text={`No home charging ${range.start === range.end ? "on" : "in"} ${datesLabel(range, "long")}`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-wrap items-center gap-8">
            <Ring name="Car charging" shares={shares} middle={charging.off_grid_percentage} caption="off the grid" />
            <div className="flex flex-col gap-3.5">
              <p className="flex items-baseline gap-2">
                <span className="font-mono text-[28px] font-semibold">{kwh(charging.total_kwh)}</span>
                <span className="text-muted-foreground">kWh into the cars</span>
              </p>
              <Legend shares={shares} />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {charging.cars.length > 0 && (
              <p className="text-[13px] text-muted-foreground">{charging.cars_since ? `By car, measured from ${day(charging.cars_since, "short")}` : "By car"}</p>
            )}
            {charging.cars.map((car, i) => {
              const split = sourceShares(car.solar_percentage, car.powerwall_percentage, car.grid_percentage);
              return (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between gap-3 text-sm">
                    <span>{car.name}</span>
                    <span className="font-mono">{kwh(car.kwh)} kWh</span>
                  </div>
                  <div role="img" aria-label={`${car.name}: ${split.map(({ label, share }) => `${share}% ${label}`).join(", ")}`}
                    className="motion-uncover flex h-3 gap-0.5 overflow-hidden rounded" style={{ "--i": i } as CSSProperties}>
                    {split.map(({ key, share, fill }) => share > 0 && <span key={key} className={fill} style={{ width: `${share}%` }} />)}
                  </div>
                </div>
              );
            })}
            <p className="text-[13px] text-muted-foreground">
              Home charging only: the Wall Connector&apos;s charging, split by where the home&apos;s power came from in each 5 minutes.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
