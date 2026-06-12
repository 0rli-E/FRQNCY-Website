// scripts/test-hd-engine.mjs
// Node test for the HD chart engine. Computes the two validation charts,
// prints computed vs expected, and raw-longitude sanity checks.
//
// Run: node scripts/test-hd-engine.mjs

import { computeChart, _internals } from '../my-frqncy/charts/hd-engine.js';

function fmt(n) { return Number(n).toFixed(4); }
function line(label, computed, expected) {
  const ok = String(computed) === String(expected);
  return `  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(12)} computed=${String(computed).padEnd(22)} expected=${expected}`;
}

let allPass = true;
function check(cond) { if (!cond) allPass = false; return cond; }

console.log('=================================================================');
console.log(' RAW SANITY CHECKS');
console.log('=================================================================');

// Sun apparent longitude at 2000-01-01 12:00 UTC -> ~280.0-280.5 (Capricorn)
const jd2000 = _internals.julianDayUTC(2000, 1, 1, 12, 0, 0);
const sun2000 = _internals.sunLonAtJDUT(jd2000, 2000, 1);
console.log(`Sun apparent longitude @ 2000-01-01 12:00 UTC = ${fmt(sun2000)} deg  (expect ~280.0-280.5, ${_internals.signOf(sun2000)})`);
check(sun2000 > 279.8 && sun2000 < 280.7);

// J2000 sanity for a few bodies
const j2000Bodies = _internals.bodyLongitudes(jd2000, 2000, 1);
console.log('J2000 body longitudes (deg):');
for (const b of ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'NorthNode']) {
  console.log(`   ${b.padEnd(10)} ${fmt(j2000Bodies[b])}  (${_internals.signOf(j2000Bodies[b])})`);
}
// Known reference apparent geocentric longitudes near 2000-01-01 12:00 TT (approx):
// Moon ~ 222 (Scorpio/Libra boundary region varies); Jupiter ~ 25 Aries; Saturn ~ 40 Taurus.

console.log('');
console.log('=================================================================');
console.log(' CHART A — Barack Obama (1961-08-04 19:24 HST, Honolulu)');
console.log('=================================================================');
const obama = computeChart({
  year: 1961, month: 8, day: 4, hour: 19, minute: 24, second: 0,
  tzOffsetMinutes: -600, lat: 21.3069, lon: -157.8583,
});
const oRaw = obama._raw.personality;
const oDes = obama._raw.design;
console.log(`birth JD(UT)=${fmt(obama._raw.birthJDUT)}  design JD(UT)=${fmt(obama._raw.designJDUT)}`);
console.log(`Personality Sun lon=${fmt(oRaw.Sun)} (${_internals.signOf(oRaw.Sun)}) gate=${_internals.gateOf(oRaw.Sun)} line=${_internals.lineOf(oRaw.Sun)}`);
console.log(`Design      Sun lon=${fmt(oDes.Sun)} (${_internals.signOf(oDes.Sun)}) gate=${_internals.gateOf(oDes.Sun)} line=${_internals.lineOf(oDes.Sun)}`);
console.log(line('Type', obama.hd.type, 'Projector'));
console.log(line('Authority', obama.hd.authority, 'Emotional'));
console.log(line('Profile', obama.hd.profile, '6/2'));
console.log(line('Sun sign', obama.astro.sun, 'Leo'));
console.log(`  (info)  Strategy=${obama.hd.strategy}  Rising=${obama.astro.rising}  Moon=${obama.astro.moon}`);
console.log(`  (info)  Defined centers: ${obama.hd.definedCenters.join(', ')}`);
check(obama.hd.type === 'Projector');
check(obama.hd.authority === 'Emotional');
check(obama.hd.profile === '6/2');
check(obama.astro.sun === 'Leo');

console.log('');
console.log('=================================================================');
console.log(' CHART B — Albert Einstein (1879-03-14 11:30 LMT, Ulm)');
console.log('=================================================================');
const einstein = computeChart({
  year: 1879, month: 3, day: 14, hour: 11, minute: 30, second: 0,
  tzOffsetMinutes: 40, lat: 48.40, lon: 9.99,
});
const eRaw = einstein._raw.personality;
const eDes = einstein._raw.design;
console.log(`birth JD(UT)=${fmt(einstein._raw.birthJDUT)}  design JD(UT)=${fmt(einstein._raw.designJDUT)}`);
console.log(`Personality Sun lon=${fmt(eRaw.Sun)} (${_internals.signOf(eRaw.Sun)}) gate=${_internals.gateOf(eRaw.Sun)} line=${_internals.lineOf(eRaw.Sun)}`);
console.log(`Design      Sun lon=${fmt(eDes.Sun)} (${_internals.signOf(eDes.Sun)}) gate=${_internals.gateOf(eDes.Sun)} line=${_internals.lineOf(eDes.Sun)}`);
console.log(line('Type', einstein.hd.type, 'Generator'));
console.log(line('Authority', einstein.hd.authority, 'Emotional'));
console.log(line('Profile', einstein.hd.profile, '1/4'));
console.log(line('Sun sign', einstein.astro.sun, 'Pisces'));
console.log(`  (info)  Strategy=${einstein.hd.strategy}  Rising=${einstein.astro.rising}  Moon=${einstein.astro.moon}`);
console.log(`  (info)  Defined centers: ${einstein.hd.definedCenters.join(', ')}`);
check(einstein.hd.type === 'Generator');
check(einstein.hd.authority === 'Emotional');
check(einstein.hd.profile === '1/4');
check(einstein.astro.sun === 'Pisces');

console.log('');
console.log('=================================================================');
console.log(' FULL RESULT OBJECTS');
console.log('=================================================================');
function strip(c) { const { _raw, ...rest } = c; return rest; }
console.log('OBAMA:', JSON.stringify(strip(obama), null, 2));
console.log('EINSTEIN:', JSON.stringify(strip(einstein), null, 2));

console.log('');
console.log(allPass ? '>>> ALL ACCEPTANCE CHECKS PASSED <<<' : '>>> SOME CHECKS FAILED <<<');
process.exit(allPass ? 0 : 1);
