// Listening from boot means the first visitor after a deploy already gets the latest status.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const live = await import("./lib/live");
  live.startListening();
  const [{ carCharging }, { payback }, { patterns }, { FIRST_DAY, siteToday }] = await Promise.all([
    import("./lib/car-charging"), import("./lib/true-up/payback"), import("./lib/patterns"), import("./lib/scene/replay"),
  ]);
  // A deploy starts the caches empty, and filling them on the first visit takes seconds; not awaited, so pages
  // aren't held back while they fill.
  const warmAll = () => {
    const today = siteToday();
    const started = Date.now();
    // A failed warm-up only leaves the first visit cold, as before; it mustn't take the server down.
    const warm = (cache: Promise<unknown>) => cache.catch((error) => console.error("cache warm-up failed:", error.message));
    Promise.all([warm(carCharging(FIRST_DAY, today, today, "corrected")), warm(payback(today)), warm(patterns(today, "corrected"))])
      .then(() => console.log(`caches warmed in ${((Date.now() - started) / 1000).toFixed(1)}s`));
  };
  warmAll();
  // anton rewrote stored days, or a notice of it may have been missed: what was kept may be stale.
  live.onRewrite(() => {
    console.log("stored data rewritten; warming the caches again");
    globalThis.chargingDays?.clear();
    globalThis.paybackYears?.clear();
    globalThis.patternsMonths?.clear();
    globalThis.trueUpGrids?.clear();
    warmAll();
  });
}
