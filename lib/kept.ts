// Answers kept for a site day by key, each the promise of its working-out, so two requests at once share one.
export type Kept<T> = Map<string, { day: string; value: Promise<T> }>;

// A failed working-out isn't kept, so the next request tries again.
function keep<T>(kept: Kept<T>, key: string, day: string, value: Promise<T>) {
  kept.set(key, { day, value });
  value.catch(() => {
    if (kept.get(key)?.value === value) kept.delete(key);
  });
  return value;
}

export function keptFor<T>(kept: Kept<T>, key: string, day: string, workOut: () => Promise<T>) {
  const hit = kept.get(key);
  return hit?.day === day ? hit.value : keep(kept, key, day, workOut());
}

// In place at once, so a request made meanwhile, like a reload on the same totals notice, waits for the new answer
// rather than getting the old one; if it fails, the previous answer stands.
export function refreshKept<T>(kept: Kept<T>, key: string, day: string, workOut: () => Promise<T>, what: string) {
  const hit = kept.get(key);
  const previous = hit?.day === day ? hit.value : undefined;
  const value = keep(kept, key, day, workOut().catch((error) => {
    console.error(`${what} refresh failed:`, error.message);
    if (previous) return previous;
    throw error;
  }));
  return value.then(() => {}, () => {});
}
