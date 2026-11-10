// Listening from boot means the first visitor after a deploy already gets the latest status.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  (await import("./lib/live")).startListening();
  const [{ carCharging }, { payback }, { FIRST_DAY, siteToday }] = await Promise.all([
    import("./lib/car-charging"), import("./lib/true-up/payback"), import("./lib/scene/replay"),
  ]);
  // A deploy starts both caches empty, and filling them on the first visit takes seconds; not awaited, so pages
  // aren't held back while they fill.
  const today = siteToday();
  const started = Date.now();
  // A failed warm-up only leaves the first visit cold, as before; it mustn't take the server down.
  const warm = (cache: Promise<unknown>) => cache.catch((error) => console.error("cache warm-up failed:", error.message));
  Promise.all([warm(carCharging(FIRST_DAY, today, today)), warm(payback(today))])
    .then(() => console.log(`caches warmed in ${((Date.now() - started) / 1000).toFixed(1)}s`));
}
