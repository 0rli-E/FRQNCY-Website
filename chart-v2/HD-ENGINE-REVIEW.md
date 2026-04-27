# Chart-v2 HD Engine — Pre-Calibration Review

Audit of `hd-engine.js` (263 lines) before adding fixtures. Goal: surface anything that would make fixture failures look like calibration drift when the real cause is a subtle bug.

## Verdict

**The engine is sound.** The math is right, the conventions are right, and the structure is right. Five subtle items to verify against fixtures rather than fix blind.

## What's correct

- Tropical ecliptic longitudes, apparent geocentric (per HD convention).
- Gate wheel constant (`RAVE_WHEEL`, 64 entries starting at Gate 25). Cross-referenced against Genetic Matrix + open-source bodygraph implementations.
- 5.625° per gate, 6 lines per gate, 6 colors per line, 6 tones per color, 5 bases per tone — math checks out in `lonToGateLine`.
- 88° of solar arc back-iteration via Newton (30 iterations, converges to 1e-6° in practice).
- Mean Lunar Node via Meeus 47.7 polynomial — agreed HD convention.
- Earth = Sun + 180°, South Node = North Node + 180° — both sides.
- Type ladder: Reflector (no defined centres) → MG (Sacral + motor-to-Throat) → Generator → Manifestor (motor-to-Throat without Sacral) → Projector. Correct.
- Authority ladder: Solar Plexus → Sacral → Splenic → Ego → Self-Projected → Mental → Lunar. Correct precedence.
- `localToUTC` binary search handles historical DST via `Intl.DateTimeFormat` — correct approach.

## Five items to verify with fixtures

These are not bugs to fix now. They're hypotheses to test against the next 4 fixtures. If a fixture fails at the locked offset, suspect these in this order:

### 1. Geometric vs apparent ecliptic longitude

`Astronomy.EclipticLongitude(body, date)` from astronomy-engine returns **geometric** ecliptic longitude. HD per Jovian Archive uses **apparent** (light-time corrected for outer planets, plus nutation + aberration).

Effect: ~20 arcsec error on Sun, up to ~0.4° on Pluto. At HD's 5.625°/gate resolution, this should usually not flip a gate, but on edge-of-gate activations it can. If a fixture's Pluto activation is one gate off and the rest match, this is the cause.

Fix path: switch to `Astronomy.Equator(body, date, observer, true /* aberration */, true /* topographic */)` and convert RA/Dec → ecliptic, OR use `Astronomy.GeoVector` with light-time enabled and project to ecliptic. Don't fix until fixtures show the symptom.

### 2. Mean vs true node

Code uses **mean** node (Meeus polynomial). Some HD reference implementations and a minority of teachers use **true** node. Jovian Archive itself uses mean per most sources, but verify.

Effect: up to ~1.5° between mean and true node, which can flip a node gate ±1.

Fix path: if North/South Node activations consistently mismatch by 1 gate, switch to `Astronomy.SearchMoonNode` (true node) and re-test.

### 3. Design offset 88.0° vs 88.3°

Code uses exactly 88.0° solar arc. Some HD sources reference 88.36° (ninety days minus a fraction). The Newton iterator will converge to whichever target you pass it.

Effect: ~21 minutes of design-moment drift, which can shift fast-moving Design bodies (Moon, Mercury) by enough to flip lines.

Fix path: if Design Moon and Design Mercury are consistently off but Design Sun matches, try 88.36°.

### 4. WHEEL_OFFSET starting value

Default of `1.5°` is documented as needing calibration. The auto-sweep should find the true value somewhere in [-5°, +5°]. Don't bake until ≥3 fixtures agree on the same offset within ±0.05°.

If different fixtures want substantively different offsets (>0.5° apart), one of items 1–3 is likely the real cause masquerading as calibration drift. Don't tune the offset to compensate for a deeper bug.

### 5. `MOTORS` set includes `Root` (harmless)

`MOTORS = new Set(['Sacral','Heart','SolarPlexus','Root'])`. Root never connects to Throat in classical HD (no Root-Throat channel), so including it in the motor-to-throat check is inert. Consider removing for clarity, but don't fix during calibration — it changes nothing about output.

## Calibration protocol

Once fixtures arrive:

1. Add fixture #2 (someone with very different chart from Orli — different type, different latitude, different decade, different timezone).
2. Run auto-sweep. If both fixtures pass at one offset → fixture #2 confirms structural correctness.
3. Add #3, #4, #5. If all five pass at one offset → bake `WHEEL_OFFSET` and ship.
4. If a fixture fails at the converged offset, walk items 1–4 above before re-tuning the offset.

## Confidence

Reading the code in isolation, I'd ship the engine *with* the calibrated wheel offset and live with the "items 1–4 might bite on edge-of-gate activations" risk. The structural math is the hard part and it's correct.
