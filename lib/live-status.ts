import { DASH, staleWarning } from "@/lib/scene/live-scene";
import { TIME_ZONE } from "@/lib/scene/replay";

export type LiveStatus = { battery_percentage?: number | null; battery_status?: string | null; modified?: string | null };

const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });

// The top bar's reading of the latest live status, stale by the Distribution page's rule so the two never disagree.
export function liveStatus(status: LiveStatus | null, now: Date) {
  const modified = status?.modified ? new Date(status.modified) : null;
  const live = modified !== null && staleWarning(modified, now) === null;
  const charge = status?.battery_percentage != null ? `${status.battery_percentage}%` : DASH;
  return {
    live,
    word: modified && !live ? "LAST" : "LIVE",
    time: modified ? clock.format(modified) : DASH,
    pill: `PW ${charge} · ${status?.battery_status?.toUpperCase() ?? DASH}`,
  };
}
