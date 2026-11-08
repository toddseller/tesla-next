"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";

import ReplayBar, { DEFAULT_SPEED } from "@/components/scene/replay-bar";
import LiveScene from "@/components/scene/live-scene";
import { useSiteData } from "@/components/scene/use-site-data";
import { type SceneState, sceneState, staleWarning } from "@/lib/scene/live-scene";
import { type Sky, weatherAt, withSplit } from "@/lib/scene/weather";
import { dataEnd, daySpan, FIRST_DAY, formatAt, momentAt, parseAt, replayValues, siteInstant, siteToday, toSteps, wallTime } from "@/lib/scene/replay";

// Nothing while live updates arrive, since the moving flows say the data is
// live; an amber warning, with the last update's time on hover, once they
// stop, as the flows keep moving on the last data. It checks every second in
// its own component, so the check re-renders only this line, not the scene.
const SECONDS = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });

export const StaleWarning = ({ liveReceived, modifiedAt, renderedAt }: { liveReceived: boolean; modifiedAt: Date | null; renderedAt?: number }) => {
  const [now, setNow] = useState(() => new Date(renderedAt ?? Date.now()));

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const warning = liveReceived && modifiedAt ? staleWarning(modifiedAt, now) : null;
  if (!warning) return null;
  return (
    <p className="text-xs md:text-base mb-4 text-amber-500 dark:text-amber-400" title={`Last update ${SECONDS.format(modifiedAt!)}`} data-part="stale-warning">
      {warning}
    </p>
  );
};

const TICK_MS = 100;
// The replay bar hides this long after its last use (openspec/specs/scene-replay).
export const BAR_SHOW_MS = 3000;
// Paused, the replay sits on a whole minute, as the address and scrubber show it.
const toMinute = (t: number) => Math.floor(t / 60000) * 60000;

// In development only, `cover`, `rain`, `cirrus`, `low`, `mid` and `sun` (0 to 1) and `wind`, `windLow`,
// `windMid` and `windHigh` (km/h across the scene at 10 m and each band's height, positive toward its
// right) in the address replace the live weather, to check its looks on any device on any day, and
// `drift` multiplies the clouds' pace, to tune it by eye; the production build drops this.
const DEV_WEATHER: Record<keyof Sky, [number, number]> = { cover: [0, 1], rain: [0, 1], wind: [-60, 60], windLow: [-150, 150], windMid: [-150, 150], windHigh: [-150, 150],
  cirrus: [0, 1], low: [0, 1], mid: [0, 1], sun: [0, 1] };
// Next.js compiles these out of a production build; tests and `next dev` keep them.
const dev = () => process.env.NODE_ENV !== "production";
const devDrift = (params: URLSearchParams) => (dev() && params.has("drift") ? Math.min(10, Math.max(0, Number(params.get("drift")) || 0)) : 1);
const devWeather = (params: URLSearchParams) => {
  const weather: Sky = {};
  if (!dev()) return weather;
  for (const [name, [low, high]] of Object.entries(DEV_WEATHER) as [keyof Sky, [number, number]][]) {
    if (params.has(name)) weather[name] = Math.min(high, Math.max(low, Number(params.get(name)) || 0));
  }
  return weather;
};

// Live readings arrive every 15 minutes; each is walked in over about 5, so the sky
// changes like weather rather than jumping (openspec/specs/scene-weather). The first
// known weather shows at once. A missing value walks as 0, which the scene reads the
// same way (no sunshine caps nothing).
const WALK_MS = 5 * 60 * 1000;
const towards = (from: Sky, to: Sky, f: number): Sky =>
  Object.fromEntries((Object.keys(to) as (keyof Sky)[]).map((k) => [k, f === 1 ? to[k] : (from[k] ?? 0) + ((to[k] ?? 0) - (from[k] ?? 0)) * f]));
const useWalkedWeather = (weather: Sky) => {
  const key = JSON.stringify(withSplit(weather));
  const [shown, setShown] = useState<Sky>(() => JSON.parse(key));
  const shownRef = useRef(shown);
  shownRef.current = shown;
  useEffect(() => {
    const from = shownRef.current;
    const to = JSON.parse(key);
    if (from.cover == null) {
      setShown(to);
      return undefined;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      const f = Math.min(1, (Date.now() - start) / WALK_MS);
      setShown(towards(from, to, f));
      if (f === 1) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [key]);
  return shown;
};

// Live, the scene follows the clock once a minute too, so it darkens through dusk
// even if no live update arrives.
// `renderedAt` is when the server rendered the page: the first render in the browser uses it too, so hydration finds
// the same times the server's HTML shows, and moves to the browser's clock right after.
const Distribution = ({ initialStatus, search, renderedAt }: { initialStatus: string | null; search: Record<string, string>; renderedAt?: number }) => {
  const {
    solarPower, homePower, batteryPower, battery, gridPower, vehicle, liveReceived, modifiedAt, weatherCover, weatherRain, weatherWind, weatherWindLow, weatherWindMid, weatherWindHigh, weatherCirrus, weatherLow, weatherMid, weatherSun,
    setReplayDay, replayData,
  } = useSiteData(initialStatus);
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const [now, setNow] = useState(() => new Date(renderedAt ?? Date.now()));
  // null while live.
  const [replayTime, setReplayTime] = useState<number | null>(() => parseAt(searchParams.get("at")));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const replaying = replayTime != null;
  const today = siteToday(now.getTime());
  const day = replaying ? wallTime(replayTime!).date : today;
  const isToday = day === today;

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // A link that isn't a moment to replay opens live, without it. Only on arrival.
  useEffect(() => {
    if (searchParams.has("at") && replayTime == null) showInAddress(null);
  }, []);

  useEffect(() => {
    setReplayDay(replaying ? day : null);
  }, [replaying, day, setReplayDay]);
  useEffect(() => () => setReplayDay(null), [setReplayDay]);

  // A response for another day, still on its way after a day change, isn't this day's.
  const steps = useMemo(() => (replayData?.date === day ? toSteps(replayData.data) : []), [replayData, day]);
  const end = dataEnd(steps);
  const span = daySpan(day);

  // Never during play, and without Next.js's navigation, which would render the page on the server again.
  const showInAddress = (t: number | null) => window.history.replaceState(null, "", t == null ? window.location.pathname : `?${new URLSearchParams({ at: formatAt(t) })}`);
  const replayAt = (t: number) => {
    const clamped = Math.max(siteInstant(FIRST_DAY), Math.min(t, Date.now()));
    setReplayTime(clamped);
    if (!playing) showInAddress(clamped);
  };

  // Advances by the real time elapsed, so a slow tab keeps time, and pauses at the end of a
  // past day's data; today's data trails now by minutes, so its end hands over to live.
  const timeRef = useRef(replayTime);
  timeRef.current = replayTime;
  useEffect(() => {
    if (!playing) return undefined;
    let last = Date.now();
    const timer = setInterval(() => {
      const at = Date.now();
      const elapsed = at - last;
      last = at;
      // Waits while the day loads.
      if (end == null) return;
      const next = timeRef.current! + elapsed * speed;
      // Ahead of the render, so ticks batched into one render still add up.
      timeRef.current = next;
      if (next >= end - 1 && isToday) {
        setPlaying(false);
        setReplayTime(null);
        showInAddress(null);
      } else if (next >= end - 1) {
        setReplayTime(toMinute(end - 1));
        setPlaying(false);
        showInAddress(end - 1);
      } else {
        setReplayTime(next);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [playing, speed, end, isToday]);

  // The replay bar shows on demand: for a while after each use (page load,
  // a mouse moving over the scene, a tap or a key), while a mouse rests on
  // the bar, while the bar holds itself shown, and while a replay is paused.
  const [recent, setRecent] = useState(true);
  const [hover, setHover] = useState(false);
  const [holds, setHolds] = useState(0);
  const recentTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const poke = () => {
    setRecent(true);
    clearTimeout(recentTimer.current);
    recentTimer.current = setTimeout(() => setRecent(false), BAR_SHOW_MS);
  };
  useEffect(() => {
    poke();
    return () => clearTimeout(recentTimer.current);
  }, []);
  const onHold = (on: boolean) => {
    setHolds((count) => Math.max(count + (on ? 1 : -1), 0));
    if (!on) poke();
  };
  // As in a video player, a moving mouse shows the bar and a resting one lets
  // it hide, except over the bar itself. Mouse only: iOS sends pointer events
  // after a tap too.
  const onMouseMove = (event: PointerEvent) => {
    if (event.pointerType === "mouse") poke();
  };
  const onHover = (on: boolean) => (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    setHover(on);
    if (!on) poke();
  };
  const barShown = recent || hover || holds > 0 || (replaying && !playing);
  const shownTime = replaying ? replayTime! : now.getTime();

  const onDay = (newDay: string) => {
    const { hour, minute } = wallTime(replaying ? replayTime! : now.getTime());
    replayAt(siteInstant(newDay, hour, minute));
  };
  const onPlay = () => {
    if (playing) {
      setPlaying(false);
      setReplayTime(toMinute(replayTime!));
      showInAddress(replayTime);
    } else {
      // From live, play today from midnight.
      if (!replaying) setReplayTime(span.start);
      setPlaying(true);
      poke();
    }
  };
  const onLive = () => {
    setPlaying(false);
    setReplayTime(null);
    showInAddress(null);
  };

  const liveWeather = useWalkedWeather(liveReceived ? { cover: weatherCover, rain: weatherRain, wind: weatherWind, windLow: weatherWindLow, windMid: weatherWindMid, windHigh: weatherWindHigh, cirrus: weatherCirrus, low: weatherLow, mid: weatherMid, sun: weatherSun } : {});

  let state: SceneState;
  if (replaying) {
    const { values, links } = replayValues(momentAt(steps, replayTime!));
    // Undefined until the day's data arrives: the weather isn't known yet.
    const known = replayData?.date === day;
    const readings = known ? replayData!.weather?.map(withSplit) : null;
    const at = (field: keyof Sky) => (known ? weatherAt(readings, replayTime!, field) : undefined);
    const weather = Object.fromEntries((["cover", "rain", "wind", "windLow", "windMid", "windHigh", "cirrus", "low", "mid", "sun"] as const).map((field) => [field, at(field)])) as Sky;
    state = sceneState(values, new Date(replayTime!), { links, replay: true, ...weather });
  } else {
    state = sceneState({ solarPower, homePower, batteryPower, battery, gridPower, vehicle, liveReceived }, now, { ...liveWeather, ...devWeather(searchParams) });
  }

  return (
    <div>
      {!replaying && <StaleWarning liveReceived={liveReceived} modifiedAt={modifiedAt} renderedAt={renderedAt} />}
      {/* On a desktop window, as wide as fits the window's height, up to 80rem,
          centered and wider than the 1200px frame around the rest of the page
          when there's room (the 2400px images are sharp to 80rem on a 2x
          screen). The window leaves 100dvh - 133px for the scene (101px above
          it: the top bar and the frame's padding; 32px below it; the replay bar
          shows over the scene), and the scene without its sky above the roof
          is 0.58125 * width - 20px tall, so width = (100dvh - 113px) / 0.58125.
          The sky (16% of the width, the scene-weather spec) is added on top, so
          the house keeps its size and the scene's bottom can run past the
          window. Phones, in landscape too (under 1024px wide), keep the plain
          56rem cap inside the frame, so turning one sideways makes the scene
          larger, not smaller. */}
      <div className="relative mx-auto max-w-4xl lg:max-w-none lg:w-[min(80rem,calc(100vw-2rem),calc((100dvh-113px)*1.72))] lg:left-1/2 lg:-translate-x-1/2 rounded-2xl overflow-hidden"
        onPointerMove={onMouseMove} onPointerDown={poke} onKeyDown={poke}>
        {/* A replay playing at real time looks live; the tag says it isn't. */}
        <div className="relative">
          <LiveScene state={state} paused={replaying && !playing} drift={devDrift(searchParams)} />
          {replaying && (
            <span className="absolute top-2 left-3 text-[10px] md:text-xs font-semibold tracking-wider text-gray-200 bg-white/10 border border-white/30 rounded-full px-2 py-0.5" data-part="replay-tag">
              REPLAY
            </span>
          )}
          {/* While the bar is hidden: the shown time's place in its day, as the
              scrubber has it, red live and white in replay. */}
          {!barShown && (
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20" data-part="progress-line">
              <div className={`h-full ${replaying ? "bg-white" : "bg-[rgb(204,0,0)]"}`}
                style={{ width: `${((shownTime - span.start) / (span.end - span.start)) * 100}%` }} />
            </div>
          )}
        </div>
        {/* Hidden, the bar stays in the tab order: on a desktop it slides down
            out of the card, which clips it; below that its row closes to 0. */}
        <div
          className={`grid lg:absolute lg:inset-x-0 lg:bottom-0 lg:grid-rows-[1fr] transition-[grid-template-rows,transform] duration-[750ms] ease-[ease] motion-reduce:transition-none ${barShown ? "grid-rows-[1fr]" : "grid-rows-[0fr] lg:translate-y-full"}`}
          data-part="replay-drawer" data-shown={barShown} onPointerEnter={onHover(true)} onPointerLeave={onHover(false)}>
          <div className="min-h-0 overflow-hidden">
            <ReplayBar
              live={!replaying}
              day={day}
              today={today}
              time={shownTime}
              span={span}
              playing={playing}
              speed={speed}
              onDay={onDay}
              onTime={replayAt}
              onPlay={onPlay}
              onSpeed={setSpeed}
              onLive={onLive}
              onHold={onHold}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Distribution;
