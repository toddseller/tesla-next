import type { ImpactFigures } from "@/lib/impact";

const energy = (kwh: number) => (kwh >= 1000 ? `${(kwh / 1000).toFixed(1)} MWh` : `${kwh.toFixed(1)} kWh`);

function Title({ id, title, explanation }: { id: string; title: string; explanation: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 id={id} className="text-sm font-medium tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
      <p className="text-sm text-muted-foreground">{explanation}</p>
    </div>
  );
}

export function SelfPowered({ figures }: { figures: ImpactFigures }) {
  const shares = [
    { key: "solar", label: "Solar", share: figures.from_solar_percentage, stroke: "stroke-solar", fill: "bg-solar" },
    { key: "powerwall", label: "Powerwall", share: figures.from_powerwall_percentage, stroke: "stroke-powerwall", fill: "bg-powerwall" },
    { key: "grid", label: "Grid", share: figures.from_grid_percentage, stroke: "stroke-grid", fill: "bg-grid" },
  ];
  const starts = shares.map((_, i) => shares.slice(0, i).reduce((sum, { share }) => sum + share, 0));
  // Each share is rounded on its own, so they can add up to 99 or 101; drawing them out of their sum closes the ring.
  const whole = starts[2] + shares[2].share;
  return (
    <section aria-labelledby="self-powered" className="flex flex-col gap-5">
      <Title id="self-powered" title="Self powered" explanation="Home use met by solar and Powerwall" />
      <div className="flex flex-wrap items-center gap-8">
        <div role="img" aria-label={`Home use: ${shares.map(({ label, share }) => `${share}% ${label}`).join(", ")}`}
          className="relative size-[220px]">
          <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden>
            <circle cx="100" cy="100" r="80" fill="none" strokeWidth="14" className="stroke-border" />
            {shares.map(({ key, share, stroke }, i) => share > 0 && (
              <circle key={key} data-share={key} cx="100" cy="100" r="80" fill="none" strokeWidth="14" className={stroke}
                pathLength={whole} strokeDasharray={`${share} ${whole}`} strokeDashoffset={-starts[i]} />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[52px] font-semibold">{figures.self_powered_percentage}%</span>
            <span className="text-[13px] text-muted-foreground">self-powered</span>
          </div>
        </div>
        <ul className="flex flex-col gap-3">
          {shares.map(({ key, label, share, fill }) => (
            <li key={key} className="flex items-center gap-3">
              <span className={`size-2.5 rounded-full ${fill}`} aria-hidden />
              <span className="min-w-11 font-mono">{share}%</span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SolarOffset({ figures }: { figures: ImpactFigures }) {
  const scale = Math.max(figures.total_solar, figures.total_house);
  const bars = [
    { label: "Solar", kwh: figures.total_solar, fill: "bg-solar" },
    { label: "Home", kwh: figures.total_house, fill: "bg-home" },
  ];
  return (
    <section aria-labelledby="solar-offset" className="flex flex-col gap-5">
      <Title id="solar-offset" title="Solar offset" explanation="Solar generated against home use" />
      <p className="flex items-baseline gap-2.5">
        <span className="font-mono text-[52px] font-semibold">{figures.total_solar_percentage}%</span>
        <span className="text-muted-foreground">energy offset</span>
      </p>
      <div className="flex flex-col gap-4">
        {bars.map(({ label, kwh, fill }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm" aria-hidden>
              <span>{label}</span>
              <span className="font-mono">{energy(kwh)}</span>
            </div>
            <div role="meter" aria-label={label} aria-valuenow={kwh} aria-valuemin={0} aria-valuemax={scale} aria-valuetext={energy(kwh)}
              className="h-7 rounded-md bg-secondary">
              <div className={`h-full rounded-md ${fill}`} style={{ width: `${scale ? (kwh / scale) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
