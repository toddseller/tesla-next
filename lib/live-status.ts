import { DASH, staleWarning } from "@/lib/scene/live-scene";
import { TIME_ZONE } from "@/lib/scene/replay";

export type LiveStatus = {
  battery_percentage?: number | null; battery_status?: string | null; modified?: string | null;
  island_status?: string | null; storm_mode_active?: boolean | null;
};
// The site's open state stretch as the server reads it from anton's site_state.
export type SiteState = { start: string; island_status: string; storm_mode_active: boolean };

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

// The pill before the Powerwall's while the site is off the grid or in storm watch. "Since" comes only from a stored
// off-grid stretch: anton stores stretches every 5 minutes, so an outage's first minutes have no start yet.
export function gridPill(status: LiveStatus | null, site: SiteState | null) {
  const island = status?.island_status ?? "";
  if (island === "off_grid_intentional") return { kind: "test", text: "OFF GRID TEST" } as const;
  if (island.startsWith("off_grid")) {
    const since = site?.island_status.startsWith("off_grid") ? ` SINCE ${clock.format(new Date(site.start))}` : "";
    return { kind: "outage", text: `OFF GRID${since}` } as const;
  }
  return status?.storm_mode_active ? ({ kind: "storm", text: "STORM WATCH" } as const) : null;
}
