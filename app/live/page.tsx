"use client";

import { useEffect, useState } from "react";

type Arrival = { at: Date; payload: string; delayMs?: number };

export default function Live() {
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [state, setState] = useState("connecting");

  useEffect(() => {
    const source = new EventSource("/api/live");
    source.onopen = () => setState("open");
    source.onerror = () => setState("reconnecting");
    source.addEventListener("live", (event) => {
      const at = new Date();
      const { sent } = JSON.parse(event.data);
      setArrivals((list) => [
        { at, payload: event.data, delayMs: sent ? at.getTime() - sent : undefined },
        ...list,
      ]);
    });
    return () => source.close();
  }, []);

  return (
    <main className="p-4 font-mono text-sm">
      <p>Stream: {state}</p>
      <ul>
        {arrivals.map((a) => (
          <li key={a.at.getTime()}>
            {a.at.toISOString()} {a.delayMs !== undefined && `(${a.delayMs} ms)`} {a.payload}
          </li>
        ))}
      </ul>
    </main>
  );
}
