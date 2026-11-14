import { Check, CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

// What a save did: stored, as a status, or refused, as an alert so a screen reader says why at once.
export function Notice({ ok, children }: { ok: boolean; children: ReactNode }) {
  const Icon = ok ? Check : CircleAlert;
  return (
    <p role={ok ? "status" : "alert"}
      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] ${ok ? "border-powerwall/45 bg-powerwall/10" : "border-destructive/50 bg-destructive/10"}`}>
      <Icon aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${ok ? "text-powerwall" : "text-destructive"}`} />
      <span>{children}</span>
    </p>
  );
}
