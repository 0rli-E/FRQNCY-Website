# FRQNCY Human Design Engine — v2

Precision bodygraph calculator, free, pure-browser (no server, no paid API, no Swiss Ephemeris license).

## Architecture

- **`hd-engine.js`** — ES module. Loads `astronomy-engine` from esm.sh for sub-arcsec planetary positions. Exposes `computeChart(birthDateUTC)` → full chart (Personality + Design activations for Sun, Earth, Moon, Nodes, Mercury through Pluto; type, profile, authority, defined centres, active channels).
- **`calibration.html`** — Calibration harness. Runs the engine against `fixtures.json` and diffs every gate/line against Jovian Archive ground truth. Lets you tune `WHEEL_OFFSET` manually, or sweep −5° to +5° to auto-find the best value.
- **`fixtures.json`** — Known-good charts from Jovian Archive. **We need ≥5 fixtures total** to lock the wheel offset and verify across different birth dates / timezones / hemispheres.

## Status

- [x] Planetary positions via astronomy-engine (accurate to < 1 arcsec for Sun/Moon, < arcmin for outer planets — far beyond HD's 5.625° gate resolution)
- [x] Design moment solver (Newton iteration, exact 88° solar arc)
- [x] Local-time-to-UTC via IANA timezone (handles historical DST)
- [x] Gate-line-color-tone-base decomposition
- [x] Type / profile / authority / defined centres / active channels
- [x] Calibration harness with auto-sweep
- [ ] **Wheel offset calibrated against ≥5 Jovian Archive fixtures** ← blocking ship
- [ ] Node convention verified (mean vs true — HD uses mean per most sources)
- [ ] Design offset verified (88.0° vs 88.3° — some HD sources differ)
- [ ] Incarnation Cross derivation (Left Angle / Right Angle / Juxtaposition)
- [ ] Integrated into public `chart.html` once all fixtures pass

## How to calibrate

1. Grab a Jovian Archive chart printout for a known birth. Note: date, local time, city, IANA zone, and **all 26 activations** (13 bodies × 2 sides, each as `gate.line`).
2. Add it to `fixtures.json` following the schema.
3. Open `calibration.html` in a browser.
4. Click **Sweep** to auto-find the offset that maximises gate matches.
5. Once one fixture has all 26 matches, add the next fixture. The offset should stay stable across fixtures. If one fixture needs a different offset, there is a deeper bug (node convention, design offset, wheel sequence) — investigate before tuning further.
6. When all fixtures match at a single offset, bake that value into `hd-engine.js` and ship.

## Why this exists

`chart.html` (the public page) currently hands users off to Jovian Archive rather than shipping approximate bodygraphs under FRQNCY's brand. Once this v2 engine passes a rigorous fixture suite, it replaces the handoff and FRQNCY becomes the calculator.
