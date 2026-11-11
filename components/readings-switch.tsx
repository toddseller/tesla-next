"use client";

import { useRouter } from "next/navigation";

import { presetStyle } from "@/components/solar/range-controls";
import type { Readings } from "@/lib/meter";

const CHOICES: { label: string; readings: Readings }[] = [{ label: "Corrected", readings: "corrected" }, { label: "As Tesla reported", readings: "tesla" }];

// The page builds its own address for each view, so the switch keeps whatever else the address holds.
export function ReadingsSwitch({ readings, addresses }: { readings: Readings; addresses: Record<Readings, string> }) {
  const router = useRouter();
  return (
    <div role="group" aria-label="Readings" className="grid grid-cols-2 gap-0.5 rounded-lg border border-input bg-card p-[3px] max-sm:w-full sm:flex">
      {CHOICES.map((choice) => (
        <button key={choice.readings} type="button" aria-pressed={choice.readings === readings} className={presetStyle(choice.readings === readings)}
          onClick={() => choice.readings !== readings && router.replace(addresses[choice.readings], { scroll: false })}>
          {choice.label}
        </button>
      ))}
    </div>
  );
}

export function ReadingsNote({ readings }: { readings: Readings }) {
  return (
    <p className="text-[13px] text-muted-foreground">
      {readings === "tesla"
        ? "Grid figures are as Tesla reported them. Until April 27, 2026, Tesla read about half of what PG&E's meter recorded."
        : "Grid figures from October 6, 2023 to April 26, 2026 use PG&E's meter readings: Tesla read about half of them until a service visit on April 27, 2026. Earlier dates are as Tesla reported them."}
    </p>
  );
}
