// hd-engine.js
// Dependency-free Human Design + Gene Keys + Western-Astrology chart engine.
// Pure ES module. Works in Node (`import`) and browser (`<script type="module">`).
//
// Astronomy: apparent geocentric tropical ecliptic longitudes via Meeus
// "Astronomical Algorithms" (2nd ed.):
//   - Sun:    ch.25 (geometric longitude + nutation + aberration)
//   - Moon:   ch.47 (abridged ELP periodic terms)
//   - Planets: ch.32/33 abridged VSOP87 (heliocentric -> geocentric apparent)
//   - Pluto:  ch.37 (Meeus periodic-term theory, valid 1885-2099)
//   - Node:   ch.47 true node (mean node + periodic corrections)
//
// All longitudes are returned in degrees [0, 360), tropical, apparent geocentric.
//
// Export: computeChart(input)

'use strict';

/* ============================================================
 *  Math helpers
 * ============================================================ */
const PI = Math.PI;
const DEG = PI / 180;
const RAD = 180 / PI;

function mod360(x) { return ((x % 360) + 360) % 360; }
function modTwoPi(x) { const t = 2 * PI; return ((x % t) + t) % t; }
function sind(d) { return Math.sin(d * DEG); }
function cosd(d) { return Math.cos(d * DEG); }
function tand(d) { return Math.tan(d * DEG); }

/* ============================================================
 *  Time: local civil -> UTC -> JD -> JDE (via dT)
 *  UTC = local - tzOffsetMinutes.
 * ============================================================ */

// Julian Day from a UTC calendar date+time (Gregorian, Meeus ch.7).
function julianDayUTC(year, month, day, hour, minute, second) {
  const dayFrac = day + (hour + minute / 60 + second / 3600) / 24;
  let Y = year, M = month;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) +
    dayFrac + B - 1524.5;
}

// Build JD(UTC) from a local time + tz offset (minutes east of UTC).
function jdFromLocal({ year, month, day, hour = 0, minute = 0, second = 0, tzOffsetMinutes = 0 }) {
  // UTC = local - tzOffset
  const jdLocal = julianDayUTC(year, month, day, hour, minute, second);
  return jdLocal - tzOffsetMinutes / 1440;
}

// dT (TT - UT) in seconds. Espenak & Meeus polynomial expressions.
function deltaTSeconds(year, month) {
  const y = year + (month - 0.5) / 12;
  let dt;
  if (year < -500) {
    const u = (y - 1820) / 100;
    dt = -20 + 32 * u * u;
  } else if (year < 500) {
    const u = y / 100;
    dt = 10583.6 - 1014.41 * u + 33.78311 * u * u - 5.952053 * u ** 3
      - 0.1798452 * u ** 4 + 0.022174192 * u ** 5 + 0.0090316521 * u ** 6;
  } else if (year < 1600) {
    const u = (y - 1000) / 100;
    dt = 1574.2 - 556.01 * u + 71.23472 * u * u + 0.319781 * u ** 3
      - 0.8503463 * u ** 4 - 0.005050998 * u ** 5 + 0.0083572073 * u ** 6;
  } else if (year < 1700) {
    const t = y - 1600;
    dt = 120 - 0.9808 * t - 0.01532 * t * t + t ** 3 / 7129;
  } else if (year < 1800) {
    const t = y - 1700;
    dt = 8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t ** 3 - t ** 4 / 1174000;
  } else if (year < 1860) {
    const t = y - 1800;
    dt = 13.72 - 0.332447 * t + 0.0068612 * t * t + 0.0041116 * t ** 3
      - 0.00037436 * t ** 4 + 0.0000121272 * t ** 5
      - 0.0000001699 * t ** 6 + 0.000000000875 * t ** 7;
  } else if (year < 1900) {
    const t = y - 1860;
    dt = 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t ** 3
      - 0.0004473624 * t ** 4 + t ** 5 / 233174;
  } else if (year < 1920) {
    const t = y - 1900;
    dt = -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  } else if (year < 1941) {
    const t = y - 1920;
    dt = 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t ** 3;
  } else if (year < 1961) {
    const t = y - 1950;
    dt = 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547;
  } else if (year < 1986) {
    const t = y - 1975;
    dt = 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718;
  } else if (year < 2005) {
    const t = y - 2000;
    dt = 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3
      + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
  } else if (year < 2050) {
    const t = y - 2000;
    dt = 62.92 + 0.32217 * t + 0.005589 * t * t;
  } else if (year < 2150) {
    const u = (y - 1820) / 100;
    dt = -20 + 32 * u * u - 0.5628 * (2150 - y);
  } else {
    const u = (y - 1820) / 100;
    dt = -20 + 32 * u * u;
  }
  return dt;
}

/* ============================================================
 *  Nutation & obliquity (Meeus ch.22)
 * ============================================================ */
function nutation(T) {
  // Longitudes in degrees
  const D = 297.85036 + 445267.111480 * T - 0.0019142 * T * T + T ** 3 / 189474;
  const M = 357.52772 + 35999.050340 * T - 0.0001603 * T * T - T ** 3 / 300000;
  const Mp = 134.96298 + 477198.867398 * T + 0.0086972 * T * T + T ** 3 / 56250;
  const F = 93.27191 + 483202.017538 * T - 0.0036825 * T * T + T ** 3 / 327270;
  const Om = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + T ** 3 / 450000;

  // Principal terms of the IAU 1980 series (arcsec * 1e-4)
  // [D, M, Mp, F, Om, dPsiSin0, dPsiSin1, dEpsCos0, dEpsCos1]
  const terms = [
    [0, 0, 0, 0, 1, -171996, -174.2, 92025, 8.9],
    [-2, 0, 0, 2, 2, -13187, -1.6, 5736, -3.1],
    [0, 0, 0, 2, 2, -2274, -0.2, 977, -0.5],
    [0, 0, 0, 0, 2, 2062, 0.2, -895, 0.5],
    [0, 1, 0, 0, 0, 1426, -3.4, 54, -0.1],
    [0, 0, 1, 0, 0, 712, 0.1, -7, 0],
    [-2, 1, 0, 2, 2, -517, 1.2, 224, -0.6],
    [0, 0, 0, 2, 1, -386, -0.4, 200, 0],
    [0, 0, 1, 2, 2, -301, 0, 129, -0.1],
    [-2, -1, 0, 2, 2, 217, -0.5, -95, 0.3],
    [-2, 0, 1, 0, 0, -158, 0, 0, 0],
    [-2, 0, 0, 2, 1, 129, 0.1, -70, 0],
    [0, 0, -1, 2, 2, 123, 0, -53, 0],
    [2, 0, 0, 0, 0, 63, 0, 0, 0],
    [0, 0, 1, 0, 1, 63, 0.1, -33, 0],
    [2, 0, -1, 2, 2, -59, 0, 26, 0],
    [0, 0, -1, 0, 1, -58, -0.1, 32, 0],
    [0, 0, 1, 2, 1, -51, 0, 27, 0],
    [-2, 0, 2, 0, 0, 48, 0, 0, 0],
    [0, 0, -2, 2, 1, 46, 0, -24, 0],
    [2, 0, 0, 2, 2, -38, 0, 16, 0],
    [0, 0, 2, 2, 2, -31, 0, 13, 0],
    [0, 0, 2, 0, 0, 29, 0, 0, 0],
    [-2, 0, 1, 2, 2, 29, 0, -12, 0],
    [0, 0, 0, 2, 0, 26, 0, 0, 0],
    [-2, 0, 0, 2, 0, -22, 0, 0, 0],
    [0, 0, -1, 2, 1, 21, 0, -10, 0],
    [0, 2, 0, 0, 0, 17, -0.1, 0, 0],
    [2, 0, -1, 0, 1, 16, 0, -8, 0],
    [-2, 2, 0, 2, 2, -16, 0.1, 7, 0],
    [0, 1, 0, 0, 1, -15, 0, 9, 0],
    [-2, 0, 1, 0, 1, -13, 0, 7, 0],
    [0, -1, 0, 0, 1, -12, 0, 6, 0],
    [0, 0, 2, -2, 0, 11, 0, 0, 0],
    [2, 0, -1, 2, 1, -10, 0, 5, 0],
    [2, 0, 1, 2, 2, -8, 0, 3, 0],
    [0, 1, 0, 2, 2, 7, 0, -3, 0],
    [-2, 1, 1, 0, 0, -7, 0, 0, 0],
    [0, -1, 0, 2, 2, -7, 0, 3, 0],
    [2, 0, 0, 2, 1, -7, 0, 3, 0],
    [2, 0, 1, 0, 0, 6, 0, 0, 0],
    [-2, 0, 2, 2, 2, 6, 0, -3, 0],
    [-2, 0, 1, 2, 1, 6, 0, -3, 0],
    [2, 0, -2, 0, 1, -6, 0, 3, 0],
    [2, 0, 0, 0, 1, -6, 0, 3, 0],
    [0, -1, 1, 0, 0, 5, 0, 0, 0],
    [-2, -1, 0, 2, 1, -5, 0, 3, 0],
    [-2, 0, 0, 0, 1, -5, 0, 3, 0],
    [0, 0, 2, 2, 1, -5, 0, 3, 0],
  ];

  let dPsi = 0, dEps = 0;
  for (const t of terms) {
    const arg = (t[0] * D + t[1] * M + t[2] * Mp + t[3] * F + t[4] * Om) * DEG;
    dPsi += (t[5] + t[6] * T) * Math.sin(arg);
    dEps += (t[7] + t[8] * T) * Math.cos(arg);
  }
  dPsi *= 1e-4 / 3600; // -> degrees
  dEps *= 1e-4 / 3600;
  return { dPsi, dEps, Om };
}

function meanObliquity(T) {
  // Meeus 22.2 (in degrees)
  const U = T / 100;
  return 23 + 26 / 60 + 21.448 / 3600
    - (4680.93 * U + 1.55 * U ** 2 - 1999.25 * U ** 3 - 51.38 * U ** 4
      + 249.67 * U ** 5 + 39.05 * U ** 6 - 7.12 * U ** 7
      + 27.87 * U ** 8 + 5.79 * U ** 9 + 2.45 * U ** 10) / 3600;
}

/* ============================================================
 *  Sun — Meeus ch.25 (apparent geocentric longitude)
 * ============================================================ */
function sunApparentLongitude(jde) {
  const T = (jde - 2451545.0) / 36525;
  const L0 = mod360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const Mr = M * DEG;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  const trueLon = L0 + C;
  // Apparent longitude: nutation + aberration
  const Om = 125.04 - 1934.136 * T;
  const lambda = trueLon - 0.00569 - 0.00478 * sind(Om);
  return mod360(lambda);
}

/* ============================================================
 *  Moon — Meeus ch.47 (abridged ELP)
 * ============================================================ */
// Periodic terms for longitude (table 47.A): [D, M, Mp, F, coefSinL]
const MOON_LON_TERMS = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314],
  [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
  [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322],
  [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034],
  [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888], [2, 1, 0, 0, -6766],
  [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665],
  [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
  [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120],
  [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
  [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110],
  [3, 0, -1, 0, -892], [2, 1, 1, 0, -810], [4, -1, -2, 0, 759],
  [0, 2, -1, 0, -713], [2, 2, -1, 0, -700], [2, 1, -2, 0, 691],
  [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
  [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399],
  [0, 0, 2, -2, -381], [1, 1, 1, 0, 351], [3, 0, -2, 0, -340],
  [4, 0, -3, 0, 330], [2, -1, 2, 0, 327], [0, 2, 1, 0, -323],
  [1, 1, -1, 0, 299], [2, 0, 3, 0, 294], [2, 0, -1, -2, 0],
];

function moonApparentLongitude(jde, dPsi) {
  const T = (jde - 2451545.0) / 36525;
  const Lp = mod360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T
    + T ** 3 / 538841 - T ** 4 / 65194000);
  const D = mod360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T
    + T ** 3 / 545868 - T ** 4 / 113065000);
  const M = mod360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T ** 3 / 24490000);
  const Mp = mod360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T
    + T ** 3 / 69699 - T ** 4 / 14712000);
  const F = mod360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T
    - T ** 3 / 3526000 + T ** 4 / 863310000);
  const A1 = mod360(119.75 + 131.849 * T);
  const A2 = mod360(53.09 + 479264.290 * T);
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;

  let sumL = 0;
  for (const t of MOON_LON_TERMS) {
    const [d, m, mp, f, coef] = t;
    if (coef === 0) continue;
    let arg = (d * D + m * M + mp * Mp + f * F) * DEG;
    let c = coef;
    if (Math.abs(m) === 1) c *= E;
    else if (Math.abs(m) === 2) c *= E * E;
    sumL += c * Math.sin(arg);
  }
  // Additive terms (Venus, Jupiter, flattening)
  sumL += 3958 * sind(A1) + 1962 * sind(Lp - F) + 318 * sind(A2);

  let lambda = Lp + sumL / 1000000;
  lambda += dPsi; // nutation in longitude -> apparent
  return mod360(lambda);
}

/* ============================================================
 *  True lunar node — Meeus ch.47 mean node + periodic corrections
 * ============================================================ */
function trueNodeLongitude(jde) {
  const T = (jde - 2451545.0) / 36525;
  // Mean ascending node (47.7)
  const Om = mod360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T
    + T ** 3 / 467441 - T ** 4 / 60616000);
  const D = mod360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T
    + T ** 3 / 545868);
  const M = mod360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const Mp = mod360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
  const F = mod360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T);
  // Principal periodic terms for the true node (Meeus, ch.47 / Chapront).
  // Corrections in degrees.
  const corr =
    -1.4979 * sind(2 * (D - F))
    - 0.1500 * sind(M)
    - 0.1226 * sind(2 * D)
    + 0.1176 * sind(2 * F)
    - 0.0801 * sind(2 * (Mp - F));
  return mod360(Om + corr);
}

/* ============================================================
 *  VSOP87 (abridged) — heliocentric L,B,R for planets + Earth
 *  Series from Meeus Appendix III (truncated to ~0.1 deg precision).
 *  Each entry: [A, B, C]; term = A * cos(B + C*tau). tau = T/10 (millennia).
 * ============================================================ */

function vsopSum(series, tau) {
  // series: array of arrays-of-terms (L0,L1,...). returns sum * tau^i
  let total = 0;
  for (let i = 0; i < series.length; i++) {
    let s = 0;
    const terms = series[i];
    for (let j = 0; j < terms.length; j++) {
      const t = terms[j];
      s += t[0] * Math.cos(t[1] + t[2] * tau);
    }
    total += s * Math.pow(tau, i);
  }
  return total;
}

// ---- The VSOP87 abridged data tables are large; defined below the file. ----
// Each planet provides { L:[...], B:[...], R:[...] } heliocentric (radians, AU).
import { VSOP } from './vsop87-data.js';

function heliocentric(planet, jde) {
  const tau = (jde - 2451545.0) / 365250.0;
  const data = VSOP[planet];
  // VSOP87 coefficients are tabulated in units of 1e-8 (radians for L,B; AU for R).
  const L = modTwoPi(vsopSum(data.L, tau) * 1e-8);
  const B = vsopSum(data.B, tau) * 1e-8;
  const R = vsopSum(data.R, tau) * 1e-8;
  return { L, B, R }; // radians, radians, AU
}

// Geocentric apparent ecliptic longitude of a planet (Meeus ch.33).
function planetApparentLongitude(planet, jde, dPsi) {
  // Earth heliocentric (rectangular)
  function rect(p, jd) {
    const { L, B, R } = heliocentric(p, jd);
    return {
      x: R * Math.cos(B) * Math.cos(L),
      y: R * Math.cos(B) * Math.sin(L),
      z: R * Math.sin(B),
      R,
    };
  }
  const earth = rect('Earth', jde);
  let pl = rect(planet, jde);
  // Light-time iteration
  let tauLT = 0;
  for (let it = 0; it < 3; it++) {
    const dx = pl.x - earth.x, dy = pl.y - earth.y, dz = pl.z - earth.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    tauLT = 0.0057755183 * dist; // days
    pl = rect(planet, jde - tauLT);
  }
  const dx = pl.x - earth.x, dy = pl.y - earth.y, dz = pl.z - earth.z;
  let lambda = Math.atan2(dy, dx) * RAD;
  // FK5 / aberration correction is small; add nutation in longitude for apparent
  lambda += dPsi;
  return mod360(lambda);
}

/* ============================================================
 *  Pluto — Meeus ch.37 (valid ~1885-2099)
 * ============================================================ */
const PLUTO_TERMS = [
  // [j, s, p, lonA, lonB, latA, latB, radA, radB]
  [0, 0, 1, -19799805, 19850055, -5452852, -14974862, 66865439, 68951812],
  [0, 0, 2, 897144, -4954829, 3527812, 1672790, -11827535, -332538],
  [0, 0, 3, 611149, 1211027, -1050748, 327647, 1593179, -1438890],
  [0, 0, 4, -341243, -189585, 178690, -292153, -18444, 483220],
  [0, 0, 5, 129287, -34992, 18650, 100340, -65977, -85431],
  [0, 0, 6, -38164, 30893, -30697, -25823, 31174, -6032],
  [0, 1, -1, 20442, -9987, 4878, 11248, -5794, 22161],
  [0, 1, 0, -4063, -5071, 226, -64, 4601, 4032],
  [0, 1, 1, -6016, -3336, 2030, -836, -1729, 234],
  [0, 1, 2, -3956, 3039, 69, -604, -415, 702],
  [0, 1, 3, -667, 3572, -247, -567, 239, 723],
  [0, 2, -2, 1276, 501, -57, 1, 67, -67],
  [0, 2, -1, 1152, -917, -122, 175, 1034, -451],
  [0, 2, 0, 630, -1277, -49, -164, -129, 504],
  [1, -1, 0, 2571, -459, -197, 199, 480, -231],
  [1, -1, 1, 899, -1449, -25, 217, 2, -441],
  [1, 0, -3, -1016, 1043, 589, -248, -3359, 265],
  [1, 0, -2, -2343, -1012, -269, 711, 7856, -7832],
  [1, 0, -1, 7042, 788, 185, 193, 36, 45763],
  [1, 0, 0, 1199, -338, 315, 807, 8663, 8547],
  [1, 0, 1, 418, -67, -130, -43, -809, -769],
  [1, 0, 2, 120, -274, 5, 3, 263, -144],
  [1, 0, 3, -60, -159, 2, 17, -126, 32],
  [1, 0, 4, -82, -29, 2, 5, -35, -16],
  [1, 1, -3, -36, -29, 2, 3, -19, -4],
  [1, 1, -2, -40, 7, 3, 1, -15, 8],
  [1, 1, -1, -14, 22, 2, -1, -4, 12],
  [1, 1, 0, 4, 13, 1, -1, 5, 6],
  [1, 1, 1, 5, 2, 0, -1, 3, 1],
  [1, 1, 3, -1, 0, 0, 0, 6, -2],
  [2, 0, -6, 2, 0, 0, -2, 2, 2],
  [2, 0, -5, -4, 5, 2, 2, -2, -2],
  [2, 0, -4, 4, -7, -7, 0, 14, 13],
  [2, 0, -3, 14, 24, 10, -8, -63, 13],
  [2, 0, -2, -49, -34, -3, 20, 136, -236],
  [2, 0, -1, 163, -48, 6, 5, 273, 1065],
  [2, 0, 0, 9, -24, 14, 17, 251, 149],
  [2, 0, 1, -4, 1, -2, 0, -25, -9],
  [2, 0, 2, -3, 1, 0, 0, 9, -2],
  [2, 0, 3, 1, 3, 0, 0, -8, 7],
  [3, 0, -2, -3, -1, 0, 1, 2, -10],
  [3, 0, -1, 5, -3, 0, 0, 19, 35],
  [3, 0, 0, 0, 0, 1, 0, 10, 3],
];

function plutoApparentLongitude(jde, dPsi) {
  const T = (jde - 2451545.0) / 36525;
  const J = 34.35 + 3034.9057 * T;
  const S = 50.08 + 1222.1138 * T;
  const P = 238.96 + 144.9600 * T;
  let lon = 0, lat = 0, r = 0;
  for (const t of PLUTO_TERMS) {
    const a = (t[0] * J + t[1] * S + t[2] * P) * DEG;
    const sa = Math.sin(a), ca = Math.cos(a);
    lon += t[3] * sa + t[4] * ca;
    lat += t[5] * sa + t[6] * ca;
    r += t[7] * sa + t[8] * ca;
  }
  const heLon = 238.958116 + 144.96 * T + lon * 1e-6;
  // ch.37 yields heliocentric ecliptic lon/lat. Convert to geocentric.
  const heLat = -3.908239 + lat * 1e-6;
  const radius = 40.7241346 + r * 1e-7;

  // Earth heliocentric rectangular
  const earth = heliocentric('Earth', jde);
  const ex = earth.R * Math.cos(earth.B) * Math.cos(earth.L);
  const ey = earth.R * Math.cos(earth.B) * Math.sin(earth.L);
  const ez = earth.R * Math.sin(earth.B);

  const px = radius * cosd(heLat) * cosd(heLon);
  const py = radius * cosd(heLat) * sind(heLon);
  const pz = radius * sind(heLat);

  const dx = px - ex, dy = py - ey;
  let lambda = Math.atan2(dy, dx) * RAD;
  lambda += dPsi;
  return mod360(lambda);
}

/* ============================================================
 *  Ascendant — Meeus ch.13/21
 * ============================================================ */
function localSiderealTime(jdUT, lonEast) {
  // Greenwich apparent sidereal time (Meeus 12.4), then add east longitude.
  const T = (jdUT - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jdUT - 2451545.0)
    + 0.000387933 * T * T - T ** 3 / 38710000;
  gmst = mod360(gmst);
  const { dPsi, dEps } = nutation(T);
  const eps = meanObliquity(T) + dEps;
  const gast = gmst + dPsi * cosd(eps); // apparent
  return mod360(gast + lonEast);
}

function ascendant(jdUT, lat, lonEast, eps) {
  const lst = localSiderealTime(jdUT, lonEast); // degrees
  const ramc = lst; // RA of midheaven = LST
  // Meeus 13: ascendant
  const num = -Math.cos(ramc * DEG);
  const den = Math.sin(ramc * DEG) * cosd(eps) + tand(lat) * sind(eps);
  let asc = Math.atan2(num, den) * RAD;
  return mod360(asc);
}

/* ============================================================
 *  Body longitudes at a JD(UTC) instant
 * ============================================================ */
function bodyLongitudes(jdUT, year, month) {
  const dT = deltaTSeconds(year, month);
  const jde = jdUT + dT / 86400;
  const T = (jde - 2451545.0) / 36525;
  const { dPsi } = nutation(T);

  const sun = sunApparentLongitude(jde);
  const moon = moonApparentLongitude(jde, dPsi);
  const node = trueNodeLongitude(jde);

  return {
    Sun: sun,
    Earth: mod360(sun + 180),
    Moon: moon,
    NorthNode: node,
    SouthNode: mod360(node + 180),
    Mercury: planetApparentLongitude('Mercury', jde, dPsi),
    Venus: planetApparentLongitude('Venus', jde, dPsi),
    Mars: planetApparentLongitude('Mars', jde, dPsi),
    Jupiter: planetApparentLongitude('Jupiter', jde, dPsi),
    Saturn: planetApparentLongitude('Saturn', jde, dPsi),
    Uranus: planetApparentLongitude('Uranus', jde, dPsi),
    Neptune: planetApparentLongitude('Neptune', jde, dPsi),
    Pluto: plutoApparentLongitude(jde, dPsi),
    _jde: jde,
    _eps: meanObliquity(T) + nutation(T).dEps,
  };
}

// Raw apparent Sun longitude at a JD(UTC) (for design-moment solving / sanity).
function sunLonAtJDUT(jdUT, year, month) {
  const dT = deltaTSeconds(year, month);
  const jde = jdUT + dT / 86400;
  return sunApparentLongitude(jde);
}

/* ============================================================
 *  Human Design constants (verbatim per spec)
 * ============================================================ */
const GATE_WHEEL = [41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60];

const CENTER_OF_GATE = { 61: 'Head', 63: 'Head', 64: 'Head', 47: 'Ajna', 24: 'Ajna', 4: 'Ajna', 17: 'Ajna', 43: 'Ajna', 11: 'Ajna', 62: 'Throat', 23: 'Throat', 56: 'Throat', 35: 'Throat', 12: 'Throat', 45: 'Throat', 33: 'Throat', 8: 'Throat', 31: 'Throat', 20: 'Throat', 16: 'Throat', 1: 'G', 13: 'G', 25: 'G', 46: 'G', 2: 'G', 15: 'G', 10: 'G', 7: 'G', 21: 'Heart', 40: 'Heart', 26: 'Heart', 51: 'Heart', 5: 'Sacral', 14: 'Sacral', 29: 'Sacral', 59: 'Sacral', 9: 'Sacral', 3: 'Sacral', 42: 'Sacral', 27: 'Sacral', 34: 'Sacral', 6: 'SolarPlexus', 37: 'SolarPlexus', 22: 'SolarPlexus', 36: 'SolarPlexus', 30: 'SolarPlexus', 55: 'SolarPlexus', 49: 'SolarPlexus', 48: 'Spleen', 57: 'Spleen', 44: 'Spleen', 50: 'Spleen', 32: 'Spleen', 28: 'Spleen', 18: 'Spleen', 53: 'Root', 60: 'Root', 52: 'Root', 19: 'Root', 39: 'Root', 41: 'Root', 58: 'Root', 38: 'Root', 54: 'Root' };

const CHANNELS = [{ gates: [1, 8], centers: ['G', 'Throat'] }, { gates: [2, 14], centers: ['G', 'Sacral'] }, { gates: [3, 60], centers: ['Sacral', 'Root'] }, { gates: [4, 63], centers: ['Ajna', 'Head'] }, { gates: [5, 15], centers: ['Sacral', 'G'] }, { gates: [6, 59], centers: ['SolarPlexus', 'Sacral'] }, { gates: [7, 31], centers: ['G', 'Throat'] }, { gates: [9, 52], centers: ['Sacral', 'Root'] }, { gates: [10, 20], centers: ['G', 'Throat'] }, { gates: [10, 34], centers: ['G', 'Sacral'] }, { gates: [10, 57], centers: ['G', 'Spleen'] }, { gates: [11, 56], centers: ['Ajna', 'Throat'] }, { gates: [12, 22], centers: ['Throat', 'SolarPlexus'] }, { gates: [13, 33], centers: ['G', 'Throat'] }, { gates: [16, 48], centers: ['Throat', 'Spleen'] }, { gates: [17, 62], centers: ['Ajna', 'Throat'] }, { gates: [18, 58], centers: ['Spleen', 'Root'] }, { gates: [19, 49], centers: ['Root', 'SolarPlexus'] }, { gates: [20, 34], centers: ['Throat', 'Sacral'] }, { gates: [20, 57], centers: ['Throat', 'Spleen'] }, { gates: [21, 45], centers: ['Heart', 'Throat'] }, { gates: [23, 43], centers: ['Throat', 'Ajna'] }, { gates: [24, 61], centers: ['Ajna', 'Head'] }, { gates: [25, 51], centers: ['G', 'Heart'] }, { gates: [26, 44], centers: ['Heart', 'Spleen'] }, { gates: [27, 50], centers: ['Sacral', 'Spleen'] }, { gates: [28, 38], centers: ['Spleen', 'Root'] }, { gates: [29, 46], centers: ['Sacral', 'G'] }, { gates: [30, 41], centers: ['SolarPlexus', 'Root'] }, { gates: [32, 54], centers: ['Spleen', 'Root'] }, { gates: [34, 57], centers: ['Sacral', 'Spleen'] }, { gates: [35, 36], centers: ['Throat', 'SolarPlexus'] }, { gates: [37, 40], centers: ['SolarPlexus', 'Heart'] }, { gates: [39, 55], centers: ['Root', 'SolarPlexus'] }, { gates: [42, 53], centers: ['Sacral', 'Root'] }, { gates: [47, 64], centers: ['Ajna', 'Head'] }];

const ALL_CENTERS = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Sacral', 'SolarPlexus', 'Spleen', 'Root'];
const MOTORS = ['Sacral', 'Heart', 'SolarPlexus', 'Root'];
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

/* ============================================================
 *  Gate / line from longitude
 *  Gate index i spans [302 + i*5.625, 302 + (i+1)*5.625) mod 360.
 * ============================================================ */
function gateOf(lon) {
  const rel = mod360(lon - 302); // degrees from start of wheel
  const idx = Math.floor(rel / 5.625) % 64;
  return GATE_WHEEL[idx];
}
function lineOf(lon) {
  const rel = mod360(lon - 302);
  const within = rel % 5.625;
  return Math.floor(within / 0.9375) + 1; // 1..6
}
function signOf(lon) {
  return SIGNS[Math.floor(mod360(lon) / 30)];
}

/* ============================================================
 *  Design moment: Sun was at (personalitySun - 88) deg.
 *  Solve via bracketing + bisection on UTC JD ~88 days earlier.
 * ============================================================ */
function findDesignJD(personalitySunLon, birthJDUT, birthYear, birthMonth) {
  const target = mod360(personalitySunLon - 88);
  // Sun moves ~0.9856 deg/day; 88 deg ~ 89.3 days before birth.
  function sunLonAt(jd) {
    // approximate the year/month for dT from jd
    const { y, m } = jdToYM(jd);
    return sunLonAtJDUT(jd, y, m);
  }
  // Signed angular difference, wrapped to [-180,180]
  function diff(jd) {
    let d = sunLonAt(jd) - target;
    d = ((d + 180) % 360 + 360) % 360 - 180;
    return d;
  }
  let lo = birthJDUT - 95;
  let hi = birthJDUT - 83;
  let flo = diff(lo), fhi = diff(hi);
  // Ensure bracket; expand if needed
  let guard = 0;
  while (flo * fhi > 0 && guard < 30) {
    lo -= 1; hi += 1;
    flo = diff(lo); fhi = diff(hi);
    guard++;
  }
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fm = diff(mid);
    if (Math.abs(fm) < 1e-9) return mid;
    if (flo * fm <= 0) { hi = mid; fhi = fm; }
    else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

// crude JD -> year/month for dT lookup
function jdToYM(jd) {
  const Z = Math.floor(jd + 0.5);
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  return { y: year, m: month };
}

/* ============================================================
 *  Human Design derivation
 * ============================================================ */
function deriveHD(personalityLongs, designLongs) {
  const bodyOrder = ['Sun', 'Earth', 'Moon', 'NorthNode', 'SouthNode',
    'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

  const personalityGates = {};
  const designGates = {};
  const activeGates = new Set();
  for (const b of bodyOrder) {
    const pg = gateOf(personalityLongs[b]);
    const dg = gateOf(designLongs[b]);
    personalityGates[b] = { gate: pg, line: lineOf(personalityLongs[b]) };
    designGates[b] = { gate: dg, line: lineOf(designLongs[b]) };
    activeGates.add(pg);
    activeGates.add(dg);
  }

  // Defined centers + complete channels
  const definedCenters = new Set();
  const completeChannels = [];
  for (const ch of CHANNELS) {
    if (activeGates.has(ch.gates[0]) && activeGates.has(ch.gates[1])) {
      completeChannels.push(ch);
      definedCenters.add(ch.centers[0]);
      definedCenters.add(ch.centers[1]);
    }
  }

  // Motor-to-Throat via BFS over complete-channel graph
  function motorWiredToThroat() {
    if (!definedCenters.has('Throat')) return false;
    const adj = {};
    for (const ch of completeChannels) {
      const [a, b] = ch.centers;
      (adj[a] = adj[a] || []).push(b);
      (adj[b] = adj[b] || []).push(a);
    }
    const seen = new Set(['Throat']);
    const queue = ['Throat'];
    while (queue.length) {
      const cur = queue.shift();
      if (MOTORS.includes(cur)) return true;
      for (const nb of (adj[cur] || [])) {
        if (!seen.has(nb)) { seen.add(nb); queue.push(nb); }
      }
    }
    return false;
  }

  const nDefined = definedCenters.size;
  const sacral = definedCenters.has('Sacral');
  const motorThroat = motorWiredToThroat();

  let type, strategy;
  if (nDefined === 0) {
    type = 'Reflector'; strategy = 'Wait a lunar cycle';
  } else if (sacral && motorThroat) {
    type = 'Manifesting Generator'; strategy = 'To respond, then inform';
  } else if (sacral && !motorThroat) {
    type = 'Generator'; strategy = 'To respond';
  } else if (!sacral && motorThroat) {
    type = 'Manifestor'; strategy = 'To inform, then initiate';
  } else {
    type = 'Projector'; strategy = 'Wait for the invitation';
  }

  // Authority priority
  let authority;
  if (definedCenters.has('SolarPlexus')) authority = 'Emotional';
  else if (definedCenters.has('Sacral')) authority = 'Sacral';
  else if (definedCenters.has('Spleen')) authority = 'Splenic';
  else if (definedCenters.has('Heart')) authority = 'Ego';
  else if (definedCenters.has('G')) authority = 'Self/G';
  else if (type === 'Projector') authority = 'Mental/Environmental';
  else if (type === 'Reflector') authority = 'Lunar';
  else authority = 'None';

  const pSunLine = lineOf(personalityLongs.Sun);
  const dSunLine = lineOf(designLongs.Sun);
  const profile = `${pSunLine}/${dSunLine}`;

  const personalityGatesList = bodyOrder.map(b => personalityGates[b].gate);
  const designGatesList = bodyOrder.map(b => designGates[b].gate);

  return {
    type, strategy, authority, profile,
    definedCenters: ALL_CENTERS.filter(c => definedCenters.has(c)),
    openCenters: ALL_CENTERS.filter(c => !definedCenters.has(c)),
    personalityGates: personalityGatesList,
    designGates: designGatesList,
    incarnationCross: {
      personalitySun: gateOf(personalityLongs.Sun),
      personalityEarth: gateOf(personalityLongs.Earth),
      designSun: gateOf(designLongs.Sun),
      designEarth: gateOf(designLongs.Earth),
    },
    _detail: { personalityGates, designGates },
  };
}

/* ============================================================
 *  Public API
 * ============================================================ */
export function computeChart(input) {
  const {
    year, month, day, hour = 0, minute = 0, second = 0,
    tzOffsetMinutes = 0, lat, lon,
  } = input;

  // 1. Birth instant: local -> UTC -> JD(UTC)
  const birthJDUT = jdFromLocal({ year, month, day, hour, minute, second, tzOffsetMinutes });

  // 2. Personality (birth) longitudes
  const personality = bodyLongitudes(birthJDUT, year, month);

  // 3. Design moment: Sun at personalitySun - 88 deg
  const designJDUT = findDesignJD(personality.Sun, birthJDUT, year, month);
  const dYM = jdToYM(designJDUT);
  const design = bodyLongitudes(designJDUT, dYM.y, dYM.m);

  // 4. HD derivation
  const hd = deriveHD(personality, design);

  // 5. Gene Keys
  const gk = {
    lifesWork: gateOf(personality.Sun),
    evolution: gateOf(personality.Earth),
    radiance: gateOf(design.Sun),
    purpose: gateOf(design.Earth),
  };

  // 6. Astrology
  let rising = null;
  if (typeof lat === 'number' && typeof lon === 'number') {
    const ascLon = ascendant(birthJDUT, lat, lon, personality._eps);
    rising = signOf(ascLon);
  }
  const astro = {
    sun: signOf(personality.Sun),
    moon: signOf(personality.Moon),
    rising,
  };

  return {
    hd,
    gk,
    astro,
    _engine: 'meeus',
    precisionNote:
      'Apparent geocentric tropical longitudes via Meeus 2nd ed.: Sun (ch.25, ~0.01deg), ' +
      'Moon (ch.47 abridged ELP, ~0.05deg), planets (abridged VSOP87 ch.32/33, ~0.1deg), ' +
      'Pluto (ch.37, ~0.2deg, valid 1885-2099), true node (ch.47 mean+periodic). ' +
      'Time chain: local - tzOffsetMinutes = UTC -> JD -> JDE via Espenak-Meeus dT. ' +
      'Gate-level definition derived from an abridged ephemeris (good to ~0.1deg, ' +
      'not Swiss-Ephemeris-exact precisely at gate boundaries).',
    _raw: { personality, design, birthJDUT, designJDUT },
  };
}

// Expose internals for testing/sanity (not part of the stable API).
export const _internals = {
  sunLonAtJDUT, julianDayUTC, jdFromLocal, bodyLongitudes,
  gateOf, lineOf, signOf, deltaTSeconds,
};
