// The hover box every home chart shows, styled as the Solar page's (BarDetails in components/solar/range-chart).
export type Hover<T> = { active?: boolean; payload?: readonly { payload?: T }[] };
type Detail = { name: string; value: string; color?: string };

export function DetailsBox({ title, details }: { title: string; details: Detail[] }) {
  return (
    <div className="flex min-w-44 flex-col gap-1.5 rounded-lg border border-input bg-background px-3.5 py-3 text-sm shadow-xl">
      <span className="font-semibold">{title}</span>
      {details.map(({ name, value, color }) => (
        <span key={name} data-part="detail" className="flex items-center gap-2">
          {color && <span aria-hidden className="size-2 rounded-full" style={{ background: color }} />}
          {name}
          <span className="ml-auto pl-3 font-mono">{value}</span>
        </span>
      ))}
    </div>
  );
}
