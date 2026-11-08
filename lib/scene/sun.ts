// Sunrise and sunset at the site, so the live scene shows day and night as the
// sky does, whatever the panels produce and before any live data arrives.
// The standard solar-position formulas (as in NOAA's calculator), in UTC, so
// the viewer's own time zone doesn't matter; accurate to about a minute.

// Half Moon Bay, rounded to about 11 km so the public page doesn't point at the
// house; that moves sunrise and sunset by well under a minute.
export const SITE = { lat: 37.5, lon: -122.4 };

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const J0 = 0.0009;
// The sun's upper edge on the horizon, allowing for refraction.
const HORIZON = -0.833 * RAD;
const OBLIQUITY = 23.4397 * RAD;

export const toDays = (date: Date) => date.valueOf() / DAY_MS - 0.5 + J1970 - J2000;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * DAY_MS);

// Radians west of the site's meridian, for a right ascension in degrees.
const hourAngleAt = (ascension: number, date: Date, lon: number) => RAD * (280.16 + 360.9856235 * toDays(date) + lon - ascension);

// Radians in and out.
const equatorial = (longitude: number, latitude: number) => ({
  ascension: Math.atan2(Math.sin(longitude) * Math.cos(OBLIQUITY) - Math.tan(latitude) * Math.sin(OBLIQUITY), Math.cos(longitude)),
  declination: Math.asin(Math.sin(latitude) * Math.cos(OBLIQUITY) + Math.cos(latitude) * Math.sin(OBLIQUITY) * Math.sin(longitude)),
});

// Degrees in and out; azimuth clockwise from north. Shared by the sun, the moon, the stars and the planets.
export const horizontal = (ascension: number, declination: number, date: Date, { lat, lon } = SITE) => {
  const phi = lat * RAD;
  const delta = declination * RAD;
  const hourAngle = hourAngleAt(ascension, date, lon);
  const altitude = Math.asin(Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(hourAngle));
  const azimuth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi));
  return { altitude: altitude / RAD, azimuth: (azimuth / RAD + 540) % 360 };
};

// Of the solar day containing `date`, not its calendar day, so they never straddle midnight at the site.
export const sunTimes = (date: Date, { lat, lon } = SITE) => {
  const lw = -lon * RAD;
  const phi = lat * RAD;
  const cycle = Math.round(toDays(date) - J0 - lw / (2 * Math.PI));
  const approx = J0 + lw / (2 * Math.PI) + cycle;
  const anomaly = RAD * (357.5291 + 0.98560028 * approx);
  const centre = RAD * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly));
  const longitude = anomaly + centre + RAD * 102.9372 + Math.PI;
  const declination = Math.asin(Math.sin(OBLIQUITY) * Math.sin(longitude));
  const transit = (ds: number) => J2000 + ds + 0.0053 * Math.sin(anomaly) - 0.0069 * Math.sin(2 * longitude);
  const hourAngle = Math.acos((Math.sin(HORIZON) - Math.sin(phi) * Math.sin(declination)) / (Math.cos(phi) * Math.cos(declination)));
  const noon = transit(approx);
  const set = transit(J0 + (hourAngle + lw) / (2 * Math.PI) + cycle);
  return { sunrise: fromJulian(noon - (set - noon)), sunset: fromJulian(set) };
};

// Radians, `d` days from J2000.
const sunLongitude = (d: number) => {
  const anomaly = RAD * (357.5291 + 0.98560028 * d);
  const centre = RAD * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly));
  return anomaly + centre + RAD * 102.9372 + Math.PI;
};

// Degrees. The noon altitude sets the season's peak for the house's sunlight.
export const sunPosition = (date: Date, { lat, lon } = SITE) => {
  const d = toDays(date);
  const { ascension, declination } = equatorial(sunLongitude(d), 0);
  return { ...horizontal(ascension / RAD, declination / RAD, date, { lat, lon }), noonAltitude: 90 - Math.abs(lat - declination / RAD) };
};

// The moon's ecliptic longitude and latitude `d` days from J2000, in radians,
// from its mean orbit and largest terms (Meeus ch. 47): about a third of a degree,
// close enough for its libration, which is its true longitude less its mean one.
const moonEcliptic = (d: number) => {
  const meanLongitude = RAD * (218.316 + 13.176396 * d);
  const anomaly = RAD * (134.963 + 13.064993 * d);
  const argument = RAD * (93.272 + 13.22935 * d);
  const elongation = RAD * (297.85 + 12.190749 * d);
  const sunAnomaly = RAD * (357.529 + 0.98560028 * d);
  const terms = 6.289 * Math.sin(anomaly) + 1.274 * Math.sin(2 * elongation - anomaly)
    + 0.658 * Math.sin(2 * elongation) - 0.186 * Math.sin(sunAnomaly);
  return { longitude: meanLongitude + RAD * terms, latitude: RAD * 5.128 * Math.sin(argument), argument };
};

export const moonPosition = (date: Date, { lat, lon } = SITE) => {
  const { longitude, latitude } = moonEcliptic(toDays(date));
  const { ascension, declination } = equatorial(longitude, latitude);
  return horizontal(ascension / RAD, declination / RAD, date, { lat, lon });
};

const MOON_EQUATOR_TILT = 1.54242 * RAD;
const degrees = (angle: number) => ((angle / RAD) % 360 + 540) % 360 - 180;

// How the moon faces us at the site at `date`, in degrees: `libration`, the
// point of its surface nearest Earth (Meeus ch. 53, its optical part; the rest is
// hundredths of a degree), and, counterclockwise from straight up in the sky,
// `axis`, where its north pole points, and `brightLimb`, the side the sunlight comes
// from (Meeus ch. 48). Each is a position angle from celestial north less the
// parallactic angle, which turns celestial north to straight up (Meeus ch. 14).
export const moonOrientation = (date: Date, { lat, lon } = SITE) => {
  const d = toDays(date);
  const moon = moonEcliptic(d);
  const node = RAD * (125.045 - 0.0529538 * d);
  const w = moon.longitude - node;
  const beta = moon.latitude;
  const along = Math.atan2(Math.sin(w) * Math.cos(beta) * Math.cos(MOON_EQUATOR_TILT) - Math.sin(beta) * Math.sin(MOON_EQUATOR_TILT), Math.cos(w) * Math.cos(beta));
  const latitude = Math.asin(-Math.sin(w) * Math.cos(beta) * Math.sin(MOON_EQUATOR_TILT) - Math.sin(beta) * Math.cos(MOON_EQUATOR_TILT));

  const { ascension, declination } = equatorial(moon.longitude, beta);
  const x = Math.sin(MOON_EQUATOR_TILT) * Math.sin(node);
  const y = Math.sin(MOON_EQUATOR_TILT) * Math.cos(node) * Math.cos(OBLIQUITY) - Math.cos(MOON_EQUATOR_TILT) * Math.sin(OBLIQUITY);
  const pole = Math.asin(Math.hypot(x, y) * Math.cos(ascension - Math.atan2(x, y)) / Math.cos(latitude));

  const sun = equatorial(sunLongitude(d), 0);
  const toSun = sun.ascension - ascension;
  const bright = Math.atan2(Math.cos(sun.declination) * Math.sin(toSun),
    Math.sin(sun.declination) * Math.cos(declination) - Math.cos(sun.declination) * Math.sin(declination) * Math.cos(toSun));

  const hourAngle = hourAngleAt(ascension / RAD, date, lon);
  const parallactic = Math.atan2(Math.sin(hourAngle), Math.tan(lat * RAD) * Math.cos(declination) - Math.sin(declination) * Math.cos(hourAngle));

  return {
    libration: { longitude: degrees(along - moon.argument), latitude: latitude / RAD },
    axis: degrees(pole - parallactic),
    brightLimb: degrees(bright - parallactic),
  };
};

// The moon's phase at `date` as a fraction of a turn: 0 new, 0.25 first
// quarter, 0.5 full, 0.75 last quarter; its angle ahead of the sun along the ecliptic.
export const moonPhase = (date: Date) => {
  const d = toDays(date);
  const turn = (moonEcliptic(d).longitude - sunLongitude(d)) / (2 * Math.PI);
  return turn - Math.floor(turn);
};

export const skyAt = (now: Date, site = SITE) => {
  const { sunrise, sunset } = sunTimes(now, site);
  return now >= sunrise && now < sunset ? "day" : "night";
};
