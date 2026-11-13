import React, {type CSSProperties, type ReactNode, type Ref, useEffect, useRef, useState, useSyncExternalStore} from 'react';

import {sceneLayers, SUNLIGHT} from '@/components/scene/images';
import {type SkyPoint, twinkle} from '@/lib/scene/night-sky';
import type {Link, SceneState} from '@/lib/scene/live-scene';
import {chargeBarPoints, EAVES, FLOW_COLORS, GLOW, HEADROOM, LABELS, type LegName, legPoints, LEGS, MOON, pathLength, type Point, RENDER, skyY, STAGE, STRAIGHT_THROUGH, VANE} from '@/components/scene/layout';

import CloudCanvas, {type CloudHandle} from '@/components/scene/cloud-canvas';
import {cloudInputs} from '@/components/scene/cloud-inputs';
import {useMoonFace} from '@/components/scene/moon-face';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {isCalm, windText} from '@/lib/scene/weather';

export {skyY};
import '@/components/scene/scene.css';

const pct = (value: number, total: number) => `${(value / total) * 100}%`;
const points = (path: Point[]) => path.map(([x, y]) => `${x},${y}`).join(' ');

// Flows run as a relay, as in the app: each cycle a gradient runs down the
// source's leg into the panel, then out along every destination's leg at once,
// then the lines rest until the next cycle. Each leg takes the same time
// whatever its length. A gradient fades from clear at its tail to full color at
// its head, and its tail is most of the leg's length.
export const TIMING = { cycle: 2.0, leg: 0.55, tail: 0.8 };
const PARK = 6;
// A paused replay's flows stand still here in the cycle (ms), where the flow
// into the panel and the flows out of it are both partway along their legs.
export const PAUSED_AT = 0.4 * TIMING.cycle * 1000;

const REDUCED = '(prefers-reduced-motion: reduce)';
const reducedMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.(REDUCED).matches);
// For rendering: the server can't know the visitor's setting, so the page hydrates without it and then switches,
// rather than rendering differently from the server's HTML.
const watchReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia?.(REDUCED);
  query?.addEventListener?.('change', onChange);
  return () => query?.removeEventListener?.('change', onChange);
};
const useReducedMotion = () => useSyncExternalStore(watchReducedMotion, reducedMotion, () => false);

export const flowOffset = (phase: number, { begin, end, rest, to }: { begin: number; end: number; rest: number[]; to: number[] }) => {
  const t = phase <= begin ? 0 : phase >= end ? 1 : (phase - begin) / (end - begin);
  return [rest[0] + (to[0] - rest[0]) * t, rest[1] + (to[1] - rest[1]) * t];
};

// Moves every flow gradient in `svg` to where it sits at time `now` (ms). This
// runs from requestAnimationFrame rather than as SVG animation: WebKit (every
// browser on an iPhone) runs an animated gradientTransform but never repaints
// the shapes using the gradient, while it does repaint attribute changes.
export const moveFlows = (svg: Element, now: number) => {
  const phase = ((now / 1000) % TIMING.cycle) / TIMING.cycle;
  svg.querySelectorAll<SVGElement>('[data-flow]').forEach((gradient) => {
    const [begin, end, rx, ry, dx, dy] = gradient.dataset.flow!.split(' ').map(Number);
    const [x, y] = flowOffset(phase, { begin, end, rest: [rx, ry], to: [dx, dy] });
    gradient.setAttribute('gradientTransform', `translate(${x} ${y})`);
  });
};

// Each straight piece of the leg is stroked with its own gradient, placed by
// the piece's distance along the leg, so the gradient bends with the line. The
// gradient slides from "head at the leg's start" to "tail past its end" during
// its stage of the cycle and waits off the leg the rest of the time; its
// timing and positions ride along in `data-flow` for moveFlows.
type LegProps = { id: string; path: Point[]; color: string; stage: number };
const Gradient = ({ id, path, color, stage }: LegProps) => {
  const length = pathLength(path);
  const tail = length * TIMING.tail;
  const run = TIMING.leg * (1 + TIMING.tail);
  const begin = (stage * TIMING.leg) / TIMING.cycle;
  const end = begin + run / TIMING.cycle;
  let along = 0;
  return path.slice(1).map(([x2, y2], i) => {
    const [x1, y1] = path[i];
    const piece = Math.hypot(x2 - x1, y2 - y1);
    const [ux, uy] = [(x2 - x1) / piece, (y2 - y1) / piece];
    const [hx, hy] = [x1 - ux * along, y1 - uy * along];
    // Waiting gradients sit past the line's round caps, so no color shows.
    const [rx, ry] = [-ux * PARK, -uy * PARK];
    const [dx, dy] = [ux * (length + tail + PARK), uy * (length + tail + PARK)];
    along += piece;
    return (
      <React.Fragment key={i}>
        <linearGradient
          id={`${id}-${i}`}
          gradientUnits="userSpaceOnUse"
          x1={hx - ux * tail}
          y1={hy - uy * tail}
          x2={hx + ux}
          y2={hy + uy}
          gradientTransform={`translate(${rx} ${ry})`}
          data-flow={[begin, end, rx, ry, dx, dy].join(' ')}
        >
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset={tail / (tail + 1)} stopColor={color} stopOpacity="1" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <line className="scene-flow" x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${id}-${i})`} />
      </React.Fragment>
    );
  });
};

const Leg = ({ id, path, color, stage }: LegProps) =>
  useReducedMotion() ? <polyline className="scene-flow" points={points(path)} stroke={color} /> : <Gradient id={id} path={path} color={color} stage={stage} />;

const outLeg = (to: Link['to'], lane: number, cable: Point[] | undefined) => {
  if (to === 'car') return cable || [];
  return legPoints(to as LegName, lane).reverse();
};

// A car with no cable in the render has only the first stage.
type Lane = { link: Link; lane: number; hidden?: boolean };
const SourceFlows = ({ from, links, cable }: { from: Link['from']; links: Lane[]; cable: Point[] | undefined }) => {
  const color = FLOW_COLORS[from];
  const inPath = legPoints(from);
  return (
    <g data-source={from}>
      <Leg id={`scene-flow-${from}`} path={inPath} color={color} stage={0} />
      {links.map(({ link, lane, hidden }) => {
        const outPath = hidden ? [] : outLeg(link.to, lane, cable);
        return (
          <g key={link.to} className={link.to === 'car' ? 'scene-cable' : undefined} data-link={`${from}-${link.to}`} data-lane={lane} data-from={inPath[0].join(',')} data-to={(outPath[outPath.length - 1] || inPath[inPath.length - 1]).join(',')}>
            {lane !== 0 && <polyline className="scene-line" points={points(legPoints(link.to as LegName, lane))} />}
            {outPath.length > 0 && <Leg id={`scene-flow-${from}-${link.to}`} path={outPath} color={color} stage={1} />}
          </g>
        );
      })}
    </g>
  );
};

// Links into one destination take lanes in source order below the main line,
// except that a source running straight on through the panel keeps the main
// line; with it and two more (solar, Powerwall and grid into the house), the
// first of the two runs above the main line and the second below, as only one
// lane below fits under the window. Flows into the car share its cable. The
// grid line has no lanes: it shows only the source exporting the most, and the
// others stop at the panel.
const withLanes = (links: Link[]): Lane[] => {
  const taken: Record<string, number> = {};
  const straight = links.filter((link) => STRAIGHT_THROUGH[link.to] === link.from);
  straight.forEach((link) => {
    const extras = links.filter((other) => other.to === link.to && other !== link).length;
    taken[link.to] = extras === 2 ? -1 : 1;
  });
  const exports = links.filter((link) => link.to === 'grid');
  const shownExport = exports.reduce((most, link) => (link.kw > most.kw ? link : most), exports[0]);
  return links.map((link) => {
    if (link.to === 'grid') return { link, lane: 0, hidden: link !== shownExport };
    if (link.to === 'car' || straight.includes(link)) return { link, lane: 0 };
    const lane = taken[link.to] || 0;
    taken[link.to] = lane === -1 ? 1 : lane + 1;
    return { link, lane };
  });
};

const bySource = (links: Link[]) =>
  withLanes(links).reduce((groups: { from: Link['from']; links: Lane[] }[], entry) => {
    const group = groups.find((g) => g.from === entry.link.from);
    if (group) group.links.push(entry);
    else groups.push({ from: entry.link.from, links: [entry] });
    return groups;
  }, []);

const Layer = ({ name, src, alt = '', className = 'scene-render', style }: { name: string; src: string; alt?: string; className?: string; style?: CSSProperties }) => (
  <img className={className} data-part={name} src={src} alt={alt} style={{ top: pct(RENDER.y, STAGE.height), height: pct(RENDER.height, STAGE.height), ...style }} />
);

// The sun's light on each face direction: a warm color-dodge that brightens
// the faces turned toward the sun, and the same shape in black that darkens
// those turned away, to 0.7 of the art, both scaled by the light's strength,
// and the light alone limited by the season's peak.
// Opacities inline, so nothing flashes at first paint; all 0 at night.
const SHADE_DARKEN = 0.3;
const Sunlight = ({ layers, sunlight, suffix = '' }: { layers: { face: 'south' | 'east' | 'west'; src: string }[]; sunlight: SceneState['sunlight']; suffix?: string }) =>
  layers.flatMap(({ face, src }) => {
    const light = sunlight?.[face];
    const strength = sunlight?.strength ?? 0;
    const peak = sunlight?.peak ?? 0;
    return [
      <Layer key={`shade-${face}`} name={`shade-${face}${suffix}`} src={src} className="scene-shade" style={{ opacity: light == null ? 0 : SHADE_DARKEN * (1 - light) * strength }} />,
      <Layer key={`sun-${face}`} name={`sun-${face}${suffix}`} src={src} className="scene-sun" style={{ opacity: light == null ? 0 : light * strength * peak }} />,
    ];
  });

// `box` is the stage's place in the canvas, in CSS pixels (`scale` pixels to a stage unit), so the stars line up with
// the moon, which is drawn in the stage.
export const drawStars = (context: CanvasRenderingContext2D, stars: SkyPoint[], box: { left: number; top: number; width: number; scale: number }, ms?: number | null) => {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  stars.forEach((star) => {
    const { x, altitude, radius, opacity, color } = star;
    context.beginPath();
    context.arc(box.left + x * box.width, box.top + skyY(altitude) * box.scale, radius * box.scale, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.globalAlpha = ms == null ? opacity : opacity * twinkle(star, ms);
    context.fill();
  });
};

// A canvas not laid out yet (no width) has nothing to show.
const paintStars = (canvas: HTMLCanvasElement | null, stage: HTMLDivElement | null, stars: SkyPoint[], ms: number) => {
  if (!canvas?.clientWidth || !stage) return;
  const density = window.devicePixelRatio || 1;
  const [width, height] = [Math.round(canvas.clientWidth * density), Math.round(canvas.clientHeight * density)];
  if (canvas.width !== width || canvas.height !== height) Object.assign(canvas, { width, height });
  const context = canvas.getContext('2d')!;
  context.setTransform(density, 0, 0, density, 0, 0);
  drawStars(context, stars, { left: stage.offsetLeft, top: stage.offsetTop, width: stage.offsetWidth, scale: stage.offsetWidth / STAGE.width }, ms);
};

// The gray over the clear sky, from the low cloud and half the mid: none up to 0.4,
// so a partly cloudy sky keeps its blue gaps between the clouds, and full from 0.9.
// High cloud is too thin to gray it.
const skyGray = ({ low, mid }: { low: number; mid: number }) => Math.min(1, Math.max(0, (low + 0.5 * mid - 0.4) / 0.5));
// How fast a band of cloud drifts, in scene widths a second, from the wind across
// the scene at its height (km/h, positive toward the right): seen from the ground a
// cloud crosses as fast as its wind over its height, here 20 km/h at the low cloud's
// height crossing in 18 minutes. In calm air low and mid cloud creep, across in an
// hour the way their wind blows; cirrus stands still.
type Band = 'low' | 'mid' | 'high';
const HEIGHT_KM: Record<Band, number> = { low: 1.5, mid: 3, high: 9.4 };
const PACE = 1 / 14400;
const CREEP = 1 / 3600;
export const driftVelocity = (wind: number | null | undefined, band: Band) => {
  const velocity = ((wind ?? 0) / HEIGHT_KM[band]) * PACE;
  if (band === "high" || Math.abs(velocity) >= CREEP) return velocity;
  return (wind ?? 0) < 0 ? -CREEP : CREEP;
};

// The weather vane's motion (openspec/specs/scene-weather), tuned by eye together:
// it shakes about its direction more the more the gusts exceed the wind, a little
// more with the wind itself, and faster the stronger it blows.
const SHAKE = { still: 5, perGust: 0.5, perWind: 0.1, max: 25, gustFactor: 1.5, hz: 0.3, hzPerKmh: 1 / 40 };
export const vaneShake = (speed: number | null | undefined, gusts: number | null | undefined) => {
  if (speed == null || speed < SHAKE.still) return { amplitude: 0, frequency: 0 };
  const gust = gusts ?? SHAKE.gustFactor * speed;
  return {
    amplitude: Math.min(SHAKE.max, SHAKE.perGust * Math.max(0, gust - speed) + SHAKE.perWind * speed),
    frequency: SHAKE.hz + speed * SHAKE.hzPerKmh,
  };
};
// The house art's ground axes on screen, measured off the render: east along the
// ridge, north up the right block's side, foreshortened. A compass direction maps
// along them, so north tips up into the picture and south comes down toward us.
const EAST: Point = [0.97, 0.24];
const NORTH: Point = [0.73 * 0.7, -0.68 * 0.7];
export const vaneAxis = (degrees: number): Point => {
  const [sin, cos] = [Math.sin((degrees * Math.PI) / 180), Math.cos((degrees * Math.PI) / 180)];
  return [sin * EAST[0] + cos * NORTH[0], sin * EAST[1] + cos * NORTH[1]];
};

// Before any wind reading the vane rests side-on, into the site's usual west wind.
const VANE_REST = 270;
// A spring (per second squared, per second) that overshoots once and settles in about 3 seconds.
const SWING = { stiffness: 9, damping: 2.7 };
// Longer gaps between frames (a hidden tab) step the spring this far at most, so it can't blow up.
const SWING_STEP_MS = 50;
const vanePose = (degrees: number) => {
  const [dx, dy] = vaneAxis(degrees);
  return `matrix(${dx} ${dy} 0 1 ${VANE.foot[0]} ${VANE.foot[1] - VANE.arrow})`;
};
// Two sines at an irrational ratio, so the shake never visibly repeats. The phase is
// accumulated frame by frame, so a change of pace doesn't jump the arrow.
const wobble = (amplitude: number, phase: number) => amplitude * (0.6 * Math.sin(phase) + 0.4 * Math.sin(1.73 * phase + 1.3));
const VANE_ARMS = [['N', 0], ['E', 90], ['S', 180], ['W', 270]] as const;
// The arrow in its own vertical plane, pointing along +x; vanePose lays that plane along the wind.
const VANE_ARROW = 'M -30 -9 L -16 -9 L -12 -1.6 L 22 -1.6 L 22 -6 L 34 0 L 22 6 L 22 1.6 L -12 1.6 L -16 9 L -30 9 L -24 0 Z';

const Vane = ({ arrow, pose, text }: { arrow: Ref<SVGGElement>; pose: string; text: string }) => {
  const [x, y] = VANE.foot;
  const armsAt = y - VANE.arms;
  return (
    <>
      <svg className="scene-layer scene-vane" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} data-part="vane-art" aria-hidden="true">
        <line className="scene-vane-iron" x1={x} y1={y} x2={x} y2={y - VANE.post} strokeWidth={3.2} />
        <line className="scene-vane-rim" x1={x + 1} y1={y} x2={x + 1} y2={y - VANE.post} strokeWidth={0.8} />
        {VANE_ARMS.map(([point, degrees]) => {
          const [dx, dy] = vaneAxis(degrees);
          return (
            <g key={point}>
              <line className="scene-vane-iron" x1={x} y1={armsAt} x2={x + dx * 17} y2={armsAt + dy * 17} strokeWidth={2.6} />
              <line className="scene-vane-rim" x1={x} y1={armsAt} x2={x + dx * 17} y2={armsAt + dy * 17} strokeWidth={0.8} />
              <text className="scene-vane-point" x={x + dx * 25} y={armsAt + dy * 25}>{point}</text>
            </g>
          );
        })}
        <g ref={arrow} data-part="vane-arrow" transform={pose}>
          <path className="scene-vane-plate" d={VANE_ARROW} />
        </g>
        <circle className="scene-vane-plate" cx={x} cy={y - VANE.post} r={3.6} />
      </svg>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="scene-vane-button" data-part="vane" aria-label={`Wind: ${text}`}
            style={{ left: pct(x, STAGE.width), top: pct(y - VANE.post / 2 - 12, STAGE.height) }} />
        </PopoverTrigger>
        <PopoverContent side="left" className="w-auto px-3 py-1.5 text-sm tabular-nums" data-part="vane-readout">{text}</PopoverContent>
      </Popover>
    </>
  );
};

// The bands that drift, in the shader's layer order (cirrus, mid, low), with the wind
// that drives each; the darker overcast layer drifts with the low.
const DRIFTING = [["high", "windHigh"], ["mid", "windMid"], ["low", "windLow"]] as const;

// A step of the drift toward a new velocity over `dt` ms, settling in about 1.5
// seconds, so a turning wind slows the clouds through a stop rather than a jump.
export const easeDrift = (velocity: number, target: number, dt: number) => velocity + (target - velocity) * Math.min(1, dt / 500);

// The warm glow of sunset and sunrise, low over the roofline: a warm center on
// the sun's side over a band across the whole scene, faded from the sun's side
// to about a third at the far end.
const twilightFade = (distance: number) => Number((1 - 0.65 * distance).toFixed(2));
const Twilight = ({ twilight }: { twilight: SceneState['twilight'] }) => {
  const x = twilight?.x ?? 0.5;
  const side = `linear-gradient(to right, rgba(0, 0, 0, ${twilightFade(x)}) 0%, rgb(0, 0, 0) ${x * 100}%, rgba(0, 0, 0, ${twilightFade(1 - x)}) 100%)`;
  return (
    <div className="scene-twilight" data-part="twilight" style={{
      opacity: twilight?.strength ?? 0,
      backgroundImage: `radial-gradient(ellipse 75% 40% at ${x * 100}% 46%, rgb(255 140 60 / 0.75) 0%, rgb(230 110 120 / 0.45) 35%, rgb(150 90 160 / 0.2) 60%, rgb(150 90 160 / 0) 80%), `
        + 'linear-gradient(to bottom, rgb(150 90 160 / 0) 15%, rgb(170 95 140 / 0.3) 32%, rgb(235 120 90 / 0.5) 44%, rgb(235 120 90 / 0.35) 52%)',
      maskImage: side,
      WebkitMaskImage: side,
    }} />
  );
};

const skyTop = (altitude: number) => pct(skyY(altitude), STAGE.height);

// The sun's glow in the sky by day, where the state puts it, behind the ground
// near the horizon, where its core stays bright but turns a warm orange and only
// its haze dims (its `daylight` low); cloud dims it to a faint glow and spreads it.
const SunGlow = ({ sunGlow: { x, altitude, daylight, fade }, cover }: { sunGlow: NonNullable<SceneState['sunGlow']>; cover: number }) => (
  <div className="scene-sun-glow" data-part="sun-glow" style={{
    left: `${x * 100}%`,
    top: skyTop(altitude),
    width: `${(GLOW.size + GLOW.cloudSize * cover) * 100}%`,
    opacity: (0.15 + 0.85 * (1 - cover)) * fade,
  }}>
    <div className="scene-sun-haze" data-part="sun-haze" style={{ opacity: 0.35 + 0.65 * daylight }} />
    <div className="scene-sun-glow-warm" data-part="sun-glow-warm" style={{ opacity: 1 - daylight }} />
  </div>
);

// The moon's lit part in a unit circle at `phase` (0 new, 0.5 full), lit from
// the right: the limb's half circle, then the terminator's half ellipse back,
// bulging toward the limb for a crescent and away from it for a gibbous moon.
// The mask turns it to the side the sunlight comes from.
export const moonLitPath = (phase: number) => {
  const crescent = phase < 0.25 || phase > 0.75;
  const width = Math.abs(Math.cos(2 * Math.PI * phase)).toFixed(3);
  return `M0,-1 A1,1 0 0 1 0,1 A${width},1 0 0 ${crescent ? 0 : 1} 0,-1Z`;
};

// The lit part is masked by its path at five phases around the real one, each a
// fifth strong, so the light fades across the terminator (no blur: WebKit draws
// blurs unreliably at the moon's tiny scale).
const TERMINATOR_STEPS = [-2, -1, 0, 1, 2];
const TERMINATOR_STEP = 0.012;

// The moon while it is up, its lit part showing its real face, clipped to the
// phase: drawn from NASA's Lunar Reconnaissance Orbiter map (moon-face.ts) with the
// side that faces Earth now at its center, and mirrored like the scene's sky. The
// real sky's angles counterclockwise from up are clockwise here: the face turns by
// its axis and the lit part by its bright limb, as they are in the sky. It is bright with a
// soft glow at night, its dark side showing the same face faintly (earthshine); by day the higher sun outshines
// it, down to 0.15 with the sun 25 degrees up, its glow and dark side fading out
// through twilight (night). Cloud dims it as it does the sun.
// Low, it is dimmer and yellow-orange (lowMoon); near the horizon it fades and
// sinks behind the ground (fade, skyTop).
const lowMoon = (low: number) => `sepia(${Number((0.6 * low).toFixed(3))}) saturate(${Number((1 + low).toFixed(3))}) brightness(${Number((1 - 0.35 * low).toFixed(3))})`;
const Moon = ({ moon: { x, altitude, phase, libration, axis, brightLimb, night, daylight, fade, low }, cover }: { moon: NonNullable<SceneState['moon']>; cover: number }) => {
  const face = useMoonFace(libration.longitude, libration.latitude);
  const faceTurn = `rotate(${axis}) scale(-1 1)`;
  return (
    <div className="scene-moon" data-part="moon" style={{
      left: `${x * 100}%`,
      top: skyTop(altitude),
      width: `${MOON.size * 100}%`,
      opacity: (1 - 0.85 * daylight) * (1 - 0.85 * cover) * fade,
      filter: lowMoon(low),
    }}>
      <div className="scene-moon-glow" data-part="moon-glow" style={{ opacity: night }} />
      <svg viewBox="-1 -1 2 2" aria-hidden="true">
        <defs>
          <mask id="scene-moon-lit">
            <g transform={`rotate(${brightLimb - 90})`}>
              {TERMINATOR_STEPS.map((step) => <path key={step} d={moonLitPath(phase + step * TERMINATOR_STEP)} fill="#fff" fillOpacity={1 / TERMINATOR_STEPS.length} />)}
            </g>
          </mask>
        </defs>
        <g data-part="moon-night" opacity={night}>
          <circle data-part="moon-dark" r="1" fill="#2a3040" />
          {face && <image data-part="moon-earthshine" href={face} x="-1" y="-1" width="2" height="2" transform={faceTurn} opacity="0.15" />}
        </g>
        <g data-part="moon-face" mask="url(#scene-moon-lit)">
          {face && <image href={face} x="-1" y="-1" width="2" height="2" transform={faceTurn} />}
        </g>
      </svg>
    </div>
  );
};

// Rain as two tiles of straight streaks, drawn once from a fixed seed and moved
// down one tile at a time by CSS animation, so they never redraw: thin, faint
// and slow far away; longer, brighter and faster near. Light rain shows only the
// far layer, heavy rain both. Each streak is drawn twice, a tile apart, so the
// tile wraps without a seam. Even drizzle shows the far layer at 0.6.
const rainTile = (size: number, count: number, length: number, width: number, alpha: number, seed: number) => {
  let s = seed;
  const random = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let lines = '';
  for (let i = 0; i < count; i++) {
    const x = random() * size, y = random() * size, l = length * (0.7 + random() * 0.6);
    for (const dy of [0, -size]) lines += `<line x1="${x.toFixed(1)}" y1="${(y + dy).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + dy + l).toFixed(1)}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><g stroke="rgb(200,210,222)" stroke-opacity="${alpha}" stroke-width="${width}" stroke-linecap="round">${lines}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};
const RAIN_TILES = { far: rainTile(200, 26, 22, 1.2, 0.5, 5), near: rainTile(260, 14, 40, 1.8, 0.45, 9) };
const NIGHT_RAIN = 0.6;
// The rain leans the way the wind blows across the scene, 1.2 degrees per km/h,
// up to 30; the leaning box is wider than the scene so no edge shows.
const rainSlant = (wind: number | null | undefined) => Math.min(30, Math.max(-30, (wind ?? 0) * 1.2));
const Rain = ({ rain, dusk, wind }: { rain: number; dusk: number; wind: number | null | undefined }) => {
  const night = 1 - (1 - NIGHT_RAIN) * (1 - dusk);
  return (
    <div className="scene-rain" data-part="rain" aria-hidden="true" style={{ top: `calc(${pct(-HEADROOM, STAGE.height)} - 16px)` }}>
      <div className="scene-rain-tilt" data-part="rain-tilt" style={{ transform: `skewX(${rainSlant(wind)}deg)` }}>
        <div className="scene-rain-far" data-part="rain-far" style={{ backgroundImage: RAIN_TILES.far, opacity: (rain > 0 ? Math.min(1, 0.35 + 1.3 * rain) : 0) * night }} />
        <div className="scene-rain-near" data-part="rain-near" style={{ backgroundImage: RAIN_TILES.near, opacity: Math.max(0, (rain - 0.3) / 0.7) * night }} />
      </div>
    </div>
  );
};

// As in the app: a small gray uppercase title over a larger white value,
// beside its element.
const Label = ({ name, title, value, note }: { name: keyof typeof LABELS; title?: string; value: ReactNode; note?: string | null }) => {
  const label = LABELS[name];
  const style: CSSProperties = {
    [label.align === 'end' ? 'right' : 'left']: pct(label.align === 'end' ? STAGE.width - label.x : label.x, STAGE.width),
    [label.valign === 'top' ? 'top' : 'bottom']: pct(label.valign === 'top' ? label.y : STAGE.height - label.y, STAGE.height),
  };
  return (
    <div className={`scene-label scene-label-${label.align}`} style={style} data-part={`label-${name}`}>
      <div className="scene-label-title">{title}</div>
      <div className="scene-label-value">{value}</div>
      {note && <div className="scene-label-note">{note}</div>}
    </div>
  );
};

// The scene's fades come on once the weather is known (null is a known "no
// reading"; undefined, not yet) and a frame has been drawn with it, so the
// first weather after the page opens shows at once with the first labels; or
// after SETTLE_MS without any, so sunset still fades.
const SETTLE_MS = 5000;
const useEased = (known: boolean) => {
  const [eased, setEased] = useState(false);
  useEffect(() => {
    if (eased) return undefined;
    if (known) {
      const frame = requestAnimationFrame(() => setEased(true));
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => setEased(true), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [eased, known]);
  return eased;
};

// A body that has just set (the sun glow or the moon, now null) stays drawn at
// its last place with fade 0 for its 1.5-second opacity transition, then goes:
// at fast replay speeds its last degrees pass quicker than the fade, and
// removing it at once would cut the fade short.
const LINGER_MS = 1500;
const useLingering = <T extends { fade: number }>(body: T | null): T | null => {
  const last = useRef<T | null>(body);
  const [, expire] = useState(0);
  if (body) last.current = body;
  useEffect(() => {
    if (body) return undefined;
    const timer = setTimeout(() => {
      last.current = null;
      expire((n) => n + 1);
    }, LINGER_MS);
    return () => clearTimeout(timer);
  }, [body]);
  return body ?? (last.current && { ...last.current, fade: 0 });
};

const LiveScene = ({ state, paused = false, drift = 1 }: { state: SceneState; paused?: boolean; drift?: number }) => {
  const still = useReducedMotion();
  const { labels, links, sunlight, twilight, dusk, charge, glow, replay } = state;
  const sunGlow = useLingering(state.sunGlow);
  const moon = useLingering(state.moon);
  // No reading, or none yet, draws as a clear sky.
  const cover = state.cover ?? 0;
  const eased = useEased(state.cover !== undefined);
  // A reading without the split, or one its weather code makes overcast, carries
  // only the cover, drawn as low cloud.
  const split = state.low != null || state.mid != null;
  const levels = { low: split ? state.low ?? 0 : cover, mid: split ? state.mid ?? 0 : 0, cirrus: state.cirrus ?? 0 };
  const clouds = useRef<CloudHandle>(null);
  const car = labels.car;
  const layers = sceneLayers(car, undefined, replay);
  const cable = layers.car?.path;
  const lines = useRef<SVGSVGElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const starsCanvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stars = useRef(state.stars);
  stars.current = state.stars;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  // Each band's drift velocity to ease toward, in the shader's layer order: none under
  // reduced motion or while a replay is paused.
  const driftTarget = useRef<number[]>([]);
  driftTarget.current = DRIFTING.map(([band, wind]) => (still || paused ? 0 : drift * driftVelocity(state[wind], band)));
  // The vane turns to each reading's direction but keeps its last in calm air; it shakes
  // only while the scene moves.
  const vaneTarget = useRef(VANE_REST);
  if (state.windSpeed != null && state.windDirection != null && !isCalm(state.windSpeed)) vaneTarget.current = state.windDirection;
  const shake = useRef(vaneShake(null, null));
  shake.current = vaneShake(paused ? null : state.windSpeed, state.windGusts);
  const vaneArrow = useRef<SVGGElement>(null);
  // Set once: the frame loop owns the arrow's transform from then on.
  const [firstPose] = useState(() => vanePose(vaneTarget.current));

  // One frame loop moves all the flow gradients, draws the clouds where the wind
  // has drifted them, and redraws the twinkling stars; it finds the
  // gradients afresh each frame, so flows that start or stop between live
  // updates, or on a paused scrub, need no restart.
  useEffect(() => {
    let frame: number;
    let last: number | null = null;
    let velocities = driftTarget.current;
    let offsets = [0, 0, 0];
    let angle = vaneTarget.current;
    let spin = 0;
    let { amplitude, frequency } = shake.current;
    let phase = 0;
    const tick = (now: number) => {
      if (lines.current) moveFlows(lines.current, pausedRef.current ? PAUSED_AT : now);
      paintStars(starsCanvas.current, stage.current, stars.current ?? [], pausedRef.current || reducedMotion() ? PAUSED_AT : now);
      const dt = last == null ? 0 : now - last;
      last = now;
      velocities = velocities.map((velocity, i) => easeDrift(velocity, driftTarget.current[i], dt));
      offsets = offsets.map((offset, i) => (((offset + (velocities[i] * dt) / 1000) % 1) + 1) % 1);
      clouds.current?.draw([...offsets, offsets[2]]);
      if (reducedMotion()) {
        [angle, spin, amplitude] = [vaneTarget.current, 0, 0];
        vaneArrow.current?.setAttribute('transform', vanePose(angle));
      } else if (vaneArrow.current) {
        const step = Math.min(dt, SWING_STEP_MS) / 1000;
        const off = ((((vaneTarget.current - angle) % 360) + 540) % 360) - 180;
        spin += (SWING.stiffness * off - SWING.damping * spin) * step;
        angle = (((angle + spin * step) % 360) + 360) % 360;
        amplitude = easeDrift(amplitude, shake.current.amplitude, dt);
        frequency = easeDrift(frequency, shake.current.frequency, dt);
        phase = (phase + 2 * Math.PI * frequency * step) % (2 * Math.PI * 100);
        vaneArrow.current.setAttribute('transform', vanePose(angle + wobble(amplitude, phase)));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className={['scene', eased && 'scene-eased', still && 'scene-still'].filter(Boolean).join(' ')} data-part="scene" ref={scene} style={{ '--cover': cover, '--day': dusk } as CSSProperties}>
      {/* The day sky over the night backdrop, fading by --day: one gradient can't transition into another. */}
      <div className="scene-sky-day" data-part="sky-day" />
      {/* Under the gray overcast layer, so cloud hides them as it covers the clear sky. */}
      <canvas className="scene-stars" data-part="stars" aria-hidden="true" ref={starsCanvas} />
      <Twilight twilight={twilight} />
      {/* The overcast sky over the clear one (the scene's own backdrop), as gray as the sky is clouded. */}
      <div className="scene-sky-gray" data-part="sky-gray" style={{ opacity: skyGray(levels) }}>
        <div className="scene-sky-gray-day" data-part="sky-gray-day" />
      </div>
      <CloudCanvas ref={clouds} inputs={cloudInputs(state, { ...levels, rain: state.rain ?? 0 })} seed={state.cloudSeed} />
      <div className="scene-stage" data-part="stage" ref={stage} style={{ aspectRatio: `${STAGE.width} / ${STAGE.height}`, marginTop: pct(HEADROOM, STAGE.width) }}>
        {moon && <Moon moon={moon} cover={cover} />}
        {sunGlow && <SunGlow sunGlow={sunGlow} cover={cover} />}
        <div className="scene-ground" data-part="ground" style={{ top: pct(EAVES, STAGE.height) }} />
        <Layer name="house" src={layers.house} alt="The house, with solar panels on its roof" />
        <Sunlight layers={SUNLIGHT.house} sunlight={sunlight} />
        <svg className="scene-layer" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} data-part="lines" aria-hidden="true" ref={lines}>
          {(Object.keys(LEGS) as LegName[]).map((name) => (
            <polyline key={name} className="scene-line" data-part={`leg-${name}`} points={points(legPoints(name))} />
          ))}
          {cable && <polyline className="scene-line scene-cable" data-part="cable" points={points(cable)} />}
          {bySource(links).map(({ from, links: outs }) => (
            <SourceFlows key={from} from={from} links={outs} cable={cable} />
          ))}
        </svg>
        {layers.elements.map((element) => (
          <Layer key={element.name} {...element} />
        ))}
        <Sunlight layers={SUNLIGHT.panels} sunlight={sunlight} suffix="-panels" />
        {/* Opacity inline, like the night lights', so it never flashes on at first paint. */}
        <Layer {...layers.solarGlow} className="scene-render scene-glow" style={{ opacity: glow }} />
        {/* Over the Powerwall, and not dimmed at night: no scene-render. */}
        {charge != null && (
          <svg className="scene-layer" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} data-part="powerwall-charge" aria-hidden="true">
            <polygon points={points(chargeBarPoints(charge))} fill={FLOW_COLORS.powerwall} />
          </svg>
        )}
        {/* Shown by an inline style rather than the stylesheet, which can apply a
            moment after the first paint: by day the lights would flash on. */}
        <Layer {...layers.nightLights} className="scene-lights" style={{ opacity: dusk < 0.5 ? 0.75 : 0 }} />
        {layers.car && (
          <>
            <Layer name="car" src={layers.car.src} />
            {/* The plug sits over the car, in its charge port. */}
            <svg className="scene-layer scene-plug" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} data-part="plug" aria-hidden="true">
              <polyline points={points(layers.car.plug)} />
            </svg>
            <Layer {...layers.wallConnector!} />
          </>
        )}
        <Rain rain={state.rain ?? 0} dusk={dusk} wind={state.wind} />
        <Vane arrow={vaneArrow} pose={firstPose} text={windText(state.windSpeed, state.windGusts, state.windDirection)} />
        {(['solar', 'home', 'powerwall', 'grid'] as const).map((name) => (
          <Label key={name} name={name} title={LABELS[name].title} value={labels[name]} />
        ))}
        {car && <Label name="car" title={car.name} value={car.value} note={car.age} />}
      </div>
    </div>
  );
};

export default LiveScene;

