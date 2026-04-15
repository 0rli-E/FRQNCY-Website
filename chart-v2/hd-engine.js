// FRQNCY Human Design Engine — v2 (calibration build)
// ------------------------------------------------------
// Uses astronomy-engine (Don Cross, MIT) for sub-arcsec planetary positions.
// Loads from esm.sh at module load. No server needed.
//
// HD conventions applied here (verify against fixtures before trusting):
//  - Tropical ecliptic longitudes, apparent geocentric (incl. nutation/aberration)
//  - Gate wheel starting at Gate 25, with WHEEL_OFFSET° shifting the start
//    position from 0° Aries. Tunable from calibration harness.
//  - Design moment = exact 88° of solar arc before birth (Newton iterated)
//  - North Node = MEAN node (Meeus 47.7); South Node = +180°
//  - Earth = Sun + 180° (Personality & Design)
//  - Moon computed both at birth (Personality) and design (Design)
//
// Remaining work (see calibration.html):
//  - nail WHEEL_OFFSET against ≥5 Jovian Archive fixtures
//  - verify node convention (mean vs true) matches Jovian Archive
//  - validate design solver uses 88.0° exactly (some sources use 88.3°)

import * as Astronomy from 'https://esm.sh/astronomy-engine@2.1.19';

// ── Canonical HD Rave Mandala sequence ────────────────────────────────
// Starts with Gate 25 at position 0 and proceeds in zodiacal order.
// Each position spans 360/64 = 5.625° of ecliptic longitude.
// Source: cross-referenced Genetic Matrix, BodyGraph-chart open source,
// and the Rave I'Ching mandala in "The Definitive Book of Human Design."
export const RAVE_WHEEL = [
  25, 17, 21, 51, 42,  3, 27, 24,  2, 23,
   8, 20, 16, 35, 45, 12, 15, 52, 39, 53,
  62, 56, 31, 33,  7,  4, 29, 59, 40, 64,
  47,  6, 46, 18, 48, 57, 32, 50, 28, 44,
   1, 43, 14, 34,  9,  5, 26, 11, 10, 58,
  38, 54, 61, 60, 41, 19, 13, 49, 30, 55,
  37, 63, 22, 36
];

// Wheel offset in degrees. Default of 1.5 places Gate 25 starting at
// 358.5° Aries (i.e., the wheel is rotated 1.5° clockwise from Aries 0°).
// Tune via calibration.html until all fixture charts match.
export let WHEEL_OFFSET = 1.5;
export function setWheelOffset(deg) { WHEEL_OFFSET = deg; }

// ── HD body set ───────────────────────────────────────────────────────
// Order matches Jovian Archive's standard listing.
export const HD_BODIES = [
  'Sun', 'Earth', 'Moon', 'NorthNode', 'SouthNode',
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto'
];

// Centres each gate belongs to — standard HD map.
export const GATE_CENTRE = {
  // Head
  64:'Head', 61:'Head', 63:'Head',
  // Ajna
  47:'Ajna', 24:'Ajna', 4:'Ajna', 17:'Ajna', 43:'Ajna', 11:'Ajna',
  // Throat
  62:'Throat', 23:'Throat', 56:'Throat', 16:'Throat', 20:'Throat',
  31:'Throat', 8:'Throat', 33:'Throat', 35:'Throat', 12:'Throat',
  45:'Throat',
  // G
  1:'G', 13:'G', 25:'G', 46:'G', 2:'G', 15:'G', 10:'G', 7:'G',
  // Heart (Ego/Will)
  21:'Heart', 40:'Heart', 26:'Heart', 51:'Heart',
  // Solar Plexus
  6:'SolarPlexus', 37:'SolarPlexus', 22:'SolarPlexus', 36:'SolarPlexus',
  49:'SolarPlexus', 55:'SolarPlexus', 30:'SolarPlexus',
  // Sacral
  34:'Sacral', 5:'Sacral', 14:'Sacral', 29:'Sacral', 59:'Sacral',
  9:'Sacral', 3:'Sacral', 42:'Sacral', 27:'Sacral',
  // Spleen
  48:'Spleen', 57:'Spleen', 44:'Spleen', 50:'Spleen', 32:'Spleen',
  28:'Spleen', 18:'Spleen',
  // Root
  53:'Root', 60:'Root', 52:'Root', 19:'Root', 39:'Root', 41:'Root',
  58:'Root', 38:'Root', 54:'Root'
};

// Channels (24 classical). [gateA, gateB, centreA, centreB]
export const CHANNELS = [
  [1,8,'G','Throat'],        [2,14,'G','Sacral'],
  [3,60,'Sacral','Root'],    [4,63,'Ajna','Head'],
  [5,15,'Sacral','G'],       [6,59,'SolarPlexus','Sacral'],
  [7,31,'G','Throat'],       [9,52,'Sacral','Root'],
  [10,20,'G','Throat'],      [10,34,'G','Sacral'],
  [10,57,'G','Spleen'],      [11,56,'Ajna','Throat'],
  [12,22,'Throat','SolarPlexus'], [13,33,'G','Throat'],
  [16,48,'Throat','Spleen'], [17,62,'Ajna','Throat'],
  [18,58,'Spleen','Root'],   [19,49,'Root','SolarPlexus'],
  [20,34,'Throat','Sacral'], [20,57,'Throat','Spleen'],
  [21,45,'Heart','Throat'],  [23,43,'Throat','Ajna'],
  [24,61,'Ajna','Head'],     [25,51,'G','Heart'],
  [26,44,'Heart','Spleen'],  [27,50,'Sacral','Spleen'],
  [28,38,'Spleen','Root'],   [29,46,'Sacral','G'],
  [30,41,'SolarPlexus','Root'], [32,54,'Spleen','Root'],
  [34,57,'Sacral','Spleen'], [35,36,'Throat','SolarPlexus'],
  [37,40,'SolarPlexus','Heart'], [39,55,'Root','SolarPlexus'],
  [42,53,'Sacral','Root'],   [47,64,'Ajna','Head']
];

const MOTORS = new Set(['Sacral','Heart','SolarPlexus','Root']);

// ── Geometry helpers ──────────────────────────────────────────────────
const norm360 = d => ((d % 360) + 360) % 360;

// Convert ecliptic longitude → { gate, line, color, tone, base }
export function lonToGateLine(lon) {
  const x = norm360(lon + WHEEL_OFFSET);
  const idx = Math.floor(x / 5.625) % 64;
  const within = x - idx * 5.625;         // 0..5.625
  const line   = Math.floor(within / (5.625 / 6)) + 1;   // 1..6
  const colorF = (within % (5.625 / 6)) / (5.625 / 6);   // 0..1
  const color  = Math.min(6, Math.floor(colorF * 6) + 1);
  const toneF  = (colorF * 6) % 1;
  const tone   = Math.min(6, Math.floor(toneF * 6) + 1);
  const baseF  = (toneF * 6) % 1;
  const base   = Math.min(5, Math.floor(baseF * 5) + 1);
  return { gate: RAVE_WHEEL[idx], line, color, tone, base };
}

// ── Planetary longitude via astronomy-engine ──────────────────────────
// Returns apparent geocentric ecliptic longitude (degrees 0-360).
function eclLon(body, date) {
  return norm360(Astronomy.EclipticLongitude(body, date));
}

// Sun
function sunLon(date)  { return eclLon(Astronomy.Body.Sun, date); }
// Earth = Sun + 180°
function earthLon(date){ return norm360(sunLon(date) + 180); }
// Moon (geocentric apparent)
function moonLon(date) {
  // Astronomy.GeoMoon returns equatorial; easier: Astronomy.EclipticGeoMoon
  const ecl = Astronomy.EclipticGeoMoon(date);
  return norm360(ecl.lon);
}
// Mean Lunar Node (Meeus 47.7). Agreed HD convention is the MEAN node.
function meanNodeLon(date) {
  const jd  = julianDay(date);
  const T   = (jd - 2451545.0) / 36525;
  const Om  = 125.0445479 - 1934.1362891*T + 0.0020754*T*T
              + T*T*T/467441 - T*T*T*T/60616000;
  return norm360(Om);
}
function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// ── Design moment: 88° of solar arc before birth ──────────────────────
// Newton iteration against apparent sun longitude.
export function findDesignDate(birthDate) {
  const sunBirth = sunLon(birthDate);
  const target   = norm360(sunBirth - 88);
  // Start ~88 days before (solar motion ≈ 1°/day)
  let d = new Date(birthDate.getTime() - 88 * 86400000);
  for (let i = 0; i < 30; i++) {
    const s   = sunLon(d);
    let diff  = ((s - target + 540) % 360) - 180;  // signed diff
    if (Math.abs(diff) < 1e-6) break;
    // ~1°/day; step backward in time to decrease sun longitude
    d = new Date(d.getTime() - diff * 86400000);
  }
  return d;
}

// ── Full chart activations ────────────────────────────────────────────
export function activationsAt(date) {
  const sun = sunLon(date), earth = norm360(sun + 180);
  const moon = moonLon(date);
  const nn   = meanNodeLon(date), sn = norm360(nn + 180);
  const mer  = eclLon(Astronomy.Body.Mercury, date);
  const ven  = eclLon(Astronomy.Body.Venus,   date);
  const mar  = eclLon(Astronomy.Body.Mars,    date);
  const jup  = eclLon(Astronomy.Body.Jupiter, date);
  const sat  = eclLon(Astronomy.Body.Saturn,  date);
  const ura  = eclLon(Astronomy.Body.Uranus,  date);
  const nep  = eclLon(Astronomy.Body.Neptune, date);
  const plu  = eclLon(Astronomy.Body.Pluto,   date);
  const lons = [sun, earth, moon, nn, sn, mer, ven, mar, jup, sat, ura, nep, plu];
  const out  = {};
  HD_BODIES.forEach((b, i) => { out[b] = { lon: lons[i], ...lonToGateLine(lons[i]) }; });
  return out;
}

// ── Full HD chart ─────────────────────────────────────────────────────
// birthUTC: JS Date in true UTC. If you have local time + IANA tz, convert
// via `localToUTC(localISO, ianaZone)` below before calling.
export function computeChart(birthUTC) {
  const designUTC = findDesignDate(birthUTC);
  const P = activationsAt(birthUTC);
  const D = activationsAt(designUTC);

  // Set of defined gates across both sides
  const activeGates = new Set();
  Object.values(P).forEach(a => activeGates.add(a.gate));
  Object.values(D).forEach(a => activeGates.add(a.gate));

  // Defined centres = centres with ≥1 complete channel passing through
  const channelsActive = CHANNELS.filter(
    ([a,b]) => activeGates.has(a) && activeGates.has(b)
  );
  const definedCentres = new Set();
  channelsActive.forEach(([,,cA,cB]) => { definedCentres.add(cA); definedCentres.add(cB); });

  // Type determination
  const sacralDef = definedCentres.has('Sacral');
  const throatDef = definedCentres.has('Throat');
  const motorToThroat = channelsActive.some(
    ([,,cA,cB]) => (MOTORS.has(cA) && cB==='Throat') || (MOTORS.has(cB) && cA==='Throat')
  );
  let type;
  if (definedCentres.size === 0)        type = 'Reflector';
  else if (sacralDef && motorToThroat)  type = 'Manifesting Generator';
  else if (sacralDef)                   type = 'Generator';
  else if (motorToThroat)               type = 'Manifestor';
  else                                  type = 'Projector';

  // Profile = Personality Sun line / Design Sun line
  const profile = `${P.Sun.line}/${D.Sun.line}`;

  // Authority — simplified priority ladder (expand for Ego/Self-Projected/etc.)
  let authority = 'None (Lunar/Environmental)';
  if (definedCentres.has('SolarPlexus'))     authority = 'Emotional (Solar Plexus)';
  else if (definedCentres.has('Sacral'))     authority = 'Sacral';
  else if (definedCentres.has('Spleen'))     authority = 'Splenic';
  else if (definedCentres.has('Heart'))      authority = 'Ego';
  else if (definedCentres.has('G'))          authority = 'Self-Projected (G)';
  else if (throatDef)                        authority = 'Mental (Outer Authority)';
  else if (type === 'Reflector')             authority = 'Lunar';

  return {
    birthUTC, designUTC,
    personality: P, design: D,
    activeGates: [...activeGates].sort((a,b) => a-b),
    channels: channelsActive.map(([a,b]) => `${a}-${b}`),
    definedCentres: [...definedCentres],
    type, profile, authority
  };
}

// ── Local time → UTC via IANA timezone ────────────────────────────────
// Browser-native using Intl.DateTimeFormat (handles historical DST rules).
export function localToUTC(yyyy, mm, dd, hh, mi, zone) {
  // Binary search: find UTC ms whose projection into `zone` matches the
  // given wall-clock. Handles the full IANA database via the browser.
  const target = Date.UTC(yyyy, mm - 1, dd, hh, mi);
  // Start guess: assume UTC=local, then correct by TZ offset iteratively.
  let utcMs = target;
  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', hour12:false
    }).formatToParts(new Date(utcMs));
    const m = {};
    parts.forEach(p => { if (p.type !== 'literal') m[p.type] = +p.value; });
    const projected = Date.UTC(m.year, m.month - 1, m.day,
                               m.hour === 24 ? 0 : m.hour, m.minute);
    const drift = target - projected;
    if (drift === 0) break;
    utcMs += drift;
  }
  return new Date(utcMs);
}
