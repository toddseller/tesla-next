// Listening from boot means the first visitor after a deploy already gets the latest status.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") (await import("./lib/live")).startListening();
}
